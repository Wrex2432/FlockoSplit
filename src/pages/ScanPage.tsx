import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Phase = "name" | "question" | "submitting" | "success" | "error";

const PHASE_BACKGROUNDS: Record<Phase, string> = {
  name: "/scan-bg-name-temp.png",
  question: "/scan-bg-question-temp.png",
  submitting: "/scan-bg-submitting-temp.png",
  success: "/scan-bg-success-temp.png",
  error: "/scan-bg-error-temp.png",
};

const NAME_SUBMIT_BUTTON_IMAGE = "/btn-name-submit-temp.png";
const ANSWER_SUBMIT_BUTTON_IMAGE = "/btn-answer-submit-temp.png";
const CLAIM_BUTTON_IMAGE = "/btn-claim-temp.png";
const CLAIM_BANNER_IMAGE = "/scan-claim-banner-temp.png";

const SUCCESS_IMAGE = "/scan-success-temp.png";
const ERROR_IMAGE = "/scan-fail-temp.png";

const inputClassName =
  "w-full px-4 py-3 bg-transparent text-white placeholder:text-white/75 rounded-2xl border-[4px] border-white focus:outline-none focus:ring-0 text-center text-lg";

const imageButtonClassName =
  "w-full max-w-sm mx-auto block disabled:opacity-40 hover:opacity-90 transition-opacity";

export default function ScanPage() {
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("name");
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) return;
    setPhase("question");
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim().toLowerCase() !== "tachanko") {
      setWrongAnswer(true);
      return;
    }
    setWrongAnswer(false);
    setPhase("submitting");
  };

  const registerScan = async () => {
    if (isClaiming) return;
    setIsClaiming(true);

    const { data: round, error: roundError } = await supabase
      .from("game_rounds")
      .select("id, status")
      .in("status", ["countdown", "qr_reveal"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (roundError || !round) {
      setIsClaiming(false);
      setPhase("error");
      return;
    }

    const { error: scanError } = await supabase
      .from("scans")
      .insert({ round_id: round.id, player_name: name.trim() });

    setIsClaiming(false);
    if (scanError) {
      setPhase("error");
      return;
    }

    setPhase("success");
  };

  return (
    <div
      className="min-h-[100dvh] w-full bg-center bg-cover bg-no-repeat flex flex-col items-center justify-center p-6"
      style={{ backgroundImage: `url('${PHASE_BACKGROUNDS[phase]}')` }}
    >
      {phase === "success" ? (
        <img src={SUCCESS_IMAGE} alt="Scan success" className="w-[min(90vw,520px)] h-auto object-contain" />
      ) : phase === "error" ? (
        <img src={ERROR_IMAGE} alt="Scan failed" className="w-[min(90vw,520px)] h-auto object-contain" />
      ) : phase === "submitting" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-4"
        >
          <img src={CLAIM_BANNER_IMAGE} alt="Claim banner" className="w-full h-auto object-contain" />

          <button
            type="button"
            onClick={registerScan}
            disabled={isClaiming}
            className={imageButtonClassName}
          >
            <img src={CLAIM_BUTTON_IMAGE} alt="Claim" className="w-full h-auto object-contain" />
          </button>
        </motion.div>
      ) : phase === "question" ? (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleAnswerSubmit}
          className="w-full max-w-sm space-y-4"
        >
          <input
            type="text"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setWrongAnswer(false);
            }}
            placeholder="Your answer"
            className={inputClassName}
            autoFocus
          />
          {wrongAnswer && <p className="text-red-300 text-sm font-medium text-center">Wrong answer, try again!</p>}

          <button type="submit" disabled={!answer.trim()} className={imageButtonClassName}>
            <img src={ANSWER_SUBMIT_BUTTON_IMAGE} alt="Submit answer" className="w-full h-auto object-contain" />
          </button>
        </motion.form>
      ) : (
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleNameSubmit}
          className="w-full max-w-sm space-y-4"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            className={inputClassName}
            autoFocus
          />

          <button type="submit" disabled={!name.trim()} className={imageButtonClassName}>
            <img src={NAME_SUBMIT_BUTTON_IMAGE} alt="Submit name" className="w-full h-auto object-contain" />
          </button>
        </motion.form>
      )}
    </div>
  );
}
