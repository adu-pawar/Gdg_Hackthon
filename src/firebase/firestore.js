import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// ───────────────────────── Generic helpers ──────────────
export const addDocument = (col, data) =>
  addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() });

export const setDocument = (col, id, data) =>
  setDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });

export const getDocument = async (col, id) => {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getCollection = async (col) => {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateDocument = (col, id, data) =>
  updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });

export const deleteDocument = (col, id) =>
  deleteDoc(doc(db, col, id));

// ───────────────────────── Queried reads ────────────────
export const queryCollection = async (col, field, operator, value) => {
  const q = query(collection(db, col), where(field, operator, value));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ───────────────────────── Real-time listener ───────────
export const subscribeCollection = (col, callback) => {
  return onSnapshot(collection(db, col), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const subscribeQuery = (col, field, operator, value, callback) => {
  const q = query(collection(db, col), where(field, operator, value));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};
