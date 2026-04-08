//Pelin tila hookki. 
import { useEffect, useMemo, useState } from "react";

type PlayerInput = {
  id: string;
  name: string;
};

type Params = {
  players: PlayerInput[];
  bestOfLegs: 1 | 3 | 5 | 7;
  bestOfSets: 1 | 3 | 5;
  useSets: boolean;
  isFinished: boolean;
  winnerId: string | null;
  startNextLeg: () => void;
  resetMatch: () => void;
};

export function useX01MatchState({
  players,
  bestOfLegs,
  bestOfSets,
  useSets,
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
  const [setWins, setSetWins] = useState<Record<string, number>>(() =>
    players.reduce(
      (acc, player) => ({ ...acc, [player.id]: 0 }),
      {} as Record<string, number>
    )
  );
  const [legWins, setLegWins] = useState<Record<string, number>>(() =>
    players.reduce(
      (acc, player) => ({ ...acc, [player.id]: 0 }),
      {} as Record<string, number>
    )
  );
  const [matchWinnerId, setMatchWinnerId] = useState<string | null>(null);

  const legsNeeded = useMemo(() => Math.ceil(bestOfLegs / 2), [bestOfLegs]);
  const setsNeeded = useMemo(() => Math.ceil(bestOfSets / 2), [bestOfSets]);
  const legsPlayed = useMemo(() => {
    return useSets
      ? Object.values(legWins).reduce((sum, value) => sum + value, 0)
      : Object.values(matchWins).reduce((sum, value) => sum + value, 0);
  }, [legWins, matchWins, useSets]);
  const setsPlayed = useMemo(
    () => Object.values(setWins).reduce((sum, value) => sum + value, 0),
    [setWins]
  );

  const isMatchFinished = matchWinnerId !== null;
  const currentLeg = Math.min(
    legsPlayed + (isMatchFinished ? 0 : 1),
    bestOfLegs
  );
  const currentSet = Math.min(
    setsPlayed + (isMatchFinished ? 0 : 1),
    bestOfSets
  );
  const pendingSetWin =
    useSets && winnerId != null
      ? (legWins[winnerId] ?? 0) + 1 >= legsNeeded
      : false;
  const pendingMatchWin =
    winnerId != null
      ? useSets
        ? pendingSetWin && (setWins[winnerId] ?? 0) + 1 >= setsNeeded
        : (matchWins[winnerId] ?? 0) + 1 >= legsNeeded
      : false;

  useEffect(() => {
    if (useSets) return;
    if (bestOfLegs !== 1) return;
    if (!isFinished || !winnerId) return;
    if (matchWinnerId) return;

    setMatchWins((prev) => ({
      ...prev,
      [winnerId]: (prev[winnerId] ?? 0) + 1,
    }));
    setMatchWinnerId(winnerId);
  }, [bestOfLegs, isFinished, matchWinnerId, useSets, winnerId]);

  const handleNextLeg = () => {
    if (!winnerId) return false;

    setMatchWins((prev) => ({
      ...prev,
      [winnerId]: (prev[winnerId] ?? 0) + 1,
    }));

    if (useSets) {
      const nextLegWins = {
        ...legWins,
        [winnerId]: (legWins[winnerId] ?? 0) + 1,
      };
      setLegWins(nextLegWins);

      if ((nextLegWins[winnerId] ?? 0) >= legsNeeded) {
        const nextSetWins = {
          ...setWins,
          [winnerId]: (setWins[winnerId] ?? 0) + 1,
        };
        setSetWins(nextSetWins);

        if ((nextSetWins[winnerId] ?? 0) >= setsNeeded) {
          setMatchWinnerId(winnerId);
          return true;
        }

        const resetLegWins = players.reduce(
          (acc, player) => ({ ...acc, [player.id]: 0 }),
          {} as Record<string, number>
        );
        setLegWins(resetLegWins);
        startNextLeg();
        return false;
      }

      startNextLeg();
      return false;
    }

    const nextWins = {
      ...matchWins,
      [winnerId]: (matchWins[winnerId] ?? 0) + 1,
    };

    if (nextWins[winnerId] >= legsNeeded) {
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
    setLegWins(resetWins);
    setSetWins(resetWins);
    setMatchWinnerId(null);
    resetMatch();
  };

  return {
    matchWins,
    setWins,
    legWins,
    matchWinnerId,
    isMatchFinished,
    currentLeg,
    currentSet,
    pendingMatchWin,
    pendingSetWin,
    handleNextLeg,
    handleResetMatch,
  };
}
