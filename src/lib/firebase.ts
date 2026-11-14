import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Firestore
} from "firebase/firestore";

// Nexus Firebase Configuration (Strictly loaded via environment variables — NO hardcoded keys)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Check if valid production Firebase credentials are provided via environment variables
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "" &&
  !firebaseConfig.apiKey.includes("your_")
);

// Resilient fallback configuration for safe offline / demo execution without exposing credentials
const effectiveConfig = isFirebaseConfigured
  ? firebaseConfig
  : {
      apiKey: "demo-client-key",
      authDomain: "nexus-demo.firebaseapp.com",
      projectId: "nexus-demo",
      storageBucket: "nexus-demo.firebasestorage.app",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:0000000000000000000000"
    };

// Initialize Firebase (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(effectiveConfig);
export const auth = getAuth(app);

// Initialize Firestore with ignoreUndefinedProperties enabled so undefined values never throw
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    ignoreUndefinedProperties: true
  });
} catch {
  firestoreInstance = getFirestore(app);
}
export const db = firestoreInstance;

export const googleProvider = new GoogleAuthProvider();

// Configure Google provider prompts
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Deeply strips undefined fields from an object so Firestore operations never fail
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    // Preserve Firestore FieldValue sentinels (serverTimestamp, deleteField, etc.)
    if ('_methodName' in data || (data as any)?.constructor?.name === 'FieldValueImpl' || (data as any)?.constructor?.name === 'ServerTimestamp') {
      return data;
    }
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as T;
  }
  return data;
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp,
  type FirebaseUser
};

