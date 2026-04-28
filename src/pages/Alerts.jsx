import React, { useState, useEffect } from 'react';

import { AlertCircle, Eye, CheckCircle2, Loader2 } from 'lucide-react';
import { getAlerts, markAlertResolved } from '../services/alertService';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAlerts();
        if (data && data.length > 0) {
          setAlerts(data);
        } else {
          setAlerts([]);
        }
      } catch {
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleResolve = async (id) => {
    try {
      await markAlertResolved(id);
    } catch { /* ignore */ }
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Unified Alert Center</h2>
          <p className="text-slate-500">Monitor all critical operational alerts across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{unresolvedAlerts.length} active</span>
          <button onClick={() => unresolvedAlerts.forEach(a => handleResolve(a.id))} className="btn-secondary text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Mark all read
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="card w-full">
        <h3 className="font-semibold text-lg mb-4">Active Alerts</h3>
        {unresolvedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CheckCircle2 className="w-12 h-12 mb-3 opacity-50 text-success" />
            <p className="font-medium">All clear!</p>
            <p className="text-sm">No active alerts at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {unresolvedAlerts.map(alert => (
              <div key={alert.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex gap-4">
                  <div className={`mt-1 flex-shrink-0 ${alert.severity === 'danger' ? 'text-danger' : alert.severity === 'warning' ? 'text-warning' : 'text-primary'}`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${alert.severity === 'danger' ? 'bg-danger/10 text-danger' : alert.severity === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
                        {alert.type}
                      </span>
                      <span className="text-xs text-slate-500">{alert.time || new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="font-medium dark:text-slate-200">{alert.message}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <button className="flex-1 md:flex-none btn-secondary text-sm px-3 py-1.5 flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button onClick={() => handleResolve(alert.id)} className="flex-1 md:flex-none text-sm px-3 py-1.5 border border-primary text-primary rounded-lg hover:bg-primary/10 font-medium transition-colors">
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="card w-full opacity-60">
          <h3 className="font-semibold text-lg mb-4">Resolved ({resolvedAlerts.length})</h3>
          <div className="space-y-3">
            {resolvedAlerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-4 p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase text-slate-400 mr-2">{alert.type}</span>
                  <span className="text-sm text-slate-500 line-through">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
