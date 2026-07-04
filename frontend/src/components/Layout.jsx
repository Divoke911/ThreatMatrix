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
        <header className="flex items-center justify-between px-6 border-b border-dark-border h-16 bg-dark-panel/30 backdrop-blur-md z-10 flex-shrink-0">
          {/* Global Search Bar */}
          <div className="relative w-64 md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search alerts, IPs, incidents..."
              className="w-full pl-9 pr-4 py-1.5 bg-dark-input hover:bg-dark-input/85 focus:bg-dark-panel border border-dark-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-cyan transition-colors"
            />
          </div>

          {/* User Controls & Notifications */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-dark-hover rounded transition-all">
              <Bell size={18} />
            </button>

            {/* Profile Summary */}
            <div className="flex items-center space-x-3 pl-2 border-l border-dark-border">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-semibold text-text-primary">{user?.name}</span>
                <span className="text-[10px] font-mono text-accent-cyan uppercase">{user?.role}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-dark-hover border border-dark-border flex items-center justify-center text-accent-cyan">
                <UserIcon size={16} />
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-1.5 text-text-secondary hover:text-severity-critical hover:bg-dark-hover rounded transition-all"
              title="Logout"
            >
              <LogOut size={18} />
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
