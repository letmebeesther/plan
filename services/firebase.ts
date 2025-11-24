
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
// Analytics is disabled to prevent 'installations/app-offline' errors in restricted network environments.
export let analytics: any = null;

export const firebaseInitialized = !!firebaseConfig.apiKey;
