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

// Nexus Firebase Configuration (Supports Vercel environment variables with resilient fallbacks)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCo58-f_aRRP28ai3FPnagRrNysa-yJuOQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nexus-a0b72.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nexus-a0b72",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nexus-a0b72.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1098811715365",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1098811715365:web:eaefc6b11e6777104d74cc"
};

// Initialize Firebase (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
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

