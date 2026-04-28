import {
  addDocument,
  getCollection,
  updateDocument,
  subscribeCollection,
} from '../firebase/firestore';

const COL = 'alerts';

// ── CRUD ──────────────────────────────────────────────────
export const createAlert = (type, message, severity = 'warning', meta = {}) =>
  addDocument(COL, {
    type,        // 'no-show' | 'expiry' | 'mood' | 'stock'
    message,
    severity,    // 'info' | 'warning' | 'danger'
    resolved: false,
    ...meta,
    timestamp: new Date().toISOString(),
  });

export const getAlerts = () => getCollection(COL);

export const markAlertResolved = (id) =>
  updateDocument(COL, id, { resolved: true });

// ── Real-time ─────────────────────────────────────────────
export const subscribeAlerts = (callback) =>
  subscribeCollection(COL, callback);
