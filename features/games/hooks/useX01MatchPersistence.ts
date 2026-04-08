// Persists finished X01 matches to Firestore once totals are ready.
import { useEffect, useState } from "react";
import { auth } from "../../../firebase/Auth";
import { addGameForUser } from "../../../firebase/Firestore";

type MatchTotals = {
  points: number;
  dartsThrown: number;
  highestCheckout: number;
};

type Params = {
  isMatchFinished: boolean;
  mainPlayerId: string | null;
  pendingDoubleTurn: unknown;
  matchTotals: MatchTotals;
  matchWins: Record<string, number>;
  matchWinnerId: string | null;
  statsSaved: boolean;
  effectiveAttempts: Record<string, number>;
  isTotalsAggregated: boolean;
};

export function useX01MatchPersistence({
  isMatchFinished,
  mainPlayerId,
  pendingDoubleTurn,
  matchTotals,
  matchWins,
  matchWinnerId,
  statsSaved,
  effectiveAttempts,
  isTotalsAggregated,
}: Params) {
  const [matchSaving, setMatchSaving] = useState(false);
  const [matchSaved, setMatchSaved] = useState(false);

  useEffect(() => {
    if (!isMatchFinished) return;
    if (matchSaved || matchSaving) return;
    if (!mainPlayerId) return;
    if (pendingDoubleTurn) return;
    if (!isTotalsAggregated) return;
    if (matchWinnerId === mainPlayerId && !statsSaved) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const saveMatch = async () => {
      try {
        setMatchSaving(true);
        await addGameForUser(uid, {
          points: matchTotals.points,
          dartsThrown: matchTotals.dartsThrown,
          doublesAttempted: effectiveAttempts[mainPlayerId] ?? 0,
          doublesHit: matchWins[mainPlayerId] ?? 0,
          checkout: matchTotals.highestCheckout || null,
        });
        setMatchSaved(true);
      } finally {
        setMatchSaving(false);
      }
    };

    void saveMatch();
  }, [
    effectiveAttempts,
    isMatchFinished,
    isTotalsAggregated,
    mainPlayerId,
    matchSaved,
    matchSaving,
    matchTotals.dartsThrown,
    matchTotals.highestCheckout,
    matchTotals.points,
    matchWinnerId,
    matchWins,
    pendingDoubleTurn,
    statsSaved,
  ]);

  const resetMatchPersistence = () => {
    setMatchSaving(false);
    setMatchSaved(false);
  };

  return {
    matchSaving,
    matchSaved,
    resetMatchPersistence,
  };
}
