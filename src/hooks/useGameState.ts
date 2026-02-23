import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GamePhase = "counting" | "qr_reveal" | "processing" | "results";

interface RoundData {
  id: string;
  roundCode: string;
  targetNumber: number;
  winnerName?: string;
}

interface ScanEntry {
  player_name: string;
  scanned_at: string;
}

export function useGameState() {
  const [phase, setPhase] = useState<GamePhase>("counting");
  const [targetNumber, setTargetNumber] = useState(() => Math.floor(Math.random() * 7) + 2);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [processingTime, setProcessingTime] = useState(10);
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const startNewRound = useCallback(async (reshuffleTarget = true) => {
    if (reshuffleTarget) {
      const newTarget = Math.floor(Math.random() * 7) + 2;
      setTargetNumber(newTarget);
    }
    setPhase("counting");
    setProcessingTime(10);
    setScans([]);
    setWinner(null);
    setCurrentRound(null);
  }, []);

  const fetchResults = useCallback(async (roundId: string) => {
    const { data } = await supabase
      .from("scans")
      .select("player_name, scanned_at")
      .eq("round_id", roundId)
      .order("scanned_at", { ascending: true });

    const scanData = data || [];
    setScans(scanData);

    if (scanData.length > 0) {
      const winnerName = scanData[0].player_name;
      setWinner(winnerName);
      await supabase
        .from("game_rounds")
        .update({ status: "results", winner_name: winnerName })
        .eq("id", roundId);
      setPhase("results");
    } else {
      await supabase.from("game_rounds").update({ status: "counting" }).eq("id", roundId);
      await startNewRound(false);
    }
  }, [startNewRound]);

  const proceedToQR = useCallback(async () => {
    setPhase("qr_reveal");

    // Create round in DB
    const { data, error } = await supabase
      .from("game_rounds")
      .insert({ target_number: targetNumber, status: "qr_reveal" })
      .select()
      .single();

    if (data && !error) {
      setCurrentRound({
        id: data.id,
        roundCode: data.round_code,
        targetNumber: data.target_number,
      });
    }

    // Start 10s processing timer
    let t = 10;
    const procInterval = setInterval(() => {
      t--;
      setProcessingTime(t);
      if (t <= 0) {
        clearInterval(procInterval);
        setPhase("processing");
        if (data) {
          fetchResults(data.id);
        }
      }
    }, 1000);
    timerRef.current = procInterval as any;
  }, [targetNumber, fetchResults]);

  // Called when camera count >= target — proceed immediately to QR reveal
  const onTargetReached = useCallback(() => {
    if (phase !== "counting") return;
    proceedToQR();
  }, [phase, proceedToQR]);

  // No-op now that countdown hold mechanic is disabled
  const onTargetLost = useCallback(() => {}, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    phase,
    targetNumber,
    currentRound,
    cameraCountdown: null,
    processingTime,
    scans,
    winner,
    onTargetReached,
    onTargetLost,
    startNewRound,
  };
}
