import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration - uses environment variables for production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCo-n2iDampqwQWig4oa0GEmRuoLNBYzEE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "moving-dashboard-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "moving-dashboard-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "moving-dashboard-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1081969873591",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1081969873591:web:cf66874b38885fc638b332",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HFV2NQW98F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// For development/testing, you can use the Firestore emulator
// Uncomment the line below if you want to use local emulator during development
// connectFirestoreEmulator(db, 'localhost', 8080);

// Temporary fix: For development, connect to emulator if available
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firestore emulator');
  } catch (error) {
    console.log('Firestore emulator not running, using cloud Firestore');
  }
}

export default app; 