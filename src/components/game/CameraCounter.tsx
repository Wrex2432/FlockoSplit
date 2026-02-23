import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePersonDetection } from "@/hooks/usePersonDetection";
import { Camera } from "lucide-react";

interface CameraCounterProps {
  targetNumber: number;
  onTargetReached: () => void;
  onTargetLost: () => void;
  cameraCountdown: number | null;
  onCountChange?: (count: number) => void;
}

const TARGET_NUMBER_BACKGROUND_IMAGE = "/target-number-bg-temp.png";

// Target badge controls
const TARGET_BADGE_WIDTH = "min(42vw, 420px)";
const TARGET_BADGE_HEIGHT = "min(18vh, 140px)";
const TARGET_BADGE_X = "50%";
const TARGET_BADGE_Y = "4%";

// Camera window controls
const CAMERA_WINDOW_WIDTH = "90%";
const CAMERA_WINDOW_HEIGHT = "86%";
const CAMERA_WINDOW_X = "50%";
const CAMERA_WINDOW_Y = "56%";

export function CameraCounter({ targetNumber, onTargetReached, onTargetLost, cameraCountdown, onCountChange }: CameraCounterProps) {
  const { videoRef, canvasRef, count, isLoading, error } = usePersonDetection();
  const prevAboveTarget = useRef(false);

  useEffect(() => {
    const isAbove = count >= targetNumber;
    if (isAbove && !prevAboveTarget.current) {
      onTargetReached();
    } else if (!isAbove && prevAboveTarget.current) {
      onTargetLost();
    }
    prevAboveTarget.current = isAbove;
  }, [count, targetNumber, onTargetReached, onTargetLost]);

  useEffect(() => {
    onCountChange?.(count);
  }, [count, onCountChange]);

  return (
    <div className="h-full w-full relative overflow-visible">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute z-30 flex items-center justify-center bg-center bg-contain bg-no-repeat pointer-events-none"
        style={{
          width: TARGET_BADGE_WIDTH,
          height: TARGET_BADGE_HEIGHT,
          left: TARGET_BADGE_X,
          top: TARGET_BADGE_Y,
          transform: "translateX(-50%)",
          backgroundImage: `url('${TARGET_NUMBER_BACKGROUND_IMAGE}')`,
        }}
      >
        <span className="counter-display text-6xl md:text-7xl text-primary glow-text">{targetNumber}</span>
      </motion.div>

      <div
        className="absolute z-10 min-h-0 rounded-2xl overflow-hidden border-2 border-border glow-box"
        style={{
          width: CAMERA_WINDOW_WIDTH,
          height: CAMERA_WINDOW_HEIGHT,
          left: CAMERA_WINDOW_X,
          top: CAMERA_WINDOW_Y,
          transform: "translate(-50%, -50%)",
        }}
      >
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
            <Camera className="w-12 h-12 text-primary animate-pulse" />
            <p className="text-muted-foreground">Loading camera & AI model...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-3 p-8">
            <Camera className="w-12 h-12 text-destructive" />
            <p className="text-destructive text-center">{error}</p>
          </div>
        )}

        <AnimatePresence>
          {cameraCountdown !== null && cameraCountdown > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center z-10"
            >
              <motion.p className="text-xl text-primary glow-text font-semibold mb-2">Hold Steady!</motion.p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={cameraCountdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="counter-display text-[9rem] leading-none text-primary glow-text"
                >
                  {cameraCountdown}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={count}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="absolute bottom-4 right-4 glass-panel px-4 py-2 flex items-center gap-2"
        >
          <span className="text-sm text-muted-foreground">Detected:</span>
          <span className="counter-display text-3xl text-primary glow-text">{count}</span>
          <span className="text-sm text-muted-foreground">/ {targetNumber}</span>
        </motion.div>
      </div>
    </div>
  );
}
