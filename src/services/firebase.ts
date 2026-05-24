import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB3m9Elg-9nZIydzLr4FK7dDOcZ1UOhO30",
  authDomain: "silentsos-c5589.firebaseapp.com",
  projectId: "silentsos-c5589",
  storageBucket: "silentsos-c5589.firebasestorage.app",
  messagingSenderId: "70857689172",
  appId: "1:70857689172:web:587cb5e0adb05ecfd685c1"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const isFirebaseConfigured = true;

// Compatibility bindings for compile-safety in AppContext
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

export const mockAuth = {
  onAuthStateChanged: (cb: any) => {
    return () => {};
  },
  signInWithEmail: async (email: string) => {},
  signUpWithEmail: async (email: string) => ({ uid: 'mock_uid', email, createdAt: new Date().toISOString() }),
  signOut: async () => {}
};
export default app;
