import { useEffect, useMemo, useState } from "react";
import type { ThrowTurn, X01GameState } from "../../../types/X01Types";
import { auth } from "../../../firebase/Auth";
import { addGameForUser } from "../../../firebase/Firestore";

type UseX01StatsParams = {
  state: X01GameState;
  isFinished: boolean;
  isMatchFinished: boolean;
  winnerId: string | null;
  mainPlayerId: string | null;
};

export function useX01Stats({
  state,
  isFinished,
  isMatchFinished,
  winnerId,
  mainPlayerId,
}: UseX01StatsParams) {
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

  // Tilastot kirjataan vain "pääpelaajalle" (ensimmäinen pelaaja).
  const isMainWinner =
    Boolean(mainPlayerId) &&
    Boolean(winnerId) &&
    winnerId === mainPlayerId;

  // Siivotaan bustien seurantaa jos heittolistasta poistuu rivejä (undo/reset).
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

  // Etsitään uusin bust, josta puuttuu "montako tikkaa" -syöte.
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

  // Näytetään tilastoprompti vain jos pääpelaaja voitti legin.
  useEffect(() => {
    if (!isFinished) {
      setShowStatsPrompt(false);
      return;
    }
    if (!isMainWinner || statsSaved) {
      setShowStatsPrompt(false);
      return;
    }
    setShowStatsPrompt(true);
  }, [isFinished, isMainWinner, statsSaved]);

  // Nollataan prompttien ja tilastojen tilat uuden legin/matsin alussa.
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

  // Lasketaan pääpelaajan pisteet ja tikat; checkout vain jos hän voitti.
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

  // Tallennetaan yksi peli Firestoreen; aggregaattitilastot päivittyvät palvelimella.
  const handleSaveStats = async () => {
    if (!statsSummary) return;
    if (!isMainWinner) return;
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

  // Jos pääpelaaja häviää, kirjataan hänen pisteet/tikat automaattisesti ilman prompttia.
  useEffect(() => {
    if (!isFinished) return;
    if (!mainPlayerId) return;
    if (statsSaved || statsSaving) return;
    if (!winnerId || winnerId === mainPlayerId) return;
    if (!statsSummary) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const saveLoss = async () => {
      try {
        setStatsSaving(true);
        await addGameForUser(uid, {
          points: statsSummary.totalPoints,
          dartsThrown: statsSummary.totalDartsThrown,
          doublesAttempted: 0,
          doublesHit: 0,
          checkout: null,
        });
        setStatsSaved(true);
      } catch (error) {
        setStatsError("Tilastojen tallennus epäonnistui.");
      } finally {
        setStatsSaving(false);
      }
    };

    void saveLoss();
  }, [
    isFinished,
    mainPlayerId,
    statsSaved,
    statsSaving,
    statsSummary,
    winnerId,
  ]);

  return {
    showStatsPrompt,
    dartsOnDouble,
    setDartsOnDouble,
    dartsToCheckout,
    setDartsToCheckout,
    showBustPrompt:
      Boolean(pendingBustTurn) && !isFinished && !isMatchFinished,
    handleBustDartsUsed,
    handleSaveStats,
    statsSaving,
    statsSaved,
    statsError,
    resetStatsTracking,
  };
}
