import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PackageX, TrendingDown, Bell, Loader2 } from 'lucide-react';
import { getMedicines, calculateExpiryStatus, autoReorderCheck } from '../../services/inventoryService';
import { getAlerts } from '../../services/alertService';
import { Link } from 'react-router-dom';

const PharmacistDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchPharmacyData = async () => {
      try {
        const meds = await getMedicines();
        const allAlerts = await getAlerts();
        
        setMedicines(meds || []);
        
        const activeAlerts = (allAlerts || []).filter(a => !a.resolved);
        setAlerts(activeAlerts);
        
      } catch (err) {
        console.warn('Pharmacist load failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPharmacyData();
  }, []);

  const alertsByType = {
    expiry: alerts.filter(a => a.type === 'expiry'),
    stock: alerts.filter(a => a.type === 'stock')
  };

  const medsWithStatus = medicines.map(m => ({
    ...m,
    expiryObj: calculateExpiryStatus(m.expiryDate),
    stockObj: autoReorderCheck(m)
  }));

  const expiringSoonCount = medsWithStatus.filter(m => m.expiryObj.daysLeft >= 0 && m.expiryObj.daysLeft <= 30).length;
  const expiredCount = medsWithStatus.filter(m => m.expiryObj.daysLeft < 0).length;
  const lowStockCount = medsWithStatus.filter(m => m.stockObj.needsReorder).length;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Pharmacy Operations</h2>
          <p className="text-slate-500">Welcome, {currentUser?.name}</p>
        </div>
        <Link to="/inventory" className="btn-primary">Manage Inventory</Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="card flex items-center p-5 border-l-4 border-l-warning bg-warning/5">
          <div className="p-4 bg-warning/20 rounded-full text-warning mr-5">
            <PackageX className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-warning/80 uppercase tracking-wide font-bold mb-1">Expiring Soon (&lt;30d)</p>
            <p className="text-3xl font-bold text-warning">{expiringSoonCount}</p>
          </div>
        </div>
        <div className="card flex items-center p-5 border-l-4 border-l-danger bg-danger/5">
          <div className="p-4 bg-danger/20 rounded-full text-danger mr-5">
            <PackageX className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-danger/80 uppercase tracking-wide font-bold mb-1">Expired Stock</p>
            <p className="text-3xl font-bold text-danger">{expiredCount}</p>
          </div>
        </div>
        <div className="card flex items-center p-5 border-l-4 border-l-primary bg-primary/5">
          <div className="p-4 bg-primary/20 rounded-full text-primary mr-5">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-primary/80 uppercase tracking-wide font-bold mb-1">Low Stock Alerts</p>
            <p className="text-3xl font-bold text-primary">{lowStockCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Expiry Watchlist */}
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" /> Critical Watchlist
            </h3>
          </div>
          
          {alertsByType.expiry.length === 0 && alertsByType.stock.length === 0 ? (
             <p className="text-sm text-slate-500 py-8 text-center bg-slate-50 dark:bg-slate-800 rounded-lg">No critical alerts right now. Inventory is healthy.</p>
          ) : (
            <div className="space-y-3">
              {alertsByType.expiry.map(alert => (
                <div key={alert.id} className={`flex items-center justify-between p-4 border rounded-xl ${alert.severity === 'danger' ? 'border-danger/20 bg-danger/5' : 'border-warning/20 bg-warning/5'}`}>
                  <div>
                    <h4 className={`font-bold flex items-center gap-2 ${alert.severity === 'danger' ? 'text-danger' : 'text-warning'}`}>
                      <span className={`w-2 h-2 rounded-full ${alert.severity === 'danger' ? 'bg-danger' : 'bg-warning'}`}></span> 
                      {alert.severity === 'danger' ? 'EXPIRED' : 'Expiring Soon'}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{alert.message}</p>
                  </div>
                  <button className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${alert.severity === 'danger' ? 'bg-danger/20 text-danger hover:bg-danger/30' : 'bg-warning/20 text-warning hover:bg-warning/30'}`}>Action</button>
                </div>
              ))}
              
              {alertsByType.stock.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-4 border border-danger/20 bg-danger/5 rounded-xl">
                  <div>
                    <h4 className="font-bold text-danger flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-danger"></span> Low Stock
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{alert.message}</p>
                  </div>
                  <button className="text-sm font-bold bg-danger/20 text-danger px-4 py-2 rounded-lg hover:bg-danger/30 transition-colors">Reorder</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refill Requests (Mocked UI) */}
        <div className="card flex flex-col h-full">
          <h3 className="font-semibold text-lg mb-4">Pending Requests</h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm">Patient #{1020 + i}</span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 font-semibold px-2 py-0.5 rounded text-slate-500">2h ago</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Requested refill for Metformin 500mg (30 days)</p>
                <div className="flex gap-2">
                  <button className="flex-1 text-xs btn-primary py-1.5">Approve</button>
                  <button className="flex-1 text-xs btn-secondary py-1.5">Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
