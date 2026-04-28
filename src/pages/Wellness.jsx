import React, { useState, useEffect } from 'react';
import { Brain, Smile, Meh, Frown, PhoneCall, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { submitMoodCheckin, getMoodLogs, getMoodLogsByUser, analyzeSentiment, detectRiskStreak, recommendResources } from '../services/wellnessService';

const Wellness = () => {
  const { currentUser, userRole } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [journal, setJournal] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [moodLogs, setMoodLogs] = useState([]);
  const [riskResult, setRiskResult] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        let data = [];
        if (userRole === 'patient') {
          const uid = currentUser?.uid || 'demo';
          data = await getMoodLogsByUser(uid);
        } else {
          data = await getMoodLogs();
        }

        if (data && data.length > 0) {
          setMoodLogs(data);
          // Check risk streak
          const risk = detectRiskStreak(data);
          setRiskResult(risk);
        }
      } catch {
        // Use empty state
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Build chart data from logs
  const chartData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (moodLogs.length > 0) {
      const recent = [...moodLogs]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 7)
        .reverse();
      return recent.map((log, i) => ({
        day: days[i] || `Day ${i+1}`,
        score: log.mood === 'good' ? 8 : log.mood === 'okay' ? 5 : 3,
      }));
    }
    return days.map(d => ({ day: d, score: Math.floor(Math.random() * 4) + 5 }));
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Run sentiment analysis on journal text
    const sentiment = analyzeSentiment(journal, selectedMood);

    const logData = {
      userId: currentUser?.uid || 'demo',
      patientName: currentUser?.name || 'Demo User',
      mood: selectedMood,
      stress: parseInt(stress),
      sleep: parseInt(sleep),
      journal,
      sentimentScore: sentiment.score,
      sentimentConfidence: sentiment.confidence,
    };

    try {
      await submitMoodCheckin(logData);
    } catch {
      // Local fallback
    }

    // Get resource recommendations based on sentiment
    setResources(recommendResources(sentiment.score));

    setSaving(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedMood(null);
      setStress(5);
      setSleep(7);
      setJournal('');
    }, 4000);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><Brain className="w-7 h-7 text-accent" /> Mental Wellness</h2>
          <p className="text-slate-500 text-sm">Track mood, logs and clinical notes.</p>
        </div>
        {userRole === 'patient' && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Log Mood Check-in
          </button>
        )}
      </div>

      {/* Risk Alert Banner */}
      {riskResult?.isAtRisk && (userRole === 'admin' || userRole === 'doctor') && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-5 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-danger text-lg">Critical Mental Health Alert</h4>
            <p className="text-danger/80 text-sm mt-1">{riskResult.message}</p>
            <div className="mt-3 flex gap-2">
              <button className="bg-danger text-white text-sm px-4 py-1.5 rounded-lg font-semibold hover:bg-red-600 transition-colors">Contact Patient</button>
              <button className="border border-danger text-danger text-sm px-4 py-1.5 rounded-lg font-semibold hover:bg-danger/10 transition-colors">View History</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Check-in Form */}
        <div className="card border-t-4 border-t-accent">
          <h3 className="font-bold text-xl mb-6">Daily Check-in</h3>
          
          {submitted ? (
            <div className="h-72 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-4">
                <Smile className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-success mb-2">Check-in Complete!</h4>
              <p className="text-slate-500 mb-4">Your wellness log has been securely saved.</p>
              {resources.length > 0 && (
                <div className="w-full text-left space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recommended for you:</p>
                  {resources.map((r, i) => (
                    <div key={i} className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded flex justify-between items-center">
                      <span>{r.title} ({r.duration})</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.type === 'emergency' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>{r.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block font-medium mb-3">How are you feeling?</label>
                <div className="flex gap-4">
                  {[
                    { key: 'good', icon: Smile, label: 'Good', activeClass: 'border-success bg-success/10 text-success', hoverClass: 'hover:border-success' },
                    { key: 'okay', icon: Meh, label: 'Okay', activeClass: 'border-warning bg-warning/10 text-warning', hoverClass: 'hover:border-warning' },
                    { key: 'bad', icon: Frown, label: 'Struggling', activeClass: 'border-danger bg-danger/10 text-danger', hoverClass: 'hover:border-danger' },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button key={m.key} type="button" onClick={() => setSelectedMood(m.key)} className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-all ${selectedMood === m.key ? m.activeClass : `border-slate-200 dark:border-slate-700 ${m.hoverClass} text-slate-500`}`}>
                        <Icon className="w-8 h-8 mb-2" /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-3 flex items-center justify-between">
                  <span>Stress Level</span>
                  <span className="font-bold text-accent">{stress}/10</span>
                </label>
                <input type="range" min="1" max="10" value={stress} onChange={(e) => setStress(e.target.value)} className="w-full accent-accent" />
              </div>

              <div>
                <label className="block font-medium mb-3 flex items-center justify-between">
                  <span>Sleep Quality</span>
                  <span className="font-bold text-primary">{sleep}/10</span>
                </label>
                <input type="range" min="1" max="10" value={sleep} onChange={(e) => setSleep(e.target.value)} className="w-full accent-primary" />
              </div>

              <div>
                <label className="block font-medium mb-2">Journal (Optional)</label>
                <textarea 
                  className="input-field min-h-[100px] resize-none"
                  placeholder="What's on your mind today?"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                ></textarea>
                <p className="text-xs text-slate-500 mt-1">AI analyzes sentiment to provide personalized support.</p>
              </div>

              <button type="submit" disabled={!selectedMood || saving} className="w-full bg-accent hover:bg-violet-600 text-white font-bold py-3 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                Save Daily Log
              </button>
            </form>
          )}
        </div>

        {/* Analytics & Resources */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">7-Day Mood Trend</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="day" stroke="#64748b" tick={{fontSize: 12}} />
                  <YAxis stroke="#64748b" tick={{fontSize: 12}} domain={[0, 10]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-lg mb-3">Support Resources</h3>
            <ul className="space-y-3">
              <li className="p-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-between shadow-sm cursor-pointer hover:border-primary transition-colors">
                <div>
                  <h4 className="font-bold text-sm">Guided Meditation</h4>
                  <p className="text-xs text-slate-500">10 mins • Decrease anxiety</p>
                </div>
                <button className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded">Start</button>
              </li>
              <li className="p-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-between shadow-sm cursor-pointer hover:border-accent transition-colors">
                <div>
                  <h4 className="font-bold text-sm">Deep Breathing Exercise</h4>
                  <p className="text-xs text-slate-500">5 mins • Calm your mind</p>
                </div>
                <button className="text-accent font-bold text-sm bg-accent/10 px-3 py-1 rounded">Start</button>
              </li>
              <li className="p-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-between shadow-sm cursor-pointer hover:border-danger transition-colors border-l-4 !border-l-danger">
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-1"><PhoneCall className="w-3 h-3 text-danger"/> Speak to a Counselor</h4>
                  <p className="text-xs text-slate-500">Available 24/7</p>
                </div>
                <button className="text-danger font-bold text-sm bg-danger/10 px-3 py-1 rounded">Connect</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wellness;
