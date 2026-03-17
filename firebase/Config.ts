
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDyApDmP9LT9cxrhuduMHLTlamv4jGcWyA",
  authDomain: "thedartsdb.firebaseapp.com",
  projectId: "thedartsdb",
  storageBucket: "thedartsdb.firebasestorage.app",
  messagingSenderId: "19594865410",
  appId: "1:19594865410:web:5eee9276a22d0664ad701b"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();