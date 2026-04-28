import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Filter, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { getMedicines, addMedicineBatch, deleteMedicine, calculateExpiryStatus, autoReorderCheck } from '../services/inventoryService';

const Inventory = () => {
  const { userRole } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', batchId: '', quantity: '', expiryDate: '', supplier: '', unitCost: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMedicines();
        if (data && data.length > 0) {
          setMedicines(data);
        } else {
          setMedicines([]);
        }
      } catch {
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const newMed = {
        name: form.name,
        batchId: form.batchId,
        quantity: parseInt(form.quantity) || 0,
        expiryDate: form.expiryDate,
        supplier: form.supplier,
        unitCost: parseFloat(form.unitCost) || 1,
      };
      try {
        await addMedicineBatch(newMed);
        const data = await getMedicines();
        setMedicines(data);
      } catch {
        setMedicines(prev => [...prev, { id: Date.now().toString(), ...newMed }]);
      }
    } finally {
      setSaving(false);
      setShowModal(false);
      setForm({ name: '', batchId: '', quantity: '', expiryDate: '', supplier: '', unitCost: '' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMedicine(id);
    } catch { /* ignore */ }
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const filteredMeds = medicines.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.batchId?.toLowerCase().includes(search.toLowerCase())
  );

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
          <h2 className="text-xl md:text-2xl font-bold">Pharmacy Inventory</h2>
          <p className="text-slate-500 text-sm">Manage medicine stock and expiry dates.</p>
        </div>
        {(userRole === 'admin' || userRole === 'pharmacist') && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center">
            <Plus className="w-4 h-4" /> Add Batch
          </button>
        )}
      </div>

      {/* Reorder warnings */}
      {medicines.filter(m => autoReorderCheck(m).needsReorder).length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
          <h4 className="font-bold text-warning mb-2">⚠️ Low Stock Warnings</h4>
          <ul className="space-y-1">
            {medicines.filter(m => autoReorderCheck(m).needsReorder).map(m => (
              <li key={m.id} className="text-sm text-warning/90">• {autoReorderCheck(m).message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search medicines, batches..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary dark:text-white"
            />
          </div>
        </div>

        {filteredMeds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Package className="w-12 h-12 mb-3 opacity-50" />
            <p className="font-medium">No medicines found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Medicine Name</th>
                  <th className="px-4 py-3 font-semibold">Batch ID</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Expiry Date</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  {(userRole === 'admin' || userRole === 'pharmacist') && (
                    <th className="px-4 py-3 font-semibold rounded-tr-lg">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredMeds.map((med) => {
                  const expiry = calculateExpiryStatus(med.expiryDate);
                  const badgeColor = {
                    success: 'bg-success/10 text-success border-success/20',
                    warning: 'bg-warning/10 text-warning border-warning/20',
                    danger: 'bg-danger/10 text-danger border-danger/20',
                  }[expiry.color];

                  return (
                    <tr key={med.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-4 font-medium dark:text-slate-200 flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        {med.name}
                      </td>
                      <td className="px-4 py-4 text-slate-500">{med.batchId}</td>
                      <td className="px-4 py-4 font-semibold dark:text-slate-200">{med.quantity}</td>
                      <td className="px-4 py-4 text-slate-500">{med.expiryDate}</td>
                      <td className="px-4 py-4 text-slate-500">{med.supplier}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 border rounded-md text-xs font-bold ${badgeColor}`}>
                          {expiry.status} {expiry.daysLeft >= 0 ? `(${expiry.daysLeft}d)` : ''}
                        </span>
                      </td>
                      {(userRole === 'admin' || userRole === 'pharmacist') && (
                        <td className="px-4 py-4">
                          <button onClick={() => handleDelete(med.id)} className="text-danger hover:bg-danger/10 p-1.5 rounded transition-colors" title="Remove">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-xl mb-4">Add Medicine Batch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Medicine Name</label>
                <input type="text" className="input-field" placeholder="Paracetamol 500mg" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Batch ID</label>
                  <input type="text" className="input-field" placeholder="B-2024-06" value={form.batchId} onChange={e => setForm({...form, batchId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="number" className="input-field" placeholder="1000" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input type="date" className="input-field" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <input type="text" className="input-field" placeholder="MedCorp" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.name} className="btn-primary flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
