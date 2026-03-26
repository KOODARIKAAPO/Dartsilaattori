import { useEffect, useMemo, useState } from "react";
import type { ThrowTurn, X01GameState } from "../../../types/X01Types";
import { auth } from "../../../firebase/Auth";
import { addGameForUser } from "../../../firebase/Firestore";

type UseX01StatsParams = {
  state: X01GameState;
  isFinished: boolean;
  isMatchFinished: boolean;
  winnerId: string | null;
};

export function useX01Stats({state, isFinished, isMatchFinished, winnerId, }: UseX01StatsParams) {
  const [showStatsPrompt, setShowStatsPrompt] = useState(false);
  const [dartsOnDouble, setDartsOnDouble] = useState<number | null>(null);
  const [dartsToCheckout, setDartsToCheckout] = useState<number | null>(null);
  const [bustDartsUsed, setBustDartsUsed] = useState<Record<string, number>>(
    {}
  );
  const [pendingBustTurn, setPendingBustTurn] = useState<ThrowTurn | null>(
    null
  );
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsSaved, setStatsSaved] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (state.turns.length === 0) {
      setBustDartsUsed({});
      setPendingBustTurn(null);
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
          turn.isBust && bustDartsUsed[`${turn.timestamp}`] == null
      );
    setPendingBustTurn(missingBust ?? null);
  }, [bustDartsUsed, isFinished, isMatchFinished, state.turns]);

  useEffect(() => {
    if (!isFinished) {
      setShowStatsPrompt(false);
      return;
    }
    if (statsSaved) return;
    setShowStatsPrompt(true);
  }, [isFinished, statsSaved]);

  const resetStatsTracking = () => {
    setShowStatsPrompt(false);
    setDartsOnDouble(null);
    setDartsToCheckout(null);
    setBustDartsUsed({});
    setPendingBustTurn(null);
    setStatsSaving(false);
    setStatsSaved(false);
    setStatsError(null);
  };

  const statsSummary = useMemo(() => {
    if (!isFinished || !winnerId) return null;
    if (state.turns.length === 0) return null;

    const lastIndex = state.turns.length - 1;
    const totalPoints = state.turns.reduce(
      (sum, turn) => sum + (turn.isBust ? 0 : turn.points),
      0
    );
    const checkoutDarts = dartsToCheckout ?? 3;
    const totalDartsThrown = state.turns.reduce((sum, turn, index) => {
      if (index === lastIndex) {
        return sum + checkoutDarts;
      }
      if (turn.isBust) {
        const key = `${turn.timestamp}`;
        return sum + (bustDartsUsed[key] ?? 3);
      }
      return sum + 3;
    }, 0);
    const lastTurn = state.turns[state.turns.length - 1];
    const checkout = lastTurn && !lastTurn.isBust ? lastTurn.points : null;

    return {
      totalPoints,
      totalDartsThrown,
      checkout,
    };
  }, [bustDartsUsed, dartsToCheckout, isFinished, state.turns, winnerId]);

  const handleBustDartsUsed = (value: number) => {
    if (!pendingBustTurn) return;
    const key = `${pendingBustTurn.timestamp}`;
    setBustDartsUsed((prev) => ({ ...prev, [key]: value }));
    setPendingBustTurn(null);
  };

  const handleSaveStats = async () => {
    if (!statsSummary) return;
    if (dartsOnDouble == null || dartsToCheckout == null) return;
    if (statsSaving || statsSaved) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setStatsError("Kirjaudu sisään tallentaaksesi tilastot.");
      return;
    }

    setStatsSaving(true);
    setStatsError(null);

    try {
      await addGameForUser(uid, {
        points: statsSummary.totalPoints,
        dartsThrown: statsSummary.totalDartsThrown,
        doublesAttempted: dartsOnDouble,
        doublesHit: 1,
        checkout: statsSummary.checkout,
      });
      setStatsSaved(true);
      setShowStatsPrompt(false);
    } catch (error) {
      setStatsError("Tilastojen tallennus epäonnistui.");
    } finally {
      setStatsSaving(false);
    }
  };

  return {
    showStatsPrompt,
    dartsOnDouble,
    setDartsOnDouble,
    dartsToCheckout,
    setDartsToCheckout,
    showBustPrompt: Boolean(pendingBustTurn) && !isFinished && !isMatchFinished,
    handleBustDartsUsed,
    handleSaveStats,
    statsSaving,
    statsSaved,
    statsError,
    resetStatsTracking,
  };
}
