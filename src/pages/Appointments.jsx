import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import { Calendar, Plus, Clock, Video, XCircle, Loader2, AlertTriangle, Edit3, Check, X as XIcon, FileText } from 'lucide-react';
import { getAppointments, getAppointmentsByPatient, getAppointmentsByDoctor, createAppointment, deleteAppointment, updateAppointment } from '../services/appointmentService';
import { queryCollection } from '../firebase/firestore';

const Appointments = () => {
  const { userRole, currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patientName: '', date: '', time: '', diseaseNote: '', mobileNumber: '', doctorId: '' });
  const [doctors, setDoctors] = useState([]);

  // Doctor comment editing state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Patient note editing state
  const [editingPatientNoteId, setEditingPatientNoteId] = useState(null);
  const [patientNoteText, setPatientNoteText] = useState('');
  const [savingPatientNote, setSavingPatientNote] = useState(false);

  // Fetch from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        let data = [];
        if (userRole === 'patient') {
          data = await getAppointmentsByPatient(currentUser?.uid || 'temp');
        } else if (userRole === 'doctor') {
          data = await getAppointmentsByDoctor(currentUser?.uid || 'temp');
        } else {
          // Admins see all for the global page
          data = await getAppointments();
        }

        setAppointments(data || []);
        const docs = await queryCollection('users', 'role', '==', 'doctor');
        setDoctors(docs || []);

      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userRole, currentUser]);

  const handleCreate = async () => {
    setSaving(true);
    
    const selectedDoc = doctors.find(d => d.id === form.doctorId) || doctors[0];
    const docId = selectedDoc?.id || 'doctor-1';
    const docName = selectedDoc?.name || 'Dr. Default Doc';

    const newAppt = {
      patientName: userRole === 'patient' ? (currentUser?.name || form.patientName) : form.patientName,
      patientId: userRole === 'patient' ? currentUser?.uid : 'demo',
      doctorId: docId,
      doctor: docName,
      date: form.date,
      time: form.time,
      status: 'pending',
      reminderSent: false,
      patientNote: form.diseaseNote || '',
      patientMobile: form.mobileNumber || '',
      createdAt: new Date().toISOString()
    };

    try {
      await createAppointment(newAppt);
      // Successful save — re-fetch to get official IDs if possible
      const updated = userRole === 'patient' 
        ? await getAppointmentsByPatient(currentUser?.uid)
        : await getAppointments();
      setAppointments(updated);
    } catch (err) {
      console.warn('Firebase save failed, falling back to local state:', err);
      // Fallback for demo mode: add to list manually with temp ID
      const tempId = Date.now().toString();
      setAppointments(prev => [{ ...newAppt, id: tempId }, ...prev]);
    } finally {
      setSaving(false);
      setShowModal(false);
      setForm({ patientName: '', date: '', time: '', diseaseNote: '', mobileNumber: '', doctorId: '' });
    }
  };

  const handleDelete = async (id) => {
    // Optimistic UI update: remove from state immediately
    // Stringify IDs to ensure comparison works regardless of type
    const targetId = String(id);
    setAppointments(prev => prev.filter(a => String(a.id) !== targetId));

    try {
      await deleteAppointment(id);
    } catch (err) {
      console.warn('Firebase deletion failed (likely demo mode):', err);
      // Item is already removed locally for a smooth UI experience
    }
  };

  const handleSaveComment = async (id) => {
    setSavingComment(true);
    try {
      await updateAppointment(id, { doctorComment: commentText });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, doctorComment: commentText } : a));
      setEditingCommentId(null);
      setCommentText('');
    } catch (err) {
      console.error('Failed to save comment:', err);
    } finally {
      setSavingComment(false);
    }
  };

  const handleSavePatientNote = async (id) => {
    setSavingPatientNote(true);
    try {
      await updateAppointment(id, { patientNote: patientNoteText });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, patientNote: patientNoteText } : a));
      setEditingPatientNoteId(null);
      setPatientNoteText('');
    } catch (err) {
      console.error('Failed to save patient note:', err);
    } finally {
      setSavingPatientNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Appointments</h2>
          <p className="text-slate-500 text-sm">Manage your schedule and bookings.</p>
        </div>
        {userRole === 'patient' && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center transform transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        )}
      </div>

      <div className="card w-full">
        <h3 className="font-semibold text-lg mb-4">Upcoming Schedule</h3>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Calendar className="w-12 h-12 mb-3 opacity-50" />
            <p className="font-medium">No appointments scheduled</p>
            <p className="text-sm">Book your first appointment to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Date & Time</th>
                  <th className="px-4 py-3 font-semibold">Patient Name</th>

                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Patient Note</th>
                  <th className="px-4 py-3 font-semibold">Doctor's Notes</th>
                  <th className="px-4 py-3 font-semibold rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover-row border-b border-slate-100 dark:border-slate-800 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-semibold dark:text-slate-200">{appt.date}</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/>{appt.time}</p>
                    </td>
                    <td className="px-4 py-4 font-medium dark:text-slate-200">{appt.patientName}</td>
                    

                    
                    <td className="px-4 py-4">
                      <span className="capitalize bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-semibold">
                        {appt.status}
                      </span>
                    </td>
                    
                    {/* Patient Note Column */}
                    <td className="px-4 py-4">
                      {editingPatientNoteId === appt.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className="input-field text-xs py-1 px-2 min-w-[140px]"
                            placeholder="Describe your condition..."
                            value={patientNoteText}
                            onChange={(e) => setPatientNoteText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSavePatientNote(appt.id)}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePatientNote(appt.id)}
                            disabled={savingPatientNote}
                            className="p-1 bg-success/10 text-success hover:bg-success hover:text-white rounded transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingPatientNoteId(null); setPatientNoteText(''); }}
                            className="p-1 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded transition-colors"
                            title="Cancel"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs italic text-slate-500">
                            {appt.patientNote || 'No description'}
                          </span>
                          {userRole === 'patient' && (
                            <button
                              onClick={() => {
                                setEditingPatientNoteId(appt.id);
                                setPatientNoteText(appt.patientNote || '');
                              }}
                              className="p-1 text-slate-400 hover:text-accent rounded transition-colors"
                              title="Describe your condition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Doctor Notes Column */}
                    <td className="px-4 py-4">
                      {editingCommentId === appt.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className="input-field text-xs py-1 px-2 min-w-[140px]"
                            placeholder="Add a note..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveComment(appt.id)}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveComment(appt.id)}
                            disabled={savingComment}
                            className="p-1 bg-success/10 text-success hover:bg-success hover:text-white rounded transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingCommentId(null); setCommentText(''); }}
                            className="p-1 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded transition-colors"
                            title="Cancel"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs italic text-slate-500">
                            {appt.doctorComment || 'No notes yet'}
                          </span>
                          {(userRole === 'doctor' || userRole === 'admin') && (
                            <button
                              onClick={() => {
                                setEditingCommentId(appt.id);
                                setCommentText(appt.doctorComment || '');
                              }}
                              className="p-1 text-slate-400 hover:text-accent rounded transition-colors"
                              title="Edit note"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(appt.id)} className="text-danger hover:bg-danger/10 p-1.5 rounded transition-colors" title="Cancel">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-xl mb-4">Book Appointment</h3>
            <div className="space-y-4">
              {userRole !== 'patient' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Patient Name</label>
                  <input type="text" className="input-field" placeholder="Enter name" value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Select Doctor</label>
                <select className="input-field" value={form.doctorId} onChange={e => setForm({...form, doctorId: e.target.value})}>
                  {doctors.length === 0 && <option value="">No doctors available</option>}
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input type="time" className="input-field" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile Number</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="Enter mobile number" 
                  value={form.mobileNumber} 
                  onChange={e => setForm({...form, mobileNumber: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Describe Your Condition</label>
                <textarea 
                  className="input-field min-h-[70px] text-sm" 
                  placeholder="e.g. Headache for 3 days, mild fever, sore throat..."
                  value={form.diseaseNote}
                  onChange={e => setForm({...form, diseaseNote: e.target.value})}
                />
              </div>

            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={saving || (userRole !== 'patient' && !form.patientName) || !form.date} className="btn-primary flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
