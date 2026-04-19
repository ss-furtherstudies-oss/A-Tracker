import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Globe, User, ShieldCheck, ShieldAlert, X, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, role, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('en') ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };
  
  let breadcrumbText = t('sidebar.dashboard');
  if (location.pathname.startsWith('/students')) {
    breadcrumbText = 'STUDENTS';
  } else if (location.pathname.startsWith('/applications')) {
    breadcrumbText = 'U-APP';
  } else if (location.pathname.startsWith('/rankings')) {
    breadcrumbText = 'QS RANKINGS';
  } else if (location.pathname.startsWith('/statistics')) {
    breadcrumbText = 'STATISTICS';
  } else if (location.pathname.startsWith('/settings')) {
    breadcrumbText = 'SETTINGS';
  }

  return (
    <header className="glass-header h-16 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm border-b border-gray-100">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-black tracking-tight bg-gradient-to-br from-aura-teal via-aura-teal to-serene-indigo bg-clip-text text-transparent drop-shadow-sm font-sans uppercase">
          {t('app.title')}
        </h1>
        {/* Modern Breadcrumb */}
        <div className="hidden sm:flex items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
           <span className="opacity-40">Main</span>
           <span className="mx-2 opacity-20">/</span>
           <span className="text-slateBlue-800 uppercase">{breadcrumbText}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4 flex-1 justify-end">
        {/* User Badge */}
        <div className="hidden lg:flex items-center gap-3 mr-2 bg-slateBlue-50/50 pl-3 pr-1 py-1 rounded-full border border-slateBlue-100">
          <span className="text-[11px] font-bold text-slateBlue-700 truncate max-w-[150px]">{user?.email}</span>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border transition-all ${
            role === 'ADMIN' 
              ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            {role === 'ADMIN' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
            {role}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative hidden md:block w-48 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-aura-teal transition-colors">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder={t('app.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full border border-gray-200 rounded-super text-xs focus:outline-none focus:ring-2 focus:ring-aura-teal/50 bg-white transition-all shadow-sm"
          />
        </div>

        {/* User Menu Dropdown Container */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`p-2 rounded-full transition-all flex items-center justify-center cursor-pointer ${
              showUserMenu ? 'bg-aura-teal text-white shadow-lg' : 'text-gray-500 hover:text-aura-teal hover:bg-slateBlue-100'
            }`}
          >
            <User size={20} />
          </button>

          {showUserMenu && (
            <>
              {/* Invisible backdrop to close menu */}
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              
              <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logged in as</p>
                  <p className="text-xs font-bold text-slateBlue-800 truncate">{user?.email}</p>
                </div>
                
                <Link 
                  to="/settings" 
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-aura-teal hover:bg-slateBlue-50 transition-colors"
                >
                  <SettingsIcon size={16} /> Account Settings
                </Link>

                <button 
                  onClick={() => {
                    const newLang = i18n.language.startsWith('en') ? 'zh' : 'en';
                    i18n.changeLanguage(newLang);
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-aura-teal hover:bg-slateBlue-50 transition-colors"
                >
                  <Globe size={16} /> {i18n.language.startsWith('en') ? '繁體中文' : 'English'}
                </button>
                
                <div className="border-t border-gray-50 my-1" />
                
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
