import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Sun, Moon, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscribeAlerts } from '../../services/alertService';

const Navbar = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  // Using global window vars from App.jsx for demo simplicity
  // In a real app we'd use a ThemeContext
  const [isDark, setIsDark] = React.useState(document.documentElement.classList.contains('dark'));
  
  const handleToggleTheme = () => {
    if (window.toggleDarkMode) {
      window.toggleDarkMode();
      setIsDark(!isDark);
    }
  };

  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const unsub = subscribeAlerts((data) => {
      const unread = data.filter(a => !a.resolved).length;
      setUnreadCount(unread);
    });
    return () => unsub();
  }, []);

  return (
    <nav className="h-16 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-2 md:gap-4 w-auto md:w-96">
        <button 
          onClick={onMenuClick}
          className="p-2 md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative w-full hidden lg:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white text-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={handleToggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <Link to="/alerts" className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-surface-dark">
              {unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-slate-200 dark:border-slate-700 ml-1 md:ml-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {currentUser?.name?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-xs md:text-sm">
            <p className="font-semibold text-slate-800 dark:text-white max-w-[80px] md:max-w-[120px] truncate">{currentUser?.name}</p>
          </div>
          <button onClick={logout} className="ml-1 text-xs text-danger hover:underline">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
