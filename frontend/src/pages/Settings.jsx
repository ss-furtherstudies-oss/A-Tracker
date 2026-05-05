import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Check, AlertCircle, LogOut, Globe, Users, ShieldCheck, ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as db from '../lib/supabaseService';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Fetch all users if the current user is an ADMIN
  useEffect(() => {
    if (role === 'ADMIN') {
      fetchUsers();
    }
  }, [role]);

  // Detect recovery flow from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
      setShowRecoveryModal(true);
      // Optional: clear the hash so it doesn't stay in the URL
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, []);

  const fetchUsers = async () => {
    setUserLoading(true);
    const { data, error } = await db.fetchProfiles();
    if (!error) setAllUsers(data);
    setUserLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    const { error } = await db.updateProfile(userId, { role: newRole });

    if (error) {
      setError(error.message);
    } else {
      setMsg("User role updated successfully!");
      fetchUsers();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handlePermissionChange = async (userObj, page, value) => {
    if (userObj.id === user.id) return; // Prevent self-editing

    const currentPermissions = userObj.permissions || {
      dashboard: 'view',
      students: 'view',
      stats: 'view',
      rankings: 'view',
      uapp: 'view',
      settings: 'view'
    };

    const newPermissions = {
      ...currentPermissions,
      [page]: value ? 'edit' : 'view'
    };

    const { error } = await db.updateProfile(userObj.id, { permissions: newPermissions });

    if (error) {
      setError(error.message);
    } else {
      fetchUsers();
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Section: Access Control (Fuller Width) */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          {role === 'ADMIN' ? (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 min-h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slateBlue-800">Access Control Management</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Manage module-level permissions for all staff</p>
                  </div>
                </div>
                <button 
                  onClick={fetchUsers}
                  className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                  disabled={userLoading}
                >
                  <Loader2 size={14} className={userLoading ? 'animate-spin' : ''} />
                  {userLoading ? 'Syncing...' : 'Refresh List'}
                </button>
              </div>

              <div className="overflow-x-auto -mx-8 px-8">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="pb-4 pl-4">User Account</th>
                      <th className="pb-4 px-2 text-center">Dashboard</th>
                      <th className="pb-4 px-2 text-center">Students</th>
                      <th className="pb-4 px-2 text-center">Statistics</th>
                      <th className="pb-4 px-2 text-center">QS Rankings</th>
                      <th className="pb-4 px-2 text-center">U-App</th>
                      <th className="pb-4 px-2 text-center">Settings</th>
                      <th className="pb-4 pr-4 text-right">System Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    {allUsers.map((u) => {
                      const isMaster = u.id === user.id;
                      const isEditor = u.role === 'ADMIN';
                      
                      return (
                        <tr key={u.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors rounded-2xl overflow-hidden shadow-sm">
                          <td className="py-5 pl-4 first:rounded-l-2xl">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-[11px] font-black text-slateBlue-600 border border-gray-100 shadow-sm">
                                {u.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black text-slateBlue-800 truncate max-w-[140px]" title={u.email}>{u.email}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{isMaster ? 'Master Admin' : 'Staff Member'}</span>
                              </div>
                            </div>
                          </td>
                          
                          {/* Granular Permission Boxes */}
                          {['dashboard', 'students', 'stats', 'rankings', 'uapp', 'settings'].map(page => {
                            const perms = u.permissions || {};
                            const hasEdit = perms[page] === 'edit' || u.role === 'ADMIN';
                            
                            return (
                              <td key={page} className="py-5 px-2 text-center">
                                <button
                                  disabled={isMaster}
                                  className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center group/check ${
                                    hasEdit 
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                      : 'bg-white border-gray-200 text-gray-200 hover:border-emerald-300 hover:text-emerald-300'
                                  } ${isMaster ? 'opacity-100 cursor-default' : 'cursor-pointer active:scale-90'}`}
                                  onClick={() => handlePermissionChange(u, page, !hasEdit)}
                                  title={hasEdit ? 'Has Edit Access' : 'View Only Access'}
                                >
                                  <Check size={14} strokeWidth={4} className={hasEdit ? 'scale-100' : 'scale-75 group-hover/check:scale-100 transition-transform'} />
                                </button>
                              </td>
                            );
                          })}

                          <td className="py-5 pr-4 text-right last:rounded-r-2xl">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest border transition-all ${
                              u.role === 'ADMIN' 
                                ? 'bg-slateBlue-800 border-slateBlue-900 text-white shadow-md' 
                                : 'bg-white border-gray-200 text-gray-400'
                            }`}>
                              {u.role === 'ADMIN' ? <ShieldCheck size={10} /> : <Eye size={10} />}
                              {u.role === 'ADMIN' ? 'EDITOR' : 'VIEWER'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-aura-teal/5 rounded-[1.5rem] border border-aura-teal/10 flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl text-aura-teal shadow-sm shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slateBlue-800 text-xs uppercase tracking-wide">Editor Privileges</h4>
                    <p className="text-[10px] text-gray-500 font-medium mt-1 leading-relaxed">
                      Checkboxes above allow you to toggle "Editor" (Checked) vs "Viewer" (Unchecked) access. Editors can add, edit, and delete data within that module.
                    </p>
                  </div>
                </div>
                <div className="p-5 bg-amber-50 rounded-[1.5rem] border border-amber-100 flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl text-amber-600 shadow-sm shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slateBlue-800 text-xs uppercase tracking-wide">Security Note</h4>
                    <p className="text-[10px] text-gray-500 font-medium mt-1 leading-relaxed">
                      Role changes take effect immediately across all sessions. Master accounts cannot be downgraded for safety.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <ShieldAlert size={48} className="text-gray-200 mb-4" />
              <h3 className="text-xl font-black text-slateBlue-800">Administrator Access Required</h3>
              <p className="text-gray-500 max-w-sm mt-2 font-medium">You do not have permission to manage user access levels. Please contact your system administrator.</p>
            </div>
          )}
        </div>

        {/* Sidebar: Profile & Security (Right Most) */}
        <div className="space-y-6 order-1 lg:order-2">
          {/* Profile Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slateBlue-100 rounded-3xl flex items-center justify-center mb-4 text-slateBlue-600 font-black text-2xl uppercase">
              {user?.email?.charAt(0)}
            </div>
            <h2 className="font-black text-slateBlue-800 truncate w-full px-2 text-sm" title={user?.email}>{user?.email}</h2>
            <div className="flex gap-2 mt-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase border border-emerald-100 tracking-tighter">
                Session Active
              </span>
              <span className="px-3 py-1 bg-slateBlue-800 text-white rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg shadow-slateBlue-800/20">
                {role}
              </span>
            </div>
          </div>

          {/* Security & Language grouped */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 space-y-8">
            {/* Language */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Globe size={16} className="text-indigo-500" />
                <h3 className="text-[10px] font-black text-slateBlue-800 uppercase tracking-widest">Localization</h3>
              </div>
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button 
                  onClick={() => i18n.changeLanguage('en')}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all ${
                    i18n.language.startsWith('en') 
                      ? 'bg-white text-slateBlue-800 shadow-sm border border-gray-50' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  English
                </button>
                <button 
                  onClick={() => i18n.changeLanguage('zh')}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all ${
                    i18n.language.startsWith('zh') 
                      ? 'bg-white text-slateBlue-800 shadow-sm border border-gray-50' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  繁體中文
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Key size={16} className="text-aura-teal" />
                <h3 className="text-[10px] font-black text-slateBlue-800 uppercase tracking-widest">Security</h3>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-aura-teal/20 outline-none transition-all text-xs font-semibold"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-aura-teal/20 outline-none transition-all text-xs font-semibold"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-[10px] text-red-500 font-bold px-1 animate-pulse">{error}</p>}
                {msg && <p className="text-[10px] text-emerald-500 font-bold px-1">{msg}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-slateBlue-800 text-white rounded-xl font-black text-[10px] tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {loading ? "SAVING..." : "UPDATE SECURITY"}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-slateBlue-50/50 rounded-[2rem] p-6 border border-slateBlue-100/50 backdrop-blur-sm">
            <h4 className="font-black text-slateBlue-800 text-[10px] flex items-center gap-2 uppercase tracking-widest">
              <ShieldCheck size={14} className="text-emerald-500" /> System Integrity
            </h4>
            <p className="text-[10px] text-gray-500 font-medium mt-2 leading-relaxed italic">
              "Your credentials are encrypted and managed by Supabase Auth."
            </p>
          </div>
        </div>
      </div>

      {/* Recovery / Reset Password Mandatory Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slateBlue-900/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 rounded-2xl mb-4">
                <ShieldCheck size={32} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-black text-slateBlue-800 tracking-tight">Reset Your Password</h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">Please set a new secure password to regain full access to your account.</p>
            </div>

            <form onSubmit={async (e) => {
              await handleUpdatePassword(e);
              if (!error) setShowRecoveryModal(false);
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Secure Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-semibold text-slateBlue-800"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-semibold text-slateBlue-800"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-in shake duration-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                {loading ? "UPDATING..." : "COMPLETE PASSWORD RESET"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
