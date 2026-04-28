import {
  addDocument,
  getCollection,
  getDocument,
  updateDocument,
  deleteDocument,
  queryCollection,
  subscribeCollection,
} from '../firebase/firestore';
import { createAlert } from './alertService';

const COL = 'appointments';

// ── CRUD ──────────────────────────────────────────────────
export const createAppointment = async (data) => {
  const result = await addDocument(COL, data);
  return result;
};

export const getAppointments = () => getCollection(COL);

export const getAppointment = (id) => getDocument(COL, id);

export const updateAppointment = (id, data) => updateDocument(COL, id, data);

export const deleteAppointment = (id) => deleteDocument(COL, id);

export const getAppointmentsByDoctor = async (doctorId) => {
  const data = await queryCollection(COL, 'doctorId', '==', doctorId);
  // Sort descending locally to avoid requiring Firestore composite indexes
  return data.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });
};

export const getAppointmentsByPatient = (patientId) =>
  queryCollection(COL, 'patientId', '==', patientId);

// ── Real-time ─────────────────────────────────────────────
export const subscribeAppointments = (callback) =>
  subscribeCollection(COL, callback);


// ── Suggested reschedule slots ────────────────────────────
export const suggestRescheduleSlots = () => {
  // Returns lower-risk time windows (10-12 AM weekdays)
  return [
    { day: 'Tomorrow', time: '10:00 AM', riskNote: 'Low risk window' },
    { day: 'Tomorrow', time: '11:30 AM', riskNote: 'Low risk window' },
    { day: 'Day after', time: '10:30 AM', riskNote: 'Preferred slot' },
  ];
};
