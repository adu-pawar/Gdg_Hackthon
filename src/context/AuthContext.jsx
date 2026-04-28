import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signIn, signUp, logOut } from '../firebase/auth';
import { seedAllData } from '../data/seedFirestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Track whether we're using Firebase or local-demo mode
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  useEffect(() => {
    // Try to attach Firebase auth listener
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Fetch user profile from Firestore
          const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (profileSnap.exists()) {
            setCurrentUser({ uid: firebaseUser.uid, ...profileSnap.data() });
          } else {
            // Profile doc missing — create a basic one
            const profile = { uid: firebaseUser.uid, name: firebaseUser.email, email: firebaseUser.email, role: 'patient' };
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
            setCurrentUser(profile);
          }
          setFirebaseConnected(true);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });

      // Attempt seed on first load (no-op if data already present)
      seedAllData();
      setFirebaseConnected(true);
    } catch {
      console.warn('Firebase not configured.');
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // ── Firebase email/password login ──────────────────────
  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    try {
      localStorage.removeItem('careflow_user'); // Clear demo session if using real auth
      await signIn(email, password);
      // onAuthStateChanged will pick up the user
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // ── Firebase signup ────────────────────────────────────
  const signup = async (email, password, name, role) => {
    setAuthError(null);
    try {
      localStorage.removeItem('careflow_user');
      await signUp(email, password, name, role);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };


  // ── Logout ─────────────────────────────────────────────
  const logout = async () => {
    try { await logOut(); } catch { /* Firebase maybe not configured */ }
    setCurrentUser(null);
    localStorage.removeItem('careflow_user');
  };

  const value = {
    currentUser,
    userRole: currentUser?.role || 'patient', // Default to patient if role is blank
    authError,
    firebaseConnected,
    loginWithEmail,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
