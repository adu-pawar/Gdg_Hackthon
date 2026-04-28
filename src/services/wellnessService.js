import {
  addDocument,
  getCollection,
  updateDocument,
  queryCollection,
  subscribeCollection,
  subscribeQuery,
} from '../firebase/firestore';
import { createAlert } from './alertService';

const COL = 'mood_logs';

// ── CRUD ──────────────────────────────────────────────────
export const submitMoodCheckin = async (data) => {
  const result = await addDocument(COL, {
    ...data,
    timestamp: new Date().toISOString(),
  });

  // Fetch recent logs for this user to check risk streak
  try {
    const logs = await getMoodLogsByUser(data.userId);
    const riskCheck = detectRiskStreak(logs);
    if (riskCheck.isAtRisk) {
      await createAlert(
        'mood',
        `Critical mental health alert: ${data.patientName || 'Patient'} has ${riskCheck.negativeCount} negative entries in the last 7 days.`,
        'danger',
        { userId: data.userId }
      );
    }
  } catch (e) {
    console.warn("Could not calculate streak for alerting", e);
  }

  return result;
};

export const getMoodLogs = () => getCollection(COL);

export const getMoodLogsByUser = (userId) =>
  queryCollection(COL, 'userId', '==', userId);

// ── Real-time ─────────────────────────────────────────────
export const subscribeMoodLogs = (callback) =>
  subscribeCollection(COL, callback);

export const subscribeUserMoodLogs = (userId, callback) =>
  subscribeQuery(COL, 'userId', '==', userId, callback);

// ── Sentiment analysis (mock AI) ──────────────────────────
export const analyzeSentiment = (text, mood) => {
  let score = 'neutral';
  let confidence = 0.5;

  if (text && text.trim().length > 0) {
    const lower = text.toLowerCase();

    const negativeWords = ['sad', 'angry', 'depressed', 'anxious', 'stressed', 'hopeless', 'tired', 'lonely', 'overwhelmed', 'scared', 'crying', 'pain', 'hurt', 'terrible', 'awful', 'worst', 'die', 'suicide', 'kill'];
    const positiveWords = ['happy', 'great', 'good', 'amazing', 'wonderful', 'excited', 'grateful', 'blessed', 'love', 'joy', 'peaceful', 'calm', 'energetic', 'hopeful', 'better', 'smile'];
    const crisisWords = ['suicide', 'kill myself', 'end it', 'die', 'self-harm', 'cutting'];

    // Check crisis first
    if (crisisWords.some(w => lower.includes(w))) {
      return { score: 'crisis', confidence: 0.95 };
    }

    let negCount = negativeWords.filter(w => lower.includes(w)).length;
    let posCount = positiveWords.filter(w => lower.includes(w)).length;

    if (negCount > posCount + 1) { score = 'negative'; confidence = 0.7 + Math.min(negCount * 0.05, 0.25); }
    else if (posCount > negCount + 1) { score = 'positive'; confidence = 0.7 + Math.min(posCount * 0.05, 0.25); }
  }

  // Fallback to explicit mood if text alone is neutral or empty
  if (score === 'neutral' && mood) {
    if (mood === 'bad') {
      score = 'negative';
      confidence = 0.8;
    } else if (mood === 'good') {
      score = 'positive';
      confidence = 0.8;
    }
  }

  return { score, confidence };
};

// ── Risk streak detection ─────────────────────────────────
export const detectRiskStreak = (logs) => {
  // Sort by timestamp descending, take last 7
  const sorted = [...logs]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 7);

  const negativeCount = sorted.filter(
    l => l.mood === 'bad' || l.sentimentScore === 'negative' || l.sentimentScore === 'crisis'
  ).length;

  return {
    isAtRisk: negativeCount >= 5,
    negativeCount,
    totalChecked: sorted.length,
    message: negativeCount >= 5
      ? `Patient has ${negativeCount} negative entries in the last 7 days. Immediate counselor attention recommended.`
      : null,
  };
};

// ── Resource recommendations ──────────────────────────────
export const recommendResources = (sentimentScore) => {
  const resources = [
    { title: 'Deep Breathing Exercise', duration: '5 min', type: 'exercise', forScores: ['negative', 'neutral', 'crisis'] },
    { title: 'Guided Meditation', duration: '10 min', type: 'meditation', forScores: ['negative', 'neutral'] },
    { title: 'Gratitude Journaling', duration: '5 min', type: 'activity', forScores: ['neutral', 'positive'] },
    { title: 'Speak to a Counselor', duration: 'Now', type: 'emergency', forScores: ['negative', 'crisis'] },
    { title: 'Crisis Helpline: 988', duration: '24/7', type: 'emergency', forScores: ['crisis'] },
  ];

  return resources.filter(r => r.forScores.includes(sentimentScore));
};
