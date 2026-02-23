import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

interface QRRevealProps {
  timeLeft: number;
}

export function QRReveal({ timeLeft }: QRRevealProps) {
  const scanUrl = `${window.location.origin}/scan`;

  return (
    <div className="flex flex-col items-center justify-center gap-8 min-h-[60vh]">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-primary glow-text uppercase tracking-wider"
      >
        Scan Now!
      </motion.p>

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="glass-panel p-6 glow-box"
      >
        <QRCodeSVG
          value={scanUrl}
          size={280}
          bgColor="transparent"
          fgColor="hsl(175, 85%, 55%)"
          level="H"
        />
      </motion.div>

      <div className="flex items-center gap-4">
        <div className="counter-display text-5xl text-glow-warn" style={{ textShadow: "0 0 20px hsl(45 100% 60% / 0.6)" }}>
          {timeLeft}s
        </div>
        <span className="text-muted-foreground text-lg">remaining</span>
      </div>

      <p className="text-sm text-muted-foreground">
        Point your phone camera at the QR code to play!
      </p>
    </div>
  );
}
