//statistiikan keräämiseen ja tallentamiseen liittyvät tilat sekä funktiot

import { useEffect, useMemo, useState } from "react";
import type { ThrowTurn, X01GameState } from "../../../types/X01Types";

type UseX01StatsParams = {
  state: X01GameState;
  isFinished: boolean;
  isMatchFinished: boolean;
  winnerId: string | null;
  mainPlayerId: string | null;
  setDoubleAttempts: (turnTimestamp: number, attempts: number) => void;
};

export function useX01Stats({
  state,
  isFinished,
  isMatchFinished,
  winnerId,
  mainPlayerId,
  setDoubleAttempts,
}: UseX01StatsParams) {
  const [showStatsPrompt, setShowStatsPrompt] = useState(false);
  const [dartsToCheckout, setDartsToCheckout] = useState<number | null>(null);
  const [bustDartsUsed, setBustDartsUsed] = useState<Record<string, number>>(
    {}
  );
  const [pendingBustTurn, setPendingBustTurn] = useState<ThrowTurn | null>(
    null
  );
  const [pendingDoubleTurn, setPendingDoubleTurn] = useState<ThrowTurn | null>(
    null
  );
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsSaved, setStatsSaved] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const isMainWinner =
    Boolean(mainPlayerId) &&
    Boolean(winnerId) &&
    winnerId === mainPlayerId;

  useEffect(() => {
    if (state.turns.length === 0) {
      setBustDartsUsed({});
      setPendingBustTurn(null);
      setPendingDoubleTurn(null);
      return;
    }

    const turnKeys = new Set(state.turns.map((turn) => `${turn.timestamp}`));
    setBustDartsUsed((prev) => {
      let changed = false;
      const next: Record<string, number> = {};
      for (const [key, value] of Object.entries(prev)) {
        if (turnKeys.has(key)) {
          next[key] = value;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });

  }, [state.turns]);

  useEffect(() => {
    if (isFinished || isMatchFinished) {
      setPendingBustTurn(null);
      return;
    }

    const missingBust = [...state.turns]
      .reverse()
      .find(
        (turn) =>
          turn.isBust &&
          turn.playerId === mainPlayerId &&
          bustDartsUsed[`${turn.timestamp}`] == null
      );
    setPendingBustTurn(missingBust ?? null);
  }, [bustDartsUsed, isFinished, isMatchFinished, mainPlayerId, state.turns]);

  useEffect(() => {
    if (state.turns.length === 0) {
      setPendingDoubleTurn(null);
      return;
    }

    const isDoubleOpportunity = (turn: ThrowTurn) => {
      if (turn.playerId !== mainPlayerId) return false;

      const inStartRange =
        turn.previousScore > 1 && turn.previousScore <= 50;
      const inEndRange = turn.newScore > 1 && turn.newScore <= 50;
      const wonLeg = !turn.isBust && turn.newScore === 0;

      return inStartRange || inEndRange || wonLeg;
    };

    const missingDouble = [...state.turns]
      .reverse()
      .find((turn) => {
        const key = `${turn.timestamp}`;
        if (turn.doubleAttempts != null) return false;
        if (!isDoubleOpportunity(turn)) return false;
        return true;
      });

    setPendingDoubleTurn(missingDouble ?? null);
  }, [mainPlayerId, state.turns]);

  useEffect(() => {
    if (!isMatchFinished) {
      setShowStatsPrompt(false);
      return;
    }
    if (!isMainWinner || statsSaved) {
      setShowStatsPrompt(false);
      return;
    }
    setShowStatsPrompt(true);
  }, [isMatchFinished, isMainWinner, statsSaved]);

  const resetStatsTracking = () => {
    setShowStatsPrompt(false);
    setDartsToCheckout(null);
    setBustDartsUsed({});
    setPendingBustTurn(null);
    setPendingDoubleTurn(null);
    setStatsSaving(false);
    setStatsSaved(false);
    setStatsError(null);
  };

  const statsSummary = useMemo(() => {
    if (!mainPlayerId) return null;
    const mainTurns = state.turns.filter(
      (turn) => turn.playerId === mainPlayerId
    );
    if (mainTurns.length === 0) return null;

    const lastOverallTurn =
      state.turns.length > 0 ? state.turns[state.turns.length - 1] : null;
    const isWinningTurn =
      isMainWinner &&
      lastOverallTurn != null &&
      lastOverallTurn.playerId === mainPlayerId;

    const totalPoints = mainTurns.reduce(
      (sum, turn) => sum + (turn.isBust ? 0 : turn.points),
      0
    );
    const checkoutDarts = dartsToCheckout ?? 3;
    const totalDartsThrown = mainTurns.reduce((sum, turn) => {
      if (isWinningTurn && lastOverallTurn?.timestamp === turn.timestamp) {
        return sum + checkoutDarts;
      }
      if (turn.isBust) {
        const key = `${turn.timestamp}`;
        return sum + (bustDartsUsed[key] ?? 3);
      }
      return sum + 3;
    }, 0);
    const checkout =
      isWinningTurn && lastOverallTurn && !lastOverallTurn.isBust
        ? lastOverallTurn.points
        : null;

    return {
      totalPoints,
      totalDartsThrown,
      checkout,
    };
  }, [
    bustDartsUsed,
    dartsToCheckout,
    isMainWinner,
    mainPlayerId,
    state.turns,
  ]);

  const handleBustDartsUsed = (value: number) => {
    if (!pendingBustTurn) return;
    const key = `${pendingBustTurn.timestamp}`;
    setBustDartsUsed((prev) => ({ ...prev, [key]: value }));
    setPendingBustTurn(null);
  };

  const handleDoubleDartsUsed = (value: number) => {
    if (!pendingDoubleTurn) return;
    setDoubleAttempts(pendingDoubleTurn.timestamp, value);
    setPendingDoubleTurn(null);
  };

  // Voiton tallennus: käytä kaikkia legin tuplayrityksiä.
  // Vain vahvistaa syötteet; varsinainen tallennus tehdään ottelun lopussa.
  const handleSaveStats = () => {
    if (!statsSummary) return;
    if (!isMainWinner) return;
    if (dartsToCheckout == null) return;
    if (pendingDoubleTurn) {
      setStatsError("Syötä tuplayritykset ennen tallennusta.");
      return;
    }
    if (statsSaving || statsSaved) return;

    setStatsSaving(true);
    setStatsError(null);

    setStatsSaved(true);
    setShowStatsPrompt(false);
    setStatsSaving(false);
  };

  return {
    showStatsPrompt,
    dartsToCheckout,
    setDartsToCheckout,
    statsSummary,
    showBustPrompt:
      Boolean(pendingBustTurn) && !isFinished && !isMatchFinished,
    handleBustDartsUsed,
    handleSaveStats,
    statsSaving,
    statsSaved,
    statsError,
    resetStatsTracking,
    showDoublePrompt: Boolean(pendingDoubleTurn) && !pendingBustTurn,
    pendingDoubleTurn,
    handleDoubleDartsUsed,
  };
}
