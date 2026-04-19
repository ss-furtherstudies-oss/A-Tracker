import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Check, AlertCircle, LogOut, Globe, Users, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';

const Settings = () => {
  const { user, role, updatePassword, signOut } = useAuth();
  const { i18n } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  // Fetch all users if the current user is an ADMIN
  useEffect(() => {
    if (role === 'ADMIN') {
      fetchUsers();
    }
  }, [role]);

  const fetchUsers = async () => {
    setUserLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email');
    if (!error) setAllUsers(data);
    setUserLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      setError(error.message);
    } else {
      setMsg("User role updated successfully!");
      fetchUsers();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    setMsg(null);
    const { error } = await updatePassword(newPassword);
    if (error) setError(error.message);
    else {
      setMsg("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slateBlue-800 tracking-tight">System Settings</h1>
          <p className="text-gray-500 font-medium">Manage your account and security preferences</p>
        </div>
        <button 
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-100 shadow-sm"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slateBlue-100 rounded-3xl flex items-center justify-center mb-4 text-slateBlue-600 font-black text-2xl uppercase">
            {user?.email?.charAt(0)}
          </div>
          <h2 className="font-black text-slateBlue-800 truncate w-full px-2" title={user?.email}>{user?.email}</h2>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase mt-2 border border-emerald-100">
            Active Session
          </span>
          <div className="mt-6 w-full pt-6 border-t border-gray-50 text-left space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account ID</p>
            <p className="text-[11px] font-mono text-gray-500 break-all">{user?.id}</p>
          </div>
        </div>

        {/* Security Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-aura-teal/10 rounded-lg text-aura-teal">
                <Key size={20} />
              </div>
              <h3 className="text-lg font-black text-slateBlue-800">Security & Password</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-aura-teal/20 outline-none transition-all font-semibold text-slateBlue-800"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-aura-teal/20 outline-none transition-all font-semibold text-slateBlue-800"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              {msg && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100">
                  <Check size={14} /> {msg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-slateBlue-800 text-white rounded-xl font-black text-sm tracking-widest hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? "UPDATING..." : "UPDATE PASSWORD"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Globe size={20} />
              </div>
              <h3 className="text-lg font-black text-slateBlue-800">Language & Localization</h3>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preferred Language</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => i18n.changeLanguage('en')}
                  className={`flex-1 py-4 rounded-xl font-bold text-sm border transition-all ${
                    i18n.language.startsWith('en') 
                      ? 'bg-slateBlue-800 text-white border-slateBlue-800 shadow-md' 
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  English (United States)
                </button>
                <button 
                  onClick={() => i18n.changeLanguage('zh')}
                  className={`flex-1 py-4 rounded-xl font-bold text-sm border transition-all ${
                    i18n.language.startsWith('zh') 
                      ? 'bg-slateBlue-800 text-white border-slateBlue-800 shadow-md' 
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  繁體中文 (香港)
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-medium ml-1 italic">
                Changing this will update all interface labels and navigation items immediately.
              </p>
            </div>
          </div>

          {/* User Management Section (ADMIN ONLY) */}
          {role === 'ADMIN' && (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                    <Users size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slateBlue-800">Access Control</h3>
                </div>
                <button 
                  onClick={fetchUsers}
                  className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-all"
                  disabled={userLoading}
                >
                  <Loader2 size={16} className={userLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-4">Registered Users & Permissions</p>
                <div className="grid gap-3">
                  {allUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-aura-teal/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-slateBlue-600 border border-gray-100 shadow-sm">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slateBlue-800">{u.email}</p>
                          <p className="text-[9px] font-medium text-gray-400 font-mono">{u.id.substring(0, 8)}...</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest border transition-all ${
                          u.role === 'ADMIN' 
                            ? 'bg-rose-50 border-rose-200 text-rose-600' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        }`}>
                          {u.role === 'ADMIN' ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
                          {u.role}
                        </div>
                        
                        {/* Don't let user change their own role here to prevent accidents */}
                        {u.id !== user.id && (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg text-[10px] font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-aura-teal/20 cursor-pointer"
                          >
                            <option value="VIEWER">VIEWER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-slateBlue-50 rounded-[2rem] p-6 border border-slateBlue-100 flex items-start gap-4">
            <div className="p-2 bg-white rounded-xl text-slateBlue-600 shadow-sm">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="font-black text-slateBlue-800 text-sm">Enterprise Security</h4>
              <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                Your credentials are encrypted and managed by Supabase Auth. We recommend using a unique password and enabling multi-factor authentication if required by your organization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
