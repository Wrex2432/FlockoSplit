import { motion } from "framer-motion";
import { Trophy, Medal, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface ScanEntry {
  player_name: string;
  scanned_at: string;
}

interface ResultsScreenProps {
  winner: string | null;
  scans: ScanEntry[];
  onRestart: () => void;
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: ["hsl(175,85%,55%)", "hsl(145,75%,55%)", "hsl(45,100%,60%)", "hsl(280,80%,60%)"][i % 4],
    size: Math.random() * 8 + 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

export function ResultsScreen({ winner, scans, onRestart }: ResultsScreenProps) {
  const [showRestart, setShowRestart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRestart(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const firstScanTime = scans.length > 0 ? new Date(scans[0].scanned_at) : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {winner && <Confetti />}

      {winner ? (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          >
            <Trophy className="w-20 h-20 text-glow-warn" style={{ filter: "drop-shadow(0 0 20px hsl(45 100% 60% / 0.6))" }} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-accent glow-accent"
          >
            {winner} wins!
          </motion.h2>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-2xl text-muted-foreground">No one scanned this round!</p>
        </motion.div>
      )}

      {/* Leaderboard */}
      {scans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6 w-full max-w-md"
        >
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Medal className="w-5 h-5" /> Rankings
          </h3>
          <div className="space-y-3">
            {scans.map((scan, i) => {
              const scanTime = new Date(scan.scanned_at);
              const diff = firstScanTime ? (scanTime.getTime() - firstScanTime.getTime()) / 1000 : 0;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    i === 0 ? "bg-accent/10 border border-accent/30" : "bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="counter-display text-lg text-muted-foreground w-6">
                      {i + 1}
                    </span>
                    <span className={i === 0 ? "text-accent font-semibold" : "text-foreground"}>
                      {scan.player_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{i === 0 ? "First!" : `+${diff.toFixed(2)}s`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {showRestart && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onRestart}
          className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity glow-box"
        >
          Next Round →
        </motion.button>
      )}
    </div>
  );
}
