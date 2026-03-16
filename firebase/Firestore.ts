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
  serverTimestamp,
} from 'firebase/firestore';

export const db = getFirestore(app);

//käyttäjän tilastot
export type UserStats = {
  totalPoints: number;
  totalDartsThrown: number;
  threeDartAverage: number;
  doublesHit: number;
  doublesAttempted: number;
  doublePercentage: number;
  gamesPlayed: number;
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
      };
      //5. tilastot lasketaan juuri lisätyillä arvoilla
  const totalPoints = current.totalPoints + game.points;
  const totalDartsThrown = current.totalDartsThrown + game.dartsThrown;
  const doublesHit = current.doublesHit + game.doublesHit;
  const doublesAttempted = current.doublesAttempted + game.doublesAttempted;
  const gamesPlayed = current.gamesPlayed + 1;

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