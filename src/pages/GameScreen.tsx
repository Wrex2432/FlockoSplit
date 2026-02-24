import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { CameraCounter } from "@/components/game/CameraCounter";

const NO_PEOPLE_BANNER_DELAY_MS = 10_000;

const QR_COVER_SPEED_MS = 900;
const QR_COVER_RISE_PERCENT = 48;
const QR_COVER_SCALE = 4.27;
const QR_COVER_OFFSET_X_PX = 277;
const QR_COVER_OFFSET_Y_PX = -109;

// QR image controls
const QR_WIDTH_PX = 280;
const QR_HEIGHT_PX = 280;
const QR_OFFSET_X_PX = 0;
const QR_OFFSET_Y_PX = 100;

// Prize popup controls
const PRIZE_POPUP_1_WIDTH = "92vw";
const PRIZE_POPUP_1_MAX_HEIGHT = "92vh";
const PRIZE_POPUP_1_OFFSET_X_PX = 0;
const PRIZE_POPUP_1_OFFSET_Y_PX = 0;

const PRIZE_POPUP_2_WIDTH = "92vw";
const PRIZE_POPUP_2_MAX_HEIGHT = "92vh";
const PRIZE_POPUP_2_OFFSET_X_PX = 0;
const PRIZE_POPUP_2_OFFSET_Y_PX = 0;

const INTRO_BANNER_IMAGE = "/bg_intro.png";
const QR_BLOCKER_IMAGE = "/HAND2.png";
const CLAIM_POPUP_IMAGE_1 = "/pr1.png";
const CLAIM_POPUP_IMAGE_2 = "/pr2.png";
const LAYER_TWO_BACKGROUND_IMAGE = "/bg_cam.png";
const QR_IMAGE_POOL = [
  "/qr/BURGER.jpg",
  "/qr/CAKE.jpg",
  "/qr/CHICKEN.jpg",
  "/qr/PASTA.jpg",
  "/qr/PIZZA.jpg",
  "/qr/SALAD.jpg",
  "/qr/SANDWICH.jpg",
] as const;

export default function GameScreen() {
  const [liveCount, setLiveCount] = useState(0);
  const [showIntroBanner, setShowIntroBanner] = useState(true);
  const [claimPopupStage, setClaimPopupStage] = useState<1 | 2 | null>(null);
  const [activeQrImage, setActiveQrImage] = useState<string>(QR_IMAGE_POOL[0]);

  const {
    phase,
    targetNumber,
    cameraCountdown,
    winner,
    onTargetReached,
    onTargetLost,
    startNewRound,
  } = useGameState();

  useEffect(() => {
    let bannerTimer: ReturnType<typeof setTimeout> | undefined;

    if (liveCount > 0) {
      setShowIntroBanner(false);
      return;
    }

    bannerTimer = setTimeout(() => {
      setShowIntroBanner(true);
    }, NO_PEOPLE_BANNER_DELAY_MS);

    return () => {
      if (bannerTimer) clearTimeout(bannerTimer);
    };
  }, [liveCount]);

  useEffect(() => {
    if (phase !== "results" || !winner) {
      setClaimPopupStage(null);
      return;
    }

    setClaimPopupStage(1);

    const secondStageTimer = setTimeout(() => {
      setClaimPopupStage(2);
    }, 8000);

    const resetTimer = setTimeout(() => {
      setClaimPopupStage(null);
      setShowIntroBanner(true);
      startNewRound();
    }, 13_000);

    return () => {
      clearTimeout(secondStageTimer);
      clearTimeout(resetTimer);
    };
  }, [phase, winner, startNewRound]);

  const proximity = useMemo(() => {
    if (!targetNumber) return 0;
    if (liveCount > targetNumber) return 0;
    return Math.max(0, Math.min(liveCount / targetNumber, 1));
  }, [liveCount, targetNumber]);

  const coverTranslateY = -(proximity * QR_COVER_RISE_PERCENT);

  useEffect(() => {
    setActiveQrImage((previousQrImage) => {
      const available = QR_IMAGE_POOL.filter((image) => image !== previousQrImage);
      const nextIndex = Math.floor(Math.random() * available.length);
      return available[nextIndex] ?? QR_IMAGE_POOL[0];
    });
  }, [targetNumber]);

  const isPopupOne = claimPopupStage === 1;
  const popupWidth = isPopupOne ? PRIZE_POPUP_1_WIDTH : PRIZE_POPUP_2_WIDTH;
  const popupMaxHeight = isPopupOne ? PRIZE_POPUP_1_MAX_HEIGHT : PRIZE_POPUP_2_MAX_HEIGHT;
  const popupOffsetX = isPopupOne ? PRIZE_POPUP_1_OFFSET_X_PX : PRIZE_POPUP_2_OFFSET_X_PX;
  const popupOffsetY = isPopupOne ? PRIZE_POPUP_1_OFFSET_Y_PX : PRIZE_POPUP_2_OFFSET_Y_PX;

  return (
    <div className="play-screen-bg play-screen-game h-dvh w-full overflow-hidden relative">
      <main className="h-full w-full">
        <section className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${LAYER_TWO_BACKGROUND_IMAGE}')` }}
          />

          <div className="p-4 h-full min-h-0">
            <CameraCounter
              targetNumber={targetNumber}
              onTargetReached={onTargetReached}
              onTargetLost={onTargetLost}
              cameraCountdown={cameraCountdown}
              onCountChange={setLiveCount}
            />
          </div>

          <div className="h-full flex items-center justify-center overflow-visible">
            <div className="relative overflow-visible">
              <div
                style={{
                  transform: `translate(${QR_OFFSET_X_PX}px, ${QR_OFFSET_Y_PX}px)`,
                }}
              >
                <img
                  src={activeQrImage}
                  alt="Active QR"
                  width={QR_WIDTH_PX}
                  height={QR_HEIGHT_PX}
                  className=""
                />
              </div>

              <div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                  width: `${QR_WIDTH_PX * QR_COVER_SCALE}px`,
                  transform: `translate(calc(-50% + ${QR_COVER_OFFSET_X_PX + QR_OFFSET_X_PX}px), calc(-50% + ${QR_COVER_OFFSET_Y_PX}px + ${coverTranslateY}%))`,
                  transition: `transform ${QR_COVER_SPEED_MS}ms ease-in-out`,
                }}
              >
                <img
                  src={QR_BLOCKER_IMAGE}
                  alt="QR cover"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showIntroBanner && (
          <motion.div
            key="intro-banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-30"
          >
            <img
              src={INTRO_BANNER_IMAGE}
              alt="Game intro banner"
              className="h-full w-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {claimPopupStage && (
          <motion.div
            key={`claim-popup-${claimPopupStage}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <img
              src={isPopupOne ? CLAIM_POPUP_IMAGE_1 : CLAIM_POPUP_IMAGE_2}
              alt="Prize claimed popup"
              style={{
                width: popupWidth,
                maxHeight: popupMaxHeight,
                transform: `translate(${popupOffsetX}px, ${popupOffsetY}px)`,
              }}
              className="object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
