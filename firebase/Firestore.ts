// src/firebase/firestore.ts
import { app } from './Config';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

export const db = getFirestore(app);

// käyttäjäprofiili
export type UserProfile = {
  displayName: string;
  premiumMirror: boolean;
  createdAt?: unknown;
};

//käyttäjän tilastot
export type UserStats = {
  totalPoints: number;
  totalDartsThrown: number;
  threeDartAverage: number;
  doublesHit: number;
  doublesAttempted: number;
  doublePercentage: number;
  gamesPlayed: number;
  bestLegDarts: number;
  highestCheckout: number;
  last10Avg?: number;
  last25Avg?: number;
  last50Avg?: number;
  updatedAt?: unknown;
};

//yksittäinen peli
export type GameInput = {
  points: number;
  dartsThrown: number;
  doublesHit: number;
  doublesAttempted: number;
  checkout?: number | null;
  won?: boolean;
};

type GameRecord = GameInput & {
  deleted?: boolean;
};

// 30 päivän insightit
export type Last30DaysInsights = {
  avg: number;
  doublePct: number;
  games: number;
  trend: number;
  updatedAt?: unknown;
};

export type RecentAverages = {
  last10Avg: number;
  last25Avg: number;
  last50Avg: number;
};

// käyttäjäprofiilin luonti jos puuttuu
export const createUserProfileIfMissing = async (
  uid: string,
  displayName: string,
  premiumMirror = false
) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      displayName,
      premiumMirror,
      createdAt: serverTimestamp(),
    });
  }
};

// käyttäjäprofiilin nimen päivitys
export const updateUserProfileDisplayName = async (
  uid: string,
  displayName: string
) => {
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      displayName,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

// käyttäjäprofiilin haku
export const getUserProfile = async (uid: string) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
};

//käyttäjän statsien alustus
export const createUserStatsIfMissing = async (uid: string) => {
  const ref = doc(db, 'stats', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      totalPoints: 0,
      totalDartsThrown: 0,
      threeDartAverage: 0,
      doublesHit: 0,
      doublesAttempted: 0,
      doublePercentage: 0,
      gamesPlayed: 0,
      bestLegDarts: 0,
      highestCheckout: 0,
      updatedAt: serverTimestamp(),
    });
  }
};

//käyttäjän tilastojen haku
export const getUserStats = async (uid: string) => {
  const ref = doc(db, 'stats', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserStats;
};

// reaaliaikainen kuuntelu käyttäjän tilastoille
export const subscribeToUserStats = (
  uid: string,
  onNext: (stats: UserStats | null) => void,
  onError?: (error: unknown) => void
) => {
  const ref = doc(db, 'stats', uid);
  return onSnapshot(
    ref,
    (snap) => {
      onNext(snap.exists() ? (snap.data() as UserStats) : null);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

//käyttäjän pelien lisääminen ja tilastojen päivittäminen
//1. luodaan referenssimuuttuja käyttäjän peleille
export const addGameForUser = async (uid: string, game: GameInput) => {
  const gamesRef = collection(db, 'users', uid, 'games');
    //2. peli lisätään historiaan
  await addDoc(gamesRef, {
    ...game,
    deleted: false,
    createdAt: serverTimestamp(),
  });
  //3. nykyiset tilastot haetaan, ja päivitetään
  const statsRef = doc(db, 'stats', uid);
  const statsSnap = await getDoc(statsRef);
  //4. nyktiset arvot haetaan uudelleen, ja päivitetään uusilla arvoilla
  const current = statsSnap.exists()
    ? (statsSnap.data() as UserStats)
    : {
        totalPoints: 0,
        totalDartsThrown: 0,
        threeDartAverage: 0,
        doublesHit: 0,
        doublesAttempted: 0,
        doublePercentage: 0,
        gamesPlayed: 0,
        bestLegDarts: 0,
        highestCheckout: 0,
      };
      //5. tilastot lasketaan juuri lisätyillä arvoilla
  const totalPoints = current.totalPoints + game.points;
  const totalDartsThrown = current.totalDartsThrown + game.dartsThrown;
  const doublesHit = current.doublesHit + game.doublesHit;
  const doublesAttempted = current.doublesAttempted + game.doublesAttempted;
  const gamesPlayed = current.gamesPlayed + 1;
  const highestCheckout = Math.max(
    current.highestCheckout || 0,
    game.checkout || 0
  );
  const bestLegDarts =
    current.bestLegDarts > 0
      ? Math.min(current.bestLegDarts, game.dartsThrown)
      : game.dartsThrown;

  const threeDartAverage =
    totalDartsThrown > 0 ? (totalPoints / totalDartsThrown) * 3 : 0;

  const doublePercentage =
    doublesAttempted > 0 ? (doublesHit / doublesAttempted) * 100 : 0;
      // 6. lopuksi tilastot päivitetään Firestoreen
  await setDoc(
    statsRef,
    {
      totalPoints,
      totalDartsThrown,
      threeDartAverage,
      doublesHit,
      doublesAttempted,
      doublePercentage,
      gamesPlayed,
      bestLegDarts,
      highestCheckout,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

//Näyttää viimeisimmät 20 peliä
export const getRecentGames = async (uid: string, max = 20) => {
  const gamesRef = collection(db, 'users', uid, 'games');
  const q = query(gamesRef, orderBy('createdAt', 'desc'), limit(max));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// reaaliaikainen kuuntelu viimeisimmistä peleistä
export const subscribeToRecentGames = (
  uid: string,
  max: number,
  onNext: (games: Array<{ id: string } & GameInput>) => void,
  onError?: (error: unknown) => void
) => {
  const gamesRef = collection(db, 'users', uid, 'games');
  const q = query(gamesRef, orderBy('createdAt', 'desc'), limit(max));
  return onSnapshot(
    q,
    (snapshot) => {
      const games = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as GameInput),
      }));
      onNext(games);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

// reaaliaikainen kuuntelu peleistä tietystä ajankohdasta lähtien
export const subscribeToGamesSince = (
  uid: string,
  days: number,
  onNext: (games: Array<{ id: string } & GameInput>) => void,
  onError?: (error: unknown) => void
) => {
  const gamesRef = collection(db, 'users', uid, 'games');
  const since = new Date();
  since.setDate(since.getDate() - Math.max(1, days));
  const q = query(
    gamesRef,
    where('createdAt', '>=', Timestamp.fromDate(since)),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const games = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as GameInput),
      }));
      onNext(games);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

// laskee viimeisten pelien 3-dart keskiarvot on-demand
export const getRecentAverages = async (uid: string): Promise<RecentAverages> => {
  const gamesRef = collection(db, 'users', uid, 'games');
  const q = query(gamesRef, orderBy('createdAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);

  const games = snapshot.docs
    .map((doc) => doc.data() as GameRecord)
    .filter((g) => !g.deleted);

  const computeAvg = (n: number) => {
    const slice = games.slice(0, n);
    let points = 0;
    let darts = 0;
    for (const g of slice) {
      if (typeof g.points === 'number' && typeof g.dartsThrown === 'number') {
        points += g.points;
        darts += g.dartsThrown;
      }
    }
    return darts > 0 ? (points / darts) * 3 : 0;
  };

  return {
    last10Avg: computeAvg(10),
    last25Avg: computeAvg(25),
    last50Avg: computeAvg(50),
  };
};

// 30 päivän insighttien haku
export const getLast30DaysInsights = async (uid: string) => {
  const ref = doc(db, 'users', uid, 'insights', 'last_30_days');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Last30DaysInsights;
};

// 30 päivän insighttien päivitys
export const setLast30DaysInsights = async (
  uid: string,
  insights: Last30DaysInsights
) => {
  const ref = doc(db, 'users', uid, 'insights', 'last_30_days');
  await setDoc(
    ref,
    {
      ...insights,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};
