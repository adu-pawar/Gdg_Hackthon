import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Brain, Clock, ShieldAlert, Pill, Loader2, Video, Plus, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createAppointment, getAppointmentsByPatient, updateAppointment } from '../../services/appointmentService';
import { queryCollection } from '../../firebase/firestore';

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [targetAppt, setTargetAppt] = useState(null);
  
  // Booking Form State
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [diseaseNote, setDiseaseNote] = useState('');

  const fetchData = async () => {
    try {
      const data = await getAppointmentsByPatient(currentUser?.uid || 'temp');
      setAppointments(data || []);
      
      // Find the next upcoming (sorted by date/time)
      const sorted = (data || []).sort((a,b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
      setTargetAppt(sorted[0]);
      
      const docs = await queryCollection('users', 'role', '==', 'doctor');
      setDoctors(docs || []);
    } catch (err) {
      console.warn('Patient fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      if (isRescheduling && targetAppt) {
        await updateAppointment(targetAppt.id, {
          date,
          time: timeSlot,
          status: 'pending'
        });
        setSuccessMsg('Your appointment has been successfully rescheduled!');
      } else {
        const selectedDoc = doctors.find(d => d.id === doctorId) || doctors[0];
        const docId = selectedDoc?.id || '1';
        const docName = selectedDoc?.name || 'Dr. Default Doc';

        await createAppointment({
          patientId: currentUser?.uid || 'patient-id',
          patientName: currentUser?.name || 'Patient Name',
          doctorId: docId,
          doctorName: docName,
          doctor: docName,
          date,
          time: timeSlot,
          status: "pending",
          patientNote: diseaseNote,
          doctorComment: ""
        });
        setSuccessMsg('Your appointment request has been sent successfully!');
      }
      setIsRescheduling(false);
      setDate('');
      setTimeSlot('');
      setDiseaseNote('');
      fetchData(); // Refresh list to show next appt
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Hello, {currentUser?.name?.split(' ')[0] || 'Patient'}! 👋</h2>
        <p className="text-slate-500">Here is your health summary for today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Next Appointment Card (Restored) */}
        <div className="card lg:col-span-2 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-l-primary flex flex-col justify-center">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-bold text-primary tracking-wider uppercase mb-2">Next Appointment</p>
              {targetAppt ? (
                <>
                  <h3 className="text-2xl font-bold">{targetAppt.doctorName || targetAppt.doctor}</h3>
                  <p className="text-slate-500 font-medium">{targetAppt.status === 'pending' ? 'Request Pending' : 'Confirmed Checkup'}</p>
                </>
              ) : (
                <h3 className="text-xl font-bold text-slate-400">No upcoming appointments</h3>
              )}
            </div>
            
            {targetAppt && (
              <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 p-4 rounded-xl text-center min-w-[120px]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{targetAppt.date}</p>
                <p className="text-xl font-bold text-accent">{targetAppt.time}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {targetAppt ? (
              <>
                <button onClick={() => { setIsRescheduling(true); setDate(targetAppt.date || ''); setTimeSlot(targetAppt.time || ''); setDiseaseNote(targetAppt.patientNote || ''); window.scrollTo(0, document.body.scrollHeight); }} className="btn-secondary text-sm font-medium hover:underline py-2 px-4 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg">Reschedule</button>
              </>
            ) : (
                <p className="text-sm text-slate-500">Use the form below to book your next visit.</p>
            )}
          </div>
        </div>

        {/* Action Call - Mental Wellness */}
        <Link to="/wellness" className="card bg-accent hover:bg-violet-600 transition-colors text-white flex flex-col justify-between group cursor-pointer border-0 shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/20 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold font-medium tracking-wide">Daily Task</span>
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-1 group-hover:translate-x-1 transition-transform">Mental Wellness Check-in</h3>
            <p className="text-white/80 text-sm">Takes 30 seconds. How are you feeling today?</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Book Appointment Card (Kept below) */}
        <div className="card">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" /> {isRescheduling ? 'Reschedule Appointment' : 'Book Appointment'}
          </h3>
          {isRescheduling && (
            <div className="mb-4 p-2 bg-primary/10 rounded flex justify-between items-center text-sm text-primary font-medium">
              <span>Rescheduling '{targetAppt?.doctorName}'</span>
              <button onClick={() => { setIsRescheduling(false); setDate(''); setTimeSlot(''); setDiseaseNote(''); }} className="hover:underline">Cancel</button>
            </div>
          )}
          
          {successMsg ? (
            <div className="py-4 text-center">
               <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
               <p className="text-success font-bold text-sm">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleBookAppointment} className="space-y-3">
                <select className="input-field text-sm" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
                  <option value="" disabled>Select Doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="date" 
                    className="input-field text-sm" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    required 
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    type="time"
                    className="input-field text-sm"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    required
                  />
                </div>
                <textarea 
                  className="input-field text-sm min-h-[60px]" 
                  placeholder="Describe your condition... (optional)" 
                  value={diseaseNote}
                  onChange={(e) => setDiseaseNote(e.target.value)}
                />
                <button 
                    type="submit" 
                    disabled={!date || !timeSlot || bookingLoading} 
                    className="btn-primary w-full py-2 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                    {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} 
                    {isRescheduling ? 'Confirm Reschedule' : 'Book Now'}
                </button>
            </form>
          )}
        </div>

        {/* Emergency Info */}
        <div className="card bg-danger/5 border border-danger/20 border-l-4 border-l-danger h-full">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-danger">
              <ShieldAlert className="w-5 h-5" /> Emergency Support
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              If you are experiencing a medical emergency, please reach out immediately.
            </p>
            <button className="bg-danger hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-xs w-full transition-colors shadow-sm">
                Call Helpline
            </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
