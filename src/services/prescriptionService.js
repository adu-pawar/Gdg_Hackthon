import {
  addDocument,
  getCollection,
  queryCollection,
  subscribeCollection,
} from '../firebase/firestore';

const COL = 'prescriptions';
const REFILL_COL = 'refill_requests';

// ── Prescriptions ─────────────────────────────────────────
export const createPrescription = (data) => addDocument(COL, data);
export const getPrescriptions = () => getCollection(COL);
export const getPrescriptionsByPatient = (patientId) =>
  queryCollection(COL, 'patientId', '==', patientId);
export const subscribePrescriptions = (cb) => subscribeCollection(COL, cb);

// ── Refill Requests ───────────────────────────────────────
export const requestRefill = (data) =>
  addDocument(REFILL_COL, { ...data, status: 'pending' });
export const getRefillRequests = () => getCollection(REFILL_COL);
export const subscribeRefillRequests = (cb) => subscribeCollection(REFILL_COL, cb);
