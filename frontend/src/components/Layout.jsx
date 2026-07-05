import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import {
  LogOut,
  User as UserIcon,
  Bell,
  Search
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userRoleStr = user?.role?.value || user?.role || 'viewer';

  return (
    <div className="flex h-screen overflow-hidden bg-dark-base text-text-primary">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        userRole={user?.role || 'viewer'}
      />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 h-16 bg-dark-base z-10 flex-shrink-0">
          {/* Global Search Bar */}
          <div className="relative w-64 md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-secondary">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search console alerts, incidents..."
              className="w-full pl-10 pr-4 py-2 bg-[#161616] hover:bg-[#1e1e1e] focus:bg-[#161616] border border-white/[0.04] focus:border-accent-lime rounded-full text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none transition-all duration-200"
            />
          </div>

          {/* User Controls & Notifications */}
          <div className="flex items-center space-x-3.5">
            {/* Notification Bell */}
            <button className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary bg-[#161616] hover:bg-[#1e1e1e] border border-white/[0.04] rounded-full transition-all">
              <Bell size={15} />
            </button>

            {/* Profile Summary */}
            <div className="flex items-center space-x-2.5 px-3 py-1.5 bg-[#161616] border border-white/[0.04] rounded-full select-none">
              <div className="w-6 h-6 rounded-full bg-accent-lime/10 flex items-center justify-center text-accent-lime border border-accent-lime/20">
                <UserIcon size={12} className="stroke-[2.5]" />
              </div>
              <div className="flex flex-col text-left leading-none pr-1">
                <span className="text-[11px] font-bold text-white tracking-tight">{user?.name || 'Analyst'}</span>
                <span className="text-[8px] font-mono text-accent-lime uppercase mt-0.5 tracking-wider">{(userRoleStr).toUpperCase()}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-severity-critical bg-[#161616] hover:bg-[#1e1e1e] border border-white/[0.04] rounded-full transition-all"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
