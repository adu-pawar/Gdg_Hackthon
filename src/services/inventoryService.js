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

const COL = 'medicines';

// ── CRUD ──────────────────────────────────────────────────
export const addMedicineBatch = async (data) => {
  const result = await addDocument(COL, data);
  
  // Calculate and trigger alerts
  const expiry = calculateExpiryStatus(data.expiryDate);
  if (expiry.daysLeft <= 30) {
    const sev = expiry.daysLeft < 0 ? 'danger' : 'warning';
    await createAlert(
      'expiry',
      `${data.name} (Batch ${data.batchId}) is ${expiry.status.toLowerCase()} (${expiry.daysLeft} days)`,
      sev,
      { medicineId: result.id }
    ).catch(() => {});
  }

  const stockCheck = autoReorderCheck(data);
  if (stockCheck.needsReorder) {
    await createAlert(
      'stock',
      stockCheck.message,
      'warning',
      { medicineId: result.id }
    ).catch(() => {});
  }

  return result;
};

export const getMedicines = () => getCollection(COL);

export const getMedicine = (id) => getDocument(COL, id);

export const updateMedicine = (id, data) => updateDocument(COL, id, data);

export const deleteMedicine = (id) => deleteDocument(COL, id);

// ── Real-time ─────────────────────────────────────────────
export const subscribeMedicines = (callback) =>
  subscribeCollection(COL, callback);

// ── Expiry status calculator ──────────────────────────────
export const calculateExpiryStatus = (expiryDate) => {
  const daysLeft = Math.floor(
    (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft < 0) return { status: 'Expired', color: 'danger', daysLeft };
  if (daysLeft <= 30) return { status: 'Expiring Soon', color: 'warning', daysLeft };
  return { status: 'Safe', color: 'success', daysLeft };
};

// ── Auto reorder check ────────────────────────────────────
export const autoReorderCheck = (medicine, threshold = 100) => {
  if (medicine.quantity <= threshold) {
    return {
      needsReorder: true,
      message: `${medicine.name} stock critically low (${medicine.quantity} remaining). Recommend reorder from ${medicine.supplier}.`,
    };
  }
  return { needsReorder: false };
};

// ── Waste report generator ────────────────────────────────
export const generateWasteReport = (medicines) => {
  const expired = medicines.filter(m => {
    const d = Math.floor((new Date(m.expiryDate) - new Date()) / 86400000);
    return d < 0;
  });

  const totalLoss = expired.reduce((acc, m) => acc + (m.quantity * (m.unitCost || 2)), 0);

  return {
    expiredCount: expired.length,
    totalUnitsWasted: expired.reduce((a, m) => a + m.quantity, 0),
    estimatedLoss: totalLoss,
    items: expired,
  };
};
