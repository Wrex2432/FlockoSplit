import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { CameraCounter } from "@/components/game/CameraCounter";
import { QRReveal } from "@/components/game/QRReveal";
import { ProcessingScreen } from "@/components/game/ProcessingScreen";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export default function GameScreen() {
  const [devMode, setDevMode] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" || e.key === "N") setDevMode((d) => !d);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const {
    phase,
    targetNumber,
    currentRound,
    cameraCountdown,
    processingTime,
    scans,
    winner,
    onTargetReached,
    onTargetLost,
    startNewRound,
  } = useGameState();

  const proximity = Math.max(0, Math.min(1, targetNumber ? liveCount / targetNumber : 0));
  const midFloatStyle = {
    transform: `translate(-50%, calc(-50% - (${proximity} * var(--mid-image-lift))))`,
  };

  return (
    <div className="play-screen-bg play-screen-game p-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-primary glow-text tracking-tight"
        >
          📸 QR Race
        </motion.h1>
        <Link
          to="/leaderboard"
          className="flex items-center gap-2 px-4 py-2 glass-panel text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Trophy className="w-4 h-4" />
          Leaderboard
        </Link>
      </header>

      {/* Dev Tools */}
      {devMode && phase === "counting" && (
        <button
          onClick={onTargetReached}
          className="fixed bottom-4 right-4 z-50 px-3 py-1.5 text-xs font-mono bg-destructive/20 text-destructive border border-destructive/30 rounded hover:bg-destructive/30 transition-colors"
        >
          DEV: Skip to QR
        </button>
      )}

      {/* Game phases */}
      <main className="game-stage">
        {phase === "counting" && (
          <>
            <div className="game-side-overlay">
              <div className="w-full h-full flex items-center justify-center">
                <span className="counter-display text-6xl text-primary glow-text">{targetNumber}</span>
              </div>
            </div>
            <div className="game-mid-float" style={midFloatStyle} />
          </>
        )}

        {phase === "counting" && (
          <CameraCounter
            targetNumber={targetNumber}
            onTargetReached={onTargetReached}
            onTargetLost={onTargetLost}
            cameraCountdown={cameraCountdown}
            onCountChange={setLiveCount}
          />
        )}
        {phase === "qr_reveal" && (
          <div className="w-full h-full flex items-center justify-center">
            <QRReveal timeLeft={processingTime} />
          </div>
        )}
        {phase === "processing" && (
          <div className="w-full h-full flex items-center justify-center">
            <ProcessingScreen />
          </div>
        )}
        {phase === "results" && (
          <div className="w-full h-full flex items-center justify-center">
            <ResultsScreen winner={winner} scans={scans} onRestart={startNewRound} />
          </div>
        )}
      </main>
    </div>
  );
}
