import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Zap, CheckCircle, AlertCircle, Bug } from "lucide-react";

type Phase = "name" | "question" | "submitting" | "success" | "error";

export default function ScanPage() {
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("name");
  const [errorMsg, setErrorMsg] = useState("");
  const [wrongAnswer, setWrongAnswer] = useState(false);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) return;
    setPhase("question");
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim().toLowerCase() !== "tachanko") {
      setWrongAnswer(true);
      return;
    }
    setWrongAnswer(false);
    await registerScan();
  };

  const registerScan = async () => {
    setPhase("submitting");

    const { data: round, error: roundError } = await supabase
      .from("game_rounds")
      .select("id, status")
      .in("status", ["countdown", "qr_reveal"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (roundError || !round) {
      setPhase("error");
      setErrorMsg("No active round right now. Wait for the next one!");
      return;
    }

    const { error: scanError } = await supabase
      .from("scans")
      .insert({ round_id: round.id, player_name: name.trim() });

    if (scanError) {
      setPhase("error");
      setErrorMsg("Failed to register your scan. Try again!");
      return;
    }

    setPhase("success");
  };

  const handleDevSkip = async () => {
    setName("DevPlayer");
    await registerScan();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 w-full max-w-sm text-center"
      >
        {phase === "success" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="flex flex-col items-center gap-4"
          >
            <CheckCircle className="w-16 h-16 text-accent" />
            <h2 className="text-2xl font-bold text-accent glow-accent">You're in!</h2>
            <p className="text-muted-foreground">
              Wait for the results on the big screen!
            </p>
          </motion.div>
        ) : phase === "error" ? (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <h2 className="text-xl font-bold text-destructive">{errorMsg}</h2>
            <button
              onClick={() => setPhase("name")}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : phase === "question" ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-primary glow-text mb-2">
              Anong last name ni Luke?
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">Answer to continue, {name}!</p>

            <form onSubmit={handleAnswerSubmit} className="space-y-4">
              <input
                type="text"
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); setWrongAnswer(false); }}
                placeholder="Your answer"
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-center text-lg"
                autoFocus
              />
              {wrongAnswer && (
                <p className="text-destructive text-sm font-medium">Wrong answer, try again!</p>
              )}
              <button
                type="submit"
                disabled={!answer.trim()}
                className="w-full px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Submit ✅
              </button>
            </form>
          </motion.div>
        ) : phase === "submitting" ? (
          <div className="flex flex-col items-center gap-4">
            <Zap className="w-12 h-12 text-primary animate-pulse" />
            <p className="text-muted-foreground">Registering...</p>
          </div>
        ) : (
          <>
            <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary glow-text mb-2">QR Race!</h2>
            <p className="text-muted-foreground mb-6">Enter your name to join</p>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-center text-lg"
                autoFocus
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                GO! ⚡
              </button>
            </form>
          </>
        )}
      </motion.div>

      {import.meta.env.DEV && (
        <button
          onClick={handleDevSkip}
          className="fixed bottom-4 right-4 p-3 bg-secondary/80 text-secondary-foreground rounded-full opacity-50 hover:opacity-100 transition-opacity"
          title="DEV: Skip to scan"
        >
          <Bug className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
