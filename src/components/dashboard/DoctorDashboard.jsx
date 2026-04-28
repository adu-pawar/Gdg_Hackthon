import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, AlertCircle, CheckCircle, Loader2, Video, Check, X, Edit3 } from 'lucide-react';
import { getAppointmentsByDoctor, updateAppointment } from '../../services/appointmentService';
import { getAlerts } from '../../services/alertService';
import { getMoodLogs } from '../../services/wellnessService';
import { Pill, BrainCircuit, Activity as ActivityIcon, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);

  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDoctorData = async () => {
    try {
      const [appts, allAlerts, moods] = await Promise.all([
        getAppointmentsByDoctor(currentUser?.uid || 'temp'),
        getAlerts(),
        getMoodLogs()
      ]);

      setAppointments(appts || []);
      const activeAlerts = (allAlerts || []).filter(a => !a.resolved);
      setAlerts(activeAlerts);
      setMoodLogs(moods || []);
    } catch (err) {
      console.warn('Doctor load failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [currentUser]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateAppointment(id, { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveComment = async (id) => {
    try {
      await updateAppointment(id, { doctorComment: commentText });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, doctorComment: commentText } : a));
      setEditingCommentId(null);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const todayAppointments = appointments.length; 
  const moodAlertsFiltered = alerts.filter(a => a.type === 'mood').length;

  // Recent mood logs (last 5)
  const recentMoods = [...moodLogs]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const filteredAppointments = appointments.filter(appt => {
    if (statusFilter === 'all') return true;
    const status = appt.status || 'pending';
    return status === statusFilter;
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Doctor Dashboard</h2>
        <p className="text-slate-500">Welcome, {currentUser?.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card flex items-center p-5 border-l-4 border-l-primary">
          <div className="p-4 bg-primary/10 rounded-full text-primary mr-5">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold mb-1">Total Assigned</p>
            <p className="text-3xl font-bold">{todayAppointments}</p>
          </div>
        </div>
        <div className="card flex items-center p-5 border-l-4 border-l-warning">
          <div className="p-4 bg-warning/10 rounded-full text-warning mr-5">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold mb-1">Mood Risk Alerts</p>
            <p className="text-3xl font-bold">{moodAlertsFiltered}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="card">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-lg">Upcoming Schedule</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button onClick={() => setStatusFilter('all')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>All</button>
              <button onClick={() => setStatusFilter('pending')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === 'pending' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Pending</button>
              <button onClick={() => setStatusFilter('accepted')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === 'accepted' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Accepted</button>
            </div>
          </div>
          
          {filteredAppointments.length === 0 ? (
             <p className="text-sm text-slate-500 py-4 text-center">No {statusFilter !== 'all' ? statusFilter : ''} appointments scheduled.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {filteredAppointments.map(appt => (
                <div key={appt.id} className="flex flex-col border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="flex border-b border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 w-20 md:w-28 flex flex-col justify-center items-center h-full border-r border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] md:text-xs text-slate-500 font-semibold uppercase">{appt.date}</span>
                      <span className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">{appt.time}</span>
                    </div>
                    <div className="p-3 md:p-4 flex-1 bg-white dark:bg-surface-dark flex justify-between items-center">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 dark:text-white text-base md:text-lg truncate">{appt.patientName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${appt.status === 'accepted' ? 'bg-success/10 text-success' : appt.status === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                            {appt.status || 'pending'}
                          </span>
                          {appt.patientNote && (
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <span className="font-semibold text-slate-400">Condition:</span> {appt.patientNote}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {appt.status === 'pending' && (
                          <>
                            <button onClick={() => handleUpdateStatus(appt.id, 'accepted')} className="p-1.5 bg-success/10 text-success hover:bg-success hover:text-white rounded-lg transition-colors">
                              <Check className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleUpdateStatus(appt.id, 'rejected')} className="p-1.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => {
                          setEditingCommentId(appt.id);
                          setCommentText(appt.doctorComment || '');
                        }} className="p-1.5 text-slate-400 hover:text-accent rounded-lg">
                          <Edit3 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comment View/Edit Area */}
                  {editingCommentId === appt.id ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                      <textarea 
                        className="input-field min-h-[60px] text-sm mb-2" 
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingCommentId(null)} className="text-xs text-slate-500 font-medium">Cancel</button>
                        <button onClick={() => handleSaveComment(appt.id)} className="text-xs bg-accent text-white px-3 py-1 rounded font-medium">Save</button>
                      </div>
                    </div>
                  ) : appt.doctorComment && (
                    <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/10 text-xs italic text-slate-500 border-t border-slate-100 dark:border-slate-800">
                      Note: {appt.doctorComment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Notes */}
        <div className="space-y-6">


          <div className="card">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              Patient Wellness Trends
            </h3>
            
            {recentMoods.length === 0 ? (
               <p className="text-sm text-slate-500 text-center py-4">No recent wellness check-ins.</p>
            ) : (
                <div className="space-y-4">
                    {recentMoods.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${log.sentimentScore === 'negative' || log.sentimentScore === 'crisis' ? 'bg-danger' : log.sentimentScore === 'positive' ? 'bg-success' : 'bg-warning'}`} />
                              <div>
                                 <p className="text-sm font-semibold">{log.patientName || 'Anonymous'}</p>
                                 <p className="text-xs text-slate-500 truncate max-w-[150px]">{log.note || 'No note'}</p>
                              </div>
                           </div>
                           <span className="text-[10px] font-bold uppercase text-slate-400">{log.sentimentScore}</span>
                        </div>
                    ))}
                    <Link to="/wellness" className="flex items-center justify-center gap-1 text-sm text-primary font-semibold hover:underline mt-2">
                      View Detailed Reports <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
