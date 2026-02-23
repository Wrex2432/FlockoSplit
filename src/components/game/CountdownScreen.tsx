import { motion, AnimatePresence } from "framer-motion";

interface CountdownScreenProps {
  value: number;
}

export function CountdownScreen({ value }: CountdownScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl text-primary glow-text font-semibold tracking-wide uppercase"
      >
        Hold Steady!
      </motion.p>

      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="counter-display text-[12rem] leading-none text-primary glow-text"
        >
          {value}
        </motion.div>
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-lg text-muted-foreground"
      >
        QR code incoming...
      </motion.p>
    </div>
  );
}
