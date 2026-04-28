import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, PackageOpen, DollarSign, Loader2, PlusCircle, ChevronRight, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAppointments } from '../../services/appointmentService';
import { getAlerts } from '../../services/alertService';
import { getMoodLogs } from '../../services/wellnessService';
import { getMedicines, generateWasteReport } from '../../services/inventoryService';

const chartData = [
  { name: 'Mon', revenue: 400, appointments: 24 },
  { name: 'Tue', revenue: 300, appointments: 13 },
  { name: 'Wed', revenue: 550, appointments: 38 },
  { name: 'Thu', revenue: 200, appointments: 19 },
  { name: 'Fri', revenue: 600, appointments: 43 },
  { name: 'Sat', revenue: 300, appointments: 21 },
  { name: 'Sun', revenue: 100, appointments: 5 },
];

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalAppointments: 0,
    moodRisks: 0,
    expectedRevenue: 0,
    wastePrevented: 0
  });

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [appts, mooods, meds, allAlerts] = await Promise.all([
          getAppointments(),
          getMoodLogs(),
          getMedicines(),
          getAlerts()
        ]);

        // Calculate KPI values safely
        const totalAppointments = appts?.length || 0;
        
        // Count mood risks: assume negative or crisis sentiments
        const moodRisks = mooods?.filter(m => m.sentimentScore === 'negative' || m.sentimentScore === 'crisis').length || 0;
        
        // Revenue estimation
        const expectedRevenue = totalAppointments * 150;

        // Waste prevented calculation
        const wasteReport = generateWasteReport(meds || []);
        const wastePrevented = (wasteReport?.totalUnitsWasted || 0) * 12;

        setStats({
          totalAppointments,
          moodRisks,
          expectedRevenue: isNaN(expectedRevenue) ? 0 : Math.round(expectedRevenue),
          wastePrevented: isNaN(wastePrevented) ? 0 : Math.round(wastePrevented),
        });

        const activeAlerts = (allAlerts || []).filter(a => !a.resolved);
        // sort by timestamp descending
        setAlerts(activeAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));

      } catch (err) {
        console.warn('Admin load failed fallback', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Admin Command Center</h2>
          <p className="text-slate-500">Welcome back, {currentUser?.name}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/inventory" className="btn-primary flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Add Medicine Batch
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="card border-l-4 border-l-primary flex items-center p-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary mr-4">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Appointments</p>
            <p className="text-2xl font-bold">{stats.totalAppointments}</p>
          </div>
        </div>
        <div className="card border-l-4 border-l-danger flex items-center p-4">
          <div className="p-3 bg-danger/10 rounded-lg text-danger mr-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Mood Risk Users</p>
            <p className="text-2xl font-bold">{stats.moodRisks}</p>
          </div>
        </div>
        <div className="card border-l-4 border-l-success flex items-center p-4">
          <div className="p-3 bg-success/10 rounded-lg text-success mr-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Est. Revenue</p>
            <p className="text-2xl font-bold">${stats.expectedRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="card border-l-4 border-l-warning flex items-center p-4">
          <div className="p-3 bg-warning/10 rounded-lg text-warning mr-4">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Waste Evaluated</p>
            <p className="text-2xl font-bold">${stats.wastePrevented.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-lg mb-4">Operations Metrics</h3>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} />
                <Line type="monotone" dataKey="appointments" stroke="#8b5cf6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Monitoring Quick Links */}
        <div className="space-y-4">
          <div className="card bg-slate-900 text-white border-0 overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> System Health
              </h3>
              <p className="text-slate-400 text-xs mb-4">All services are running normally.</p>
              <button className="text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">View Logs</button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
               <Activity className="w-32 h-32" />
            </div>
          </div>

          <Link to="/inventory" className="card p-4 flex items-center justify-between group hover:border-primary/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                <PackageOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Inventory Management</h4>
                <p className="text-xs text-slate-500">Manage stock, batches & suppliers</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
          </Link>

          <Link to="/alerts" className="card p-4 flex items-center justify-between group hover:border-danger/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger/10 rounded-lg group-hover:bg-danger group-hover:text-white transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">System Alerts</h4>
                <p className="text-xs text-slate-500">View critical system notifications</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-danger transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
