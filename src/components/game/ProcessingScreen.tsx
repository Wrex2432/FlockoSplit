import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function ProcessingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      >
        <Loader2 className="w-16 h-16 text-primary" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-semibold text-primary glow-text"
      >
        Tallying results...
      </motion.p>

      <motion.div
        className="flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-primary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
