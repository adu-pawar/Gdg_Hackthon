import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          You do not have permission to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate(-1)} 
              className="btn-secondary flex-1"
            >
              Go Back
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn-primary flex-1"
            >
              Dashboard
            </button>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center gap-2 py-2.5 text-slate-500 hover:text-danger hover:bg-danger/5 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out / Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
