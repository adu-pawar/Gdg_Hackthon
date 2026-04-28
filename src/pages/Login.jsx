import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Loader2 } from 'lucide-react';

const Login = () => {
  const { loginWithEmail, signup, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password, name, role);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      // If Firebase isn't configured, fall back to demo
      if (err.message?.includes('auth/configuration-not-found') || err.message?.includes('auth/invalid-api-key') || err.code === 'auth/invalid-api-key') {
        setError('Firebase not configured. Use demo accounts below.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-dark flex items-center justify-center p-4 transition-colors">
      <div className="max-w-4xl w-full bg-white dark:bg-surface-dark rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800">
        
        {/* Left side - Branding */}
        <div className="w-full md:w-1/2 p-10 bg-gradient-to-br from-primary to-accent text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Activity className="w-10 h-10" />
              <h1 className="text-3xl font-bold">CareFlow</h1>
            </div>
            <h2 className="text-3xl font-semibold mb-4 leading-tight">
              Unified Clinic Operations & Preventive Wellness
            </h2>
            <p className="text-white/80 text-lg">
              Monitor clinic capacity, track medicine expiry, and analyze patient mental wellness in one powerful command center.
            </p>
          </div>
          
          <div className="mt-12 bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
            <p className="text-sm italic">
              "CareFlow optimized our entire clinic's scheduling and completely eliminated expired medicine waste."
            </p>
            <p className="text-xs font-semibold mt-2"></p>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {isSignup ? 'Sign up for a new account' : 'Please sign in to your account'}
            </p>
          </div>

          {(error || authError) && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {isSignup && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    className="input-field"
                    placeholder="Enter Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select 
                    className="input-field" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input 
                type="email" 
                className="input-field"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                className="input-field"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {!isSignup && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary hover:underline font-medium">Forgot password?</a>
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full btn-primary text-lg flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-primary hover:underline font-medium"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>


        </div>
      </div>
    </div>
  );
};

export default Login;
