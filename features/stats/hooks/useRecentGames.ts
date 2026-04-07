import { useCallback, useEffect, useState } from "react";

import { auth, subscribeToAuthChanges } from "../../../firebase/Auth";
import { getRecentGames } from "../../../firebase/Firestore";

export type RecentGame = {
  id: string;
  points?: number;
  dartsThrown?: number;
  doublesHit?: number;
  doublesAttempted?: number;
  checkout?: number | null;
  createdAt?: unknown;
  deleted?: boolean;
};

type UseRecentGamesState = {
  uid: string | null;
  games: RecentGame[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useRecentGames = (max = 20): UseRecentGamesState => {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [games, setGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUid(user?.uid ?? null);
    });

    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    if (!uid) {
      setGames([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getRecentGames(uid, max);
      // Deleted games are hidden; delete will be a soft-delete with stats rollback.
      const filtered = (data as RecentGame[]).filter((game) => !game.deleted);
      setGames(filtered);
    } catch (err) {
      setError("Pelihistorian haku epäonnistui. Yritä uudelleen.");
    } finally {
      setLoading(false);
    }
  }, [uid, max]);

  return {
    uid,
    games,
    loading,
    error,
    refresh,
  };
};
