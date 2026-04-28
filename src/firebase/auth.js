import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// ── Sign up ────────────────────────────────────────────
export const signUp = async (email, password, name, role) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Write user profile doc into Firestore
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  });
  return cred.user;
};

// ── Sign in ────────────────────────────────────────────
export const signIn = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// ── Sign out ───────────────────────────────────────────
export const logOut = () => signOut(auth);

// ── Password reset ─────────────────────────────────────
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

// ── Fetch user profile from Firestore ──────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

// ── Auth state listener ────────────────────────────────
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
