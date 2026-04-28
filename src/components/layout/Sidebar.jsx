import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Pill, 
  BrainCircuit, 
  BellRing,
  Activity
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ isOpen, onClose }) => {
  const { userRole } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'patient', 'pharmacist'] },
    { name: 'Appointments', path: '/appointments', icon: CalendarCheck, roles: ['admin', 'doctor', 'patient'] },
    { name: 'Inventory', path: '/inventory', icon: Pill, roles: ['admin', 'doctor', 'pharmacist'] },
    { name: 'Wellness', path: '/wellness', icon: BrainCircuit, roles: ['admin', 'doctor', 'patient'] },
    { name: 'Alerts', path: '/alerts', icon: BellRing, roles: ['admin', 'doctor', 'pharmacist'] },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        "fixed inset-y-0 left-0 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 w-64 h-screen z-40 flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <Activity className="w-8 h-8 text-primary mr-2 hover:scale-110 transition-transform cursor-pointer" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CareFlow
          </h1>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4 px-3">Main Menu</p>
          <ul className="space-y-1">
            {allowedItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => { if(window.innerWidth < 1024) onClose(); }}
                    className={({ isActive }) => clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium",
                      isActive 
                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
