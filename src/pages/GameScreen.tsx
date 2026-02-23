import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { CameraCounter } from "@/components/game/CameraCounter";
import { QRCodeSVG } from "qrcode.react";

const NO_PEOPLE_BANNER_DELAY_MS = 10_000;
const QR_COVER_SPEED_MS = 900;
const QR_COVER_RISE_PERCENT = 88;

const INTRO_BANNER_IMAGE = "/host-intro-banner-temp.png";
const QR_BLOCKER_IMAGE = "/qr-cover-temp.png";
const CLAIM_POPUP_IMAGE_1 = "/winner-popup-1-temp.png";
const CLAIM_POPUP_IMAGE_2 = "/winner-popup-2-temp.png";

export default function GameScreen() {
  const [liveCount, setLiveCount] = useState(0);
  const [showIntroBanner, setShowIntroBanner] = useState(true);
  const [claimPopupStage, setClaimPopupStage] = useState<1 | 2 | null>(null);

  const {
    phase,
    targetNumber,
    cameraCountdown,
    processingTime,
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
        <section className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-4 h-full min-h-0">
            <CameraCounter
              targetNumber={targetNumber}
              onTargetReached={onTargetReached}
              onTargetLost={onTargetLost}
              cameraCountdown={cameraCountdown}
              onCountChange={setLiveCount}
            />
          </div>

          <div className="glass-panel p-6 h-full flex flex-col items-center justify-center gap-6 relative overflow-hidden">
            <p className="text-xl md:text-2xl font-bold text-primary glow-text uppercase tracking-wider text-center">
              Scan to Join
            </p>

            <div className="relative p-4 md:p-6 rounded-2xl border border-border/60 bg-card/70">
              <QRCodeSVG
                value={scanUrl}
                size={300}
                bgColor="transparent"
                fgColor="hsl(175, 85%, 55%)"
                level="H"
              />

              <div
                className="absolute inset-0 pointer-events-none bg-center bg-cover bg-no-repeat"
                style={{
                  backgroundImage: `url('${QR_BLOCKER_IMAGE}')`,
                  transform: `translateY(${coverTranslateY}%)`,
                  transition: `transform ${QR_COVER_SPEED_MS}ms ease-in-out`,
                }}
              />
            </div>

            <div className="text-center">
              <p className="counter-display text-5xl text-primary glow-text">{liveCount} / {targetNumber}</p>
              {cameraCountdown !== null && cameraCountdown > 0 && (
                <p className="text-muted-foreground mt-2">Hold steady... {cameraCountdown}</p>
              )}
              {processingTime > 0 && phase === "qr_reveal" && (
                <p className="text-sm text-muted-foreground mt-2">Round closes in {processingTime}s</p>
              )}
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
