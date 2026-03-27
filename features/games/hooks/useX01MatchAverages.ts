//pelin keskiarvon laskentaan luotu hookki (vain frontissa)

import { useEffect, useMemo, useState } from "react";
import type { ThrowTurn } from "../../../types/X01Types";

type UseX01MatchAveragesParams = {
  turns: ThrowTurn[];
  isFinished: boolean;
};

export function useX01MatchAverages({ turns, isFinished }: UseX01MatchAveragesParams) 
{
  const [matchTurns, setMatchTurns] = useState<ThrowTurn[]>([]);
  const [storedFinishedLeg, setStoredFinishedLeg] = useState(false);

  // Kerätään legin kaikki heitot "matchTurns"-pinoon, kun legi päättyy.
  useEffect(() => {
    if (!isFinished) {
      setStoredFinishedLeg(false);
      return;
    }
    if (storedFinishedLeg) return;
    if (turns.length === 0) return;
    setMatchTurns((prev) => [...prev, ...turns]);
    setStoredFinishedLeg(true);
  }, [isFinished, storedFinishedLeg, turns]);

  const allMatchTurns = useMemo(
    () => (storedFinishedLeg ? matchTurns : [...matchTurns, ...turns]),
    [matchTurns, storedFinishedLeg, turns]
  );

  // 3-tikan keskiarvo koko ottelusta per pelaaja.
  const getPlayerAverage = (playerId: string) => {
    const playerTurns = allMatchTurns.filter(
      (turn) => turn.playerId === playerId
    );
    if (playerTurns.length === 0) return 0;
    const points = playerTurns.reduce(
      (sum, turn) => sum + (turn.isBust ? 0 : turn.points),
      0
    );
    const darts = playerTurns.length * 3;
    return darts > 0 ? (points / darts) * 3 : 0;
  };

  // Nollataan kun uusi peli alkaa
  const resetMatchAverages = () => {
    setMatchTurns([]);
    setStoredFinishedLeg(false);
  };

  return {
    getPlayerAverage,
    resetMatchAverages,
  };
}
