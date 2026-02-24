import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GamePhase = "counting" | "qr_reveal" | "processing" | "results";
const QR_REVEAL_DURATION_SECONDS = 30;

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
  const [qrRevealTimeLeft, setQrRevealTimeLeft] = useState(QR_REVEAL_DURATION_SECONDS);
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const scanChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const clearRoundResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    if (scanChannelRef.current) {
      supabase.removeChannel(scanChannelRef.current);
      scanChannelRef.current = null;
    }
  }, []);

  const startNewRound = useCallback(async (reshuffleTarget = true) => {
    clearRoundResources();
    if (reshuffleTarget) {
      const newTarget = Math.floor(Math.random() * 7) + 2;
      setTargetNumber(newTarget);
    }
    setPhase("counting");
    setProcessingTime(10);
    setQrRevealTimeLeft(QR_REVEAL_DURATION_SECONDS);
    setScans([]);
    setWinner(null);
    setCurrentRound(null);
  }, [clearRoundResources]);

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
    clearRoundResources();
    setPhase("qr_reveal");
    setQrRevealTimeLeft(QR_REVEAL_DURATION_SECONDS);

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

    if (data) {
      const channel = supabase
        .channel(`round-scans-${data.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "scans", filter: `round_id=eq.${data.id}` },
          async () => {
            const { data: firstScan } = await supabase
              .from("scans")
              .select("player_name")
              .eq("round_id", data.id)
              .order("scanned_at", { ascending: true })
              .limit(1)
              .maybeSingle();

            if (!firstScan?.player_name || winner) return;

            clearRoundResources();
            setWinner(firstScan.player_name);
            await supabase
              .from("game_rounds")
              .update({ status: "results", winner_name: firstScan.player_name })
              .eq("id", data.id);
            setPhase("results");
            fetchResults(data.id);
          },
        )
        .subscribe();

      scanChannelRef.current = channel;
    }

    let t = QR_REVEAL_DURATION_SECONDS;
    const qrRevealInterval = setInterval(async () => {
      t--;
      setQrRevealTimeLeft(t);
      if (t <= 0) {
        clearRoundResources();
        if (data) {
          await supabase.from("game_rounds").update({ status: "counting" }).eq("id", data.id);
        }
        startNewRound(true);
      }
    }, 1000);
    timerRef.current = qrRevealInterval as any;
  }, [targetNumber, fetchResults, clearRoundResources, startNewRound, winner]);

  // Called when camera count >= target — proceed immediately to QR reveal
  const onTargetReached = useCallback(() => {
    if (phase !== "counting") return;
    proceedToQR();
  }, [phase, proceedToQR]);

  // No-op now that countdown hold mechanic is disabled
  const onTargetLost = useCallback(() => {}, []);

  useEffect(() => {
    return () => {
      clearRoundResources();
    };
  }, [clearRoundResources]);

  return {
    phase,
    targetNumber,
    currentRound,
    cameraCountdown: null,
    processingTime,
    qrRevealTimeLeft,
    scans,
    winner,
    onTargetReached,
    onTargetLost,
    startNewRound,
  };
}
