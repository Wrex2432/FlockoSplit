import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, Trophy, Zap, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="play-screen-bg play-screen-index flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="text-7xl mb-6"
        >
          📸
        </motion.div>

        <h1 className="text-5xl font-bold text-primary glow-text mb-4 tracking-tight">
          QR Race
        </h1>
        <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
          Count people with AI, reveal a QR code, race to scan it first. The fastest wins!
        </p>

        <div className="flex flex-col gap-4 items-center">
          <Link
            to="/game"
            className="w-full max-w-xs px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:opacity-90 transition-opacity glow-box flex items-center justify-center gap-3"
          >
            <Camera className="w-5 h-5" />
            Start Game
          </Link>
          <Link
            to="/leaderboard"
            className="w-full max-w-xs px-8 py-4 glass-panel text-foreground font-medium text-lg hover:border-primary/50 transition-colors flex items-center justify-center gap-3"
          >
            <Trophy className="w-5 h-5 text-glow-warn" />
            Leaderboard
          </Link>
        </div>

        {/* How it works */}
        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          {[
            { icon: Users, label: "Gather people", desc: "Get the target number in frame" },
            { icon: Zap, label: "Scan the QR", desc: "Race to scan first" },
            { icon: Trophy, label: "Win!", desc: "Fastest scanner takes the crown" },
          ].map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
