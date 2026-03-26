import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyDyApDmP9LT9cxrhuduMHLTlamv4jGcWyA",
  authDomain: "thedartsdb.firebaseapp.com",
  projectId: "thedartsdb",
  storageBucket: "thedartsdb.firebasestorage.app",
  messagingSenderId: "19594865410",
  appId: "1:19594865410:web:5eee9276a22d0664ad701b"
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);


const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export { app, auth };