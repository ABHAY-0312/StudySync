import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// The configuration object for connecting to your Firebase project.
// These values are loaded from environment variables for security and flexibility.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// A check to see if the necessary environment variables have been provided.
// This helps in debugging setup issues.
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

// Initialize the Firebase app.
// The `getApps().length` check prevents re-initializing the app on hot reloads,
// which would cause an error.
const app = isFirebaseConfigured ? (!getApps().length ? initializeApp(firebaseConfig) : getApp()) : null;

// Get instances of the Firebase services we need.
// If the app wasn't initialized, these will be null.
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const storage = app ? getStorage(app) : null;

// Log a warning in the server console if the Firebase configuration is missing.
// This provides a clear message to the developer during setup.
if (!isFirebaseConfigured) {
    console.warn("Firebase configuration is missing or incomplete. Please check your environment variables. App functionality will be limited.");
}

// Export the initialized services for use throughout the application.
export { app, auth, db, storage };
