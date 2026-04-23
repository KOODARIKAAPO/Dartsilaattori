import { db } from "../../../firebase/Firestore";
import { getAuth } from "@firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";


export interface User {
  uid: string;
  displayName: string;
}

async function getCurrentUserDisplayName(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  const docSnap = await getDoc(doc(db, "users", user.uid));
  if (docSnap.exists()) {
    return docSnap.data().displayName;
  }
  throw new Error("Profile not found");
}

export async function searchUsers(queryText: string): Promise<User[]> {
  if (!queryText) return [];

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("displayName", ">=", queryText), where("displayName", "<=", queryText + "\uf8ff"));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ uid: doc.id, displayName: doc.data().displayName }));
}

export async function getFriends(): Promise<User[]> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("User not logged in");
    return [];
  }

  try {
    const friendsRef = collection(db, "friends", user.uid, "list");
    const snapshot = await getDocs(friendsRef);

    const friends: User[] = snapshot.docs.map((doc) => ({
      uid: doc.id,
      displayName: doc.data().displayName,
    }));

    return friends;
  } catch (error) {
    console.error("Error fetching friends:", error);
    return [];
  }
}

export async function addFriend(friendUid: string, friendDisplayName: string): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in");
  }

  if (friendUid === user.uid) {
    throw new Error("Cannot add yourself as a friend");
  }

  try {
    const myDisplayName = await getCurrentUserDisplayName();

    // Add to my friends list
    const myFriendsRef = collection(db, "friends", user.uid, "list");
    await setDoc(doc(myFriendsRef, friendUid), {
      displayName: friendDisplayName,
    });

    // Add to friend's friends list (mutual)
    const friendFriendsRef = collection(db, "friends", friendUid, "list");
    await setDoc(doc(friendFriendsRef, user.uid), {
      displayName: myDisplayName,
    });
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
}

export async function getUserById(uid: string): Promise<User | null> {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));

    if (!docSnap.exists()) return null;

    return {
      uid,
      displayName: docSnap.data().displayName,
    };
  } catch (error) {
    console.error("Error fetching user by id:", error);
    return null;
  }
}