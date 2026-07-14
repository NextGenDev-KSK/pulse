import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Firebase is optional. PULSE runs fully in local Demo Mode without any keys.
 * When all required config is present we initialise a real app; otherwise the
 * auth/data layers fall back to their in-memory implementations.
 */
export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId,
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) app = getApps().length ? getApp() : initializeApp(config);
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) return null;
  if (!authInstance) {
    const a = getFirebaseApp();
    if (a) authInstance = getAuth(a);
  }
  return authInstance;
}

export function getDb(): Firestore | null {
  if (!isFirebaseConfigured) return null;
  if (!dbInstance) {
    const a = getFirebaseApp();
    if (a) dbInstance = getFirestore(a);
  }
  return dbInstance;
}
