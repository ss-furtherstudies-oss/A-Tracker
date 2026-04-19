import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2, Globe, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [view, setView] = useState('login'); // 'login' or 'forgot'

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    const { error } = await resetPassword(email);
    if (error) setError(error.message);
    else setMsg("Check your email for the reset link!");
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a192f] flex items-center justify-center p-4 relative overflow-hidden font-inter">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo/Header Area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-2xl mb-6 relative group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
             <ShieldCheck size={40} className="text-orange-500 animate-pulse-subtle" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            A-TRACKER <span className="text-orange-500">PRO</span>
          </h1>
          <p className="text-slateBlue-300 font-medium tracking-wide text-sm opacity-80">
            ENTERPRISE STUDENT ANALYTICS SYSTEM
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/20">
          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slateBlue-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-semibold text-slateBlue-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slateBlue-400 uppercase tracking-widest">Secure Password</label>
                  <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline">Forgot?</button>
                </div>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-semibold text-slateBlue-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-in shake duration-300">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#0a192f] text-white rounded-2xl font-black text-sm tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    AUTHORIZE ACCESS
                    <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slateBlue-400 uppercase tracking-widest ml-1">Email for recovery</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-semibold text-slateBlue-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">{error}</div>}
              {msg && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold border border-emerald-100">{msg}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "SEND RESET LINK"}
              </button>
              
              <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs font-bold text-gray-400 hover:text-slateBlue-800 transition-colors">
                Back to Login
              </button>
            </form>
          )}

          <div className="pt-4 text-center">
            <p className="text-[10px] text-gray-400 font-medium">
              Authorized access only. Log in with your institutional credentials provided by the administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-gray-400 text-xs font-bold tracking-wide flex items-center justify-center gap-2">
          A-Tracker @ 2026 (v1.2.0)
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
