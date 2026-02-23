import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, ArrowLeft, Crown } from "lucide-react";
import { Link } from "react-router-dom";

interface WinnerEntry {
  winner_name: string;
  created_at: string;
  target_number: number;
}

export default function Leaderboard() {
  const [winners, setWinners] = useState<WinnerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      const { data } = await supabase
        .from("game_rounds")
        .select("winner_name, created_at, target_number")
        .eq("status", "results")
        .not("winner_name", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      setWinners((data as WinnerEntry[]) || []);
      setLoading(false);
    };

    fetchWinners();

    // Realtime updates
    const channel = supabase
      .channel("leaderboard")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_rounds" }, (payload) => {
        const row = payload.new as any;
        if (row.status === "results" && row.winner_name) {
          setWinners((prev) => [
            { winner_name: row.winner_name, created_at: row.created_at, target_number: row.target_number },
            ...prev,
          ]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Aggregate win counts
  const winCounts: Record<string, number> = {};
  winners.forEach((w) => {
    winCounts[w.winner_name] = (winCounts[w.winner_name] || 0) + 1;
  });
  const ranked = Object.entries(winCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  return (
    <div className={`${ranked.length > 0 ? "play-screen-bg play-screen-leaderboard" : "min-h-screen bg-background"} p-6`}>
      <header className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 glass-panel hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <Trophy className="w-7 h-7 text-glow-warn" style={{ filter: "drop-shadow(0 0 10px hsl(45 100% 60% / 0.5))" }} />
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Loading...</div>
      ) : ranked.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-xl">No winners yet!</p>
          <p className="mt-2">Start a game to see results here.</p>
        </div>
      ) : (
        <div className="max-w-lg mx-auto space-y-3">
          {ranked.map(([name, wins], i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between py-4 px-5 rounded-xl ${
                i === 0
                  ? "bg-accent/10 border-2 border-accent/40 glow-box-accent"
                  : i < 3
                  ? "bg-primary/5 border border-primary/20"
                  : "glass-panel"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="counter-display text-2xl text-muted-foreground w-8">
                  {i === 0 ? <Crown className="w-6 h-6 text-glow-warn" /> : `#${i + 1}`}
                </span>
                <span className={`text-lg ${i === 0 ? "text-accent font-bold" : "text-foreground font-medium"}`}>
                  {name}
                </span>
              </div>
              <span className="counter-display text-xl text-primary">
                {wins} {wins === 1 ? "win" : "wins"}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent rounds */}
      {winners.length > 0 && (
        <div className="max-w-lg mx-auto mt-12">
          <h2 className="text-xl font-semibold text-muted-foreground mb-4">Recent Rounds</h2>
          <div className="space-y-2">
            {winners.slice(0, 10).map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-4 glass-panel text-sm">
                <span className="text-foreground">{w.winner_name}</span>
                <span className="text-muted-foreground">
                  {new Date(w.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
