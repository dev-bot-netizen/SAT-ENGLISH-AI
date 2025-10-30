// FIX: Separating `initializeApp` and `FirebaseApp` type imports to avoid potential build tool issues.
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
// Fix: Separated value and type imports from firebase/auth to prevent potential build tool issues.
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services using modular functions
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Export the User type from the modular SDK
export type { User };

// Helper to get auth header with Bearer token
export const getAuthHeader = async (): Promise<Record<string, string>> => {
    const user = auth.currentUser;
    if (user) {
        try {
            const token = await user.getIdToken();
            return { 'Authorization': `Bearer ${token}` };
        } catch (error) {
            console.error("Error getting auth token:", error);
            return {};
        }
    }
    return {};
};

// Exporting the auth and storage instances, the provider, and auth functions
export { 
    auth, 
    storage, 
    googleProvider,
    onAuthStateChanged,
    signOut,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
};