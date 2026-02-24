import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Phase = "name" | "question" | "submitting" | "success" | "error";

type ElementPosition = {
  width: string;
  height?: string;
  x: string;
  y: string;
};

const PHASE_BACKGROUNDS: Record<Phase, string> = {
  name: "/mobi_bg.png",
  question: "/mobi_bg.png",
  submitting: "/mobi_bg.png",
  success: "/mobi_bg.png",
  error: "/mobi_bg.png",
};

const NAME_SUBMIT_BUTTON_IMAGE = "/mob_butt.png";
const ANSWER_SUBMIT_BUTTON_IMAGE = "/mob_butt.png";
const CLAIM_BUTTON_IMAGE = "/mob_butt.png";
const CLAIM_BANNER_IMAGE = "/claim_banner.png";

const SUCCESS_IMAGE = "/mob1.png";
const ERROR_IMAGE = "/mob2.png";

const NAME_INPUT_POSITION: ElementPosition = { width: "min(86vw, 360px)", x: "50%", y: "52%" };
const NAME_BUTTON_POSITION: ElementPosition = { width: "min(70vw, 290px)", x: "50%", y: "66%" };

const QUESTION_INPUT_POSITION: ElementPosition = { width: "min(86vw, 360px)", x: "50%", y: "56%" };
const QUESTION_BUTTON_POSITION: ElementPosition = { width: "min(70vw, 290px)", x: "50%", y: "70%" };

const CLAIM_BANNER_POSITION: ElementPosition = { width: "min(86vw, 360px)", x: "50%", y: "52%" };
const CLAIM_BUTTON_POSITION: ElementPosition = { width: "min(70vw, 290px)", x: "50%", y: "75s%" };

const RESULT_SUCCESS_POSITION: ElementPosition = {
  width: "min(79vw, 458px)",
  x: "50%",
  y: "56%",
};

const RESULT_ERROR_POSITION: ElementPosition = {
  width: "min(79vw, 458px)",
  x: "50%",
  y: "56%",
};

const QUESTION_TEXT_POSITION: ElementPosition = { width: "min(90vw, 460px)", x: "50%", y: "46%" };
const WRONG_ANSWER_POSITION: ElementPosition = { width: "min(86vw, 360px)", x: "50%", y: "63%" };

const inputClassName =
  "w-full px-4 py-3 bg-transparent text-white placeholder:text-white/75 rounded-2xl border-[4px] border-white focus:outline-none focus:ring-0 text-center text-lg";

function anchoredStyle({ width, height, x, y }: ElementPosition) {
  return {
    position: "absolute" as const,
    width,
    height,
    left: x,
    top: y,
    transform: "translate(-50%, -50%)",
  };
}

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
      className="min-h-[100dvh] w-full bg-center bg-cover bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: `url('${PHASE_BACKGROUNDS[phase]}')` }}
    >
      {phase === "success" ? (
        <img src={SUCCESS_IMAGE} alt="Scan success" className="h-auto object-contain" style={anchoredStyle(RESULT_SUCCESS_POSITION)} />
      ) : phase === "error" ? (
        <img src={ERROR_IMAGE} alt="Scan failed" className="h-auto object-contain" style={anchoredStyle(RESULT_ERROR_POSITION)} />
      ) : phase === "submitting" ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <img
            src={CLAIM_BANNER_IMAGE}
            alt="Claim banner"
            className="h-auto object-contain"
            style={anchoredStyle(CLAIM_BANNER_POSITION)}
          />

          <button
            type="button"
            onClick={registerScan}
            disabled={isClaiming}
            style={anchoredStyle(CLAIM_BUTTON_POSITION)}
            className="disabled:opacity-40"
          >
            <img src={CLAIM_BUTTON_IMAGE} alt="Claim" className="w-full h-auto object-contain" />
          </button>
        </motion.div>
      ) : phase === "question" ? (
        <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleAnswerSubmit}>
          <p className="text-white text-center text-xl font-semibold" style={anchoredStyle(QUESTION_TEXT_POSITION)}>
            Full surname ni Luke?
          </p>

          <input
            type="text"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setWrongAnswer(false);
            }}
            placeholder="Your answer"
            className={inputClassName}
            style={anchoredStyle(QUESTION_INPUT_POSITION)}
            autoFocus
          />

          {wrongAnswer && (
            <p className="text-red-300 text-sm font-medium text-center" style={anchoredStyle(WRONG_ANSWER_POSITION)}>
              Wrong answer, try again!
            </p>
          )}

          <button type="submit" disabled={!answer.trim()} style={anchoredStyle(QUESTION_BUTTON_POSITION)} className="disabled:opacity-40">
            <img src={ANSWER_SUBMIT_BUTTON_IMAGE} alt="Submit answer" className="w-full h-auto object-contain" />
          </button>
        </motion.form>
      ) : (
        <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onSubmit={handleNameSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            className={inputClassName}
            style={anchoredStyle(NAME_INPUT_POSITION)}
            autoFocus
          />

          <button type="submit" disabled={!name.trim()} style={anchoredStyle(NAME_BUTTON_POSITION)} className="disabled:opacity-40">
            <img src={NAME_SUBMIT_BUTTON_IMAGE} alt="Submit name" className="w-full h-auto object-contain" />
          </button>
        </motion.form>
      )}
    </div>
  );
}
