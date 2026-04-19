import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, FileText, Settings, Sparkles, Trophy, Sigma } from 'lucide-react';
import classNames from 'classnames';

const Sidebar = () => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'sidebar.dashboard' },
    { to: '/students', icon: Users, label: 'sidebar.students' },
    { to: '/applications', icon: FileText, label: 'sidebar.applications' },
    { to: '/rankings', icon: Trophy, label: 'sidebar.rankings' },
    { to: '/statistics', icon: Sigma, label: 'sidebar.statistics' },
    { to: '/settings', icon: Settings, label: 'sidebar.settings' },
  ];

  return (
    <>
      <nav 
        className={classNames(
          "hidden md:flex flex-col bg-white border-r border-gray-200 h-screen fixed left-0 top-0 transition-all duration-300 z-50 overflow-hidden",
          isHovered ? "w-64 shadow-deep" : "w-20"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Branding Hub */}
        <div className="h-16 flex items-center shrink-0 border-b border-gray-100">
          <div className="w-20 flex justify-center shrink-0">
            <Sparkles className="text-aura-teal" size={28} />
          </div>
          <div className="flex-1 whitespace-nowrap overflow-hidden transition-opacity">
            <span className={classNames(
              "font-bold text-lg bg-gradient-to-r from-aura-teal to-serene-indigo bg-clip-text text-transparent",
              isHovered ? "opacity-100" : "opacity-0"
            )}>
              {t('app.title')}
            </span>
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 py-8 flex flex-col gap-2 relative h-full">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => classNames(
                "group relative flex items-center h-12 w-full mx-auto transition-colors cursor-pointer rounded-r-super",
                isActive 
                  ? "bg-aura-teal/10 text-aura-teal border-l-4 border-aura-teal" 
                  : "text-slateBlue-800 hover:bg-slateBlue-100 hover:text-serene-indigo border-l-4 border-transparent"
              )}
            >
              <div className="w-20 flex justify-center shrink-0">
                <item.icon size={22} className="transition-transform group-hover:scale-110" />
              </div>
              <span className={classNames(
                "font-medium whitespace-nowrap transition-opacity",
                isHovered ? "opacity-100" : "opacity-0"
              )}>
                {t(item.label)}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => classNames(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-aura-teal" : "text-gray-400 hover:text-slateBlue-800"
            )}
          >
            <item.icon size={24} />
            <span className="text-[10px] transform scale-90">{t(item.label)}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
