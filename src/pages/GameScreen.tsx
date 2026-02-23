import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { CameraCounter } from "@/components/game/CameraCounter";
import { QRCodeSVG } from "qrcode.react";

const NO_PEOPLE_BANNER_DELAY_MS = 10_000;
const QR_COVER_SPEED_MS = 900;
const QR_COVER_RISE_PERCENT = 88;
const QR_SIZE = 300;
const QR_COVER_SCALE = 1.45;
const QR_COVER_OFFSET_X_PX = 0;
const QR_COVER_OFFSET_Y_PX = 0;

const INTRO_BANNER_IMAGE = "/bg_intro.png";
const QR_BLOCKER_IMAGE = "/HAND.png";
const CLAIM_POPUP_IMAGE_1 = "/pr1.png";
const CLAIM_POPUP_IMAGE_2 = "/pr2.png";
const LAYER_TWO_BACKGROUND_IMAGE = "/bg_cam.png";

export default function GameScreen() {
  const [liveCount, setLiveCount] = useState(0);
  const [showIntroBanner, setShowIntroBanner] = useState(true);
  const [claimPopupStage, setClaimPopupStage] = useState<1 | 2 | null>(null);

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
    return Math.max(0, Math.min(liveCount / targetNumber, 1));
  }, [liveCount, targetNumber]);

  const coverTranslateY = -(proximity * QR_COVER_RISE_PERCENT);
  const scanUrl = `${window.location.origin}/scan`;

  return (
    <div className="play-screen-bg play-screen-game h-dvh w-full overflow-hidden relative">
      <main className="h-full w-full p-6">
        <section className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 relative rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${LAYER_TWO_BACKGROUND_IMAGE}')` }}
          />

          <div className="glass-panel p-4 h-full min-h-0">
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
              <QRCodeSVG
                value={scanUrl}
                size={QR_SIZE}
                bgColor="transparent"
                fgColor="hsl(175, 85%, 55%)"
                level="H"
              />

              <div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                  width: `${QR_SIZE * QR_COVER_SCALE}px`,
                  transform: `translate(calc(-50% + ${QR_COVER_OFFSET_X_PX}px), calc(-50% + ${QR_COVER_OFFSET_Y_PX}px + ${coverTranslateY}%))`,
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
            initial={{ opacity: 1 }}
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
              src={claimPopupStage === 1 ? CLAIM_POPUP_IMAGE_1 : CLAIM_POPUP_IMAGE_2}
              alt="Prize claimed popup"
              className="max-h-[92vh] max-w-[92vw] object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
