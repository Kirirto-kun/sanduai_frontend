"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDHZK9KtTOKnhos01-Y9XaNss_I7AKzv1I",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sandu-ai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sandu-ai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sandu-ai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "825056180022",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:825056180022:web:2a6394d71f359368ef6597",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XSQH1BDJME",
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Get Auth instance
export const auth: Auth = getAuth(app);

// Set language code (optional, can be set based on app language)
// auth.languageCode = 'ru'; // or 'kk' for Kazakh

export default app;

