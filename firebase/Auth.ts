import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps } from 'firebase/app';
import {initializeAuth, getAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User} from '@firebase/auth';
import { app } from './Config';

//auth initialisointi
export const auth =
    getApps().length > 0
        ? (() => {
            try {
                return initializeAuth(app, {
                    persistence: getReactNativePersistence(AsyncStorage),
                });
            } catch {
                return getAuth(app);
            }
        })()
        : getAuth(app);
//rekisteröityminen ja kirjautuminen. 
//palauttaa käyttäjän ja sähköpostin.
export const registerWithEmail = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
}; 

export const loginWithEmail = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
    return signOut(auth);
};
//kirjautumisen kuuntelija
export const subscribeToAuthChanges = (
    callback: (user: User | null) => void
) => {
    return onAuthStateChanged(auth, callback);
};
