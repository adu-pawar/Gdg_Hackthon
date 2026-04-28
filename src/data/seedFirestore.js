/**
 * Seeds Firestore with realistic demo data.
 * Run once on first setup — idempotent (checks if data already exists).
 */
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

const SEED_APPOINTMENTS = [
 
];

const SEED_MEDICINES = [
 
];
const SEED_MOOD_LOGS = [
];

const SEED_ALERTS = [

];

async function seedCollection(colName, items) {
  const snap = await getDocs(collection(db, colName));
  if (snap.size > 0) {
    console.log(`[Seed] ${colName} already has ${snap.size} docs — skipping.`);
    return false;
  }

  const batch = writeBatch(db);
  items.forEach(item => {
    const { id, ...data } = item;
    batch.set(doc(db, colName, id), { ...data, createdAt: new Date().toISOString() });
  });
  await batch.commit();
  console.log(`[Seed] Wrote ${items.length} docs to ${colName}.`);
  return true;
}

export async function seedAllData() {
  try {
    await seedCollection('appointments', SEED_APPOINTMENTS);
    await seedCollection('medicines', SEED_MEDICINES);
    await seedCollection('mood_logs', SEED_MOOD_LOGS);
    await seedCollection('alerts', SEED_ALERTS);
    console.log('[Seed] All collections seeded ✓');
  } catch (err) {
    console.warn('[Seed] Seeding skipped or failed (Firebase may not be configured):', err.message);
  }
}
