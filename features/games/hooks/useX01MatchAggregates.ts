// Aggregates match-level attempts, totals, and per-player stats for X01.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Player, ThrowTurn } from "../../../types/X01Types";

type PlayerInput = {
  id: string;
  name: string;
};

type StatsSummary = {
  totalPoints: number;
  totalDartsThrown: number;
  checkout: number | null;
};

type MatchTotals = {
  points: number;
  dartsThrown: number;
  highestCheckout: number;
};

type Params = {
  players: PlayerInput[];
  gamePlayers: Player[];
  isFinished: boolean;
  isMatchFinished: boolean;
  winnerId: string | null;
  turns: ThrowTurn[];
  matchWins: Record<string, number>;
  getPlayerTotals: (playerId: string) => { points: number; darts: number };
  statsSummary: StatsSummary | null;
  statsSaved: boolean;
  mainPlayerId: string | null;
};

const buildEmptyWins = (players: PlayerInput[]) =>
  players.reduce(
    (acc, player) => ({ ...acc, [player.id]: 0 }),
    {} as Record<string, number>
  );

export function useX01MatchAggregates({
  players,
  gamePlayers,
  isFinished,
  isMatchFinished,
  winnerId,
  turns,
  matchWins,
  getPlayerTotals,
  statsSummary,
  statsSaved,
  mainPlayerId,
}: Params) {
  const [matchDoubleAttempts, setMatchDoubleAttempts] = useState<
    Record<string, number>
  >(() => buildEmptyWins(players));
  const lastAggregatedLegKey = useRef<string | null>(null);
  const [matchTotals, setMatchTotals] = useState<MatchTotals>({
    points: 0,
    dartsThrown: 0,
    highestCheckout: 0,
  });
  const lastAggregatedTotalsKey = useRef<string | null>(null);

  const legAttempts = useMemo(() => {
    if (!isFinished || turns.length === 0) {
      return { key: null as string | null, attempts: {} as Record<string, number> };
    }

    const winningTurnKey = `${turns[turns.length - 1].timestamp}`;
    const attempts: Record<string, number> = {};

    for (const turn of turns) {
      const value = turn.doubleAttempts;
      if (value == null) continue;
      attempts[turn.playerId] = (attempts[turn.playerId] ?? 0) + value;
    }

    return { key: winningTurnKey, attempts };
  }, [isFinished, turns]);

  const aggregateLegAttempts = useCallback(() => {
    if (!legAttempts.key) return;
    if (lastAggregatedLegKey.current === legAttempts.key) return;

    setMatchDoubleAttempts((prev) => {
      const next = { ...prev };
      for (const [playerId, value] of Object.entries(legAttempts.attempts)) {
        next[playerId] = (next[playerId] ?? 0) + value;
      }
      return next;
    });

    lastAggregatedLegKey.current = legAttempts.key;
  }, [legAttempts]);

  useEffect(() => {
    if (!isFinished || !statsSummary) return;
    const legKey =
      turns.length > 0 ? `${turns[turns.length - 1].timestamp}` : null;
    if (!legKey) return;
    if (lastAggregatedTotalsKey.current === legKey) return;

    const mainWonLeg = winnerId === mainPlayerId;
    if (mainWonLeg && isMatchFinished && !statsSaved) return;

    setMatchTotals((prev) => ({
      points: prev.points + statsSummary.totalPoints,
      dartsThrown: prev.dartsThrown + statsSummary.totalDartsThrown,
      highestCheckout: Math.max(prev.highestCheckout, statsSummary.checkout ?? 0),
    }));
    lastAggregatedTotalsKey.current = legKey;
  }, [
    isFinished,
    isMatchFinished,
    mainPlayerId,
    statsSaved,
    statsSummary,
    turns,
    winnerId,
  ]);

  const latestLegKey = useMemo(
    () => (turns.length > 0 ? `${turns[turns.length - 1].timestamp}` : null),
    [turns]
  );
  const isTotalsAggregated =
    !latestLegKey || lastAggregatedTotalsKey.current === latestLegKey;

  const effectiveAttempts = useMemo(() => {
    const next = { ...matchDoubleAttempts };
    if (legAttempts.key && lastAggregatedLegKey.current !== legAttempts.key) {
      for (const [playerId, value] of Object.entries(legAttempts.attempts)) {
        next[playerId] = (next[playerId] ?? 0) + value;
      }
    }
    return next;
  }, [legAttempts, matchDoubleAttempts]);

  const playerStats = useMemo(() => {
    if (!isFinished && !isMatchFinished) return [];

    return gamePlayers.map((player) => {
      const { points, darts } = getPlayerTotals(player.id);
      const average = darts > 0 ? (points / darts) * 3 : null;

      const doublesAttempted = effectiveAttempts[player.id] ?? 0;
      const doublesHit = matchWins[player.id] ?? 0;

      return {
        id: player.id,
        name: player.name,
        average,
        dartsThrown: darts,
        doublesAttempted,
        doublesHit,
      };
    });
  }, [
    effectiveAttempts,
    gamePlayers,
    getPlayerTotals,
    isFinished,
    isMatchFinished,
    matchWins,
  ]);

  const resetAggregates = useCallback(() => {
    setMatchDoubleAttempts(buildEmptyWins(players));
    lastAggregatedLegKey.current = null;
    setMatchTotals({ points: 0, dartsThrown: 0, highestCheckout: 0 });
    lastAggregatedTotalsKey.current = null;
  }, [players]);

  return {
    matchDoubleAttempts,
    matchTotals,
    effectiveAttempts,
    playerStats,
    aggregateLegAttempts,
    resetAggregates,
    isTotalsAggregated,
  };
}
