// ─────────────────────────────────────────────────────────────────────────
//  Firebase client — one shared app instance for the whole site. The config
//  values are public identifiers, not secrets: access control lives in the
//  Firestore security rules, which scope each user to /users/{uid}.
// ─────────────────────────────────────────────────────────────────────────

import { getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBW-YVDiNMelrFGOeKL1nQq49_6viGDuo0",
  authDomain: "nightreign-f3ccb.firebaseapp.com",
  projectId: "nightreign-f3ccb",
  storageBucket: "nightreign-f3ccb.firebasestorage.app",
  messagingSenderId: "384977529526",
  appId: "1:384977529526:web:f133b3ace6ff815446d417",
};

// getApps guard: fast refresh re-evaluates modules, but an app can only be
// initialized once per name.
const app = getApps()[0] ?? initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
