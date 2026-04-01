//Pelin tila hookki. 
import { useEffect, useMemo, useState } from "react";

type PlayerInput = {
  id: string;
  name: string;
};

type Params = {
  players: PlayerInput[];
  bestOf: 1 | 3 | 5 | 7;
  isFinished: boolean;
  winnerId: string | null;
  startNextLeg: () => void;
  resetMatch: () => void;
};

export function useX01MatchState({
  players,
  bestOf,
  isFinished,
  winnerId,
  startNextLeg,
  resetMatch,
}: Params) {
  const [matchWins, setMatchWins] = useState<Record<string, number>>(() =>
    players.reduce(
      (acc, player) => ({ ...acc, [player.id]: 0 }),
      {} as Record<string, number>
    )
  );
  const [matchWinnerId, setMatchWinnerId] = useState<string | null>(null);

  const winsNeeded = useMemo(() => Math.ceil(bestOf / 2), [bestOf]);
  const legsPlayed = useMemo(
    () => Object.values(matchWins).reduce((sum, value) => sum + value, 0),
    [matchWins]
  );

  const isMatchFinished = matchWinnerId !== null;
  const currentLeg = Math.min(legsPlayed + (isMatchFinished ? 0 : 1), bestOf);
  const pendingMatchWin =
    winnerId != null ? (matchWins[winnerId] ?? 0) + 1 >= winsNeeded : false;

  useEffect(() => {
    if (bestOf !== 1) return;
    if (!isFinished || !winnerId) return;
    if (matchWinnerId) return;

    setMatchWins((prev) => ({
      ...prev,
      [winnerId]: (prev[winnerId] ?? 0) + 1,
    }));
    setMatchWinnerId(winnerId);
  }, [bestOf, isFinished, winnerId, matchWinnerId]);

  const handleNextLeg = () => {
    if (!winnerId) return false;

    const nextWins = {
      ...matchWins,
      [winnerId]: (matchWins[winnerId] ?? 0) + 1,
    };
    setMatchWins(nextWins);

    if (nextWins[winnerId] >= winsNeeded) {
      setMatchWinnerId(winnerId);
      return true;
    }

    startNextLeg();
    return false;
  };

  const handleResetMatch = () => {
    const resetWins = players.reduce(
      (acc, player) => ({ ...acc, [player.id]: 0 }),
      {} as Record<string, number>
    );
    setMatchWins(resetWins);
    setMatchWinnerId(null);
    resetMatch();
  };

  return {
    matchWins,
    matchWinnerId,
    isMatchFinished,
    currentLeg,
    pendingMatchWin,
    handleNextLeg,
    handleResetMatch,
  };
}
