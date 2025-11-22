
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// Note: These are public identifiers, safe to be client-side
const firebaseConfig = {
  apiKey: "AIzaSyDx13u4ivDJZ6b17-RXLt6cljYNxXN7iHI",
  authDomain: "plan-d39e4.firebaseapp.com",
  projectId: "plan-d39e4",
  storageBucket: "plan-d39e4.firebasestorage.app",
  messagingSenderId: "961780181412",
  appId: "1:961780181412:web:3499473baccbc91ac5f931",
  measurementId: "G-BLS9BGSMV2"
};

// Initialize Firebase App (Modular SDK)
export const app = initializeApp(firebaseConfig);

// Initialize Firestore (Modular SDK)
export const db = getFirestore(app);

// Initialize Analytics (Safe mode)
export let analytics: any = null;

// Use an async IIFE to handle analytics initialization safely
(async () => {
  try {
    if (typeof window !== 'undefined' && await isSupported()) {
      analytics = getAnalytics(app);
    }
  } catch (e) {
    console.warn("Firebase Analytics initialization skipped:", e);
  }
})();

export const firebaseInitialized = !!firebaseConfig.apiKey;
