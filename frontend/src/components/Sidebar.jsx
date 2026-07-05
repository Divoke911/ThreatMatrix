import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed, userRole }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'analyst', 'viewer'] },
    { name: 'Alerts', path: '/alerts', icon: ShieldAlert, roles: ['admin', 'analyst', 'viewer'] },
    { name: 'Incidents', path: '/incidents', icon: FileText, roles: ['admin', 'analyst', 'viewer'] },
    { name: 'User Management', path: '/users', icon: Users, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'analyst', 'viewer'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div
      className={`
        flex flex-col h-screen glass-panel border-r border-dark-border transition-all duration-300 relative
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border h-16">
        <div className="flex items-center space-x-3 overflow-hidden">
          <Shield className="w-6 h-6 text-accent-lime flex-shrink-0" />
          {!isCollapsed && (
            <span className="font-mono font-bold text-lg tracking-wider text-accent-lime uppercase whitespace-nowrap">
              ThreatMatrix
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-dark-hover rounded transition-colors text-text-secondary hover:text-text-primary hidden md:block"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {filteredItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `
                flex items-center space-x-3 px-3 py-2.5 rounded transition-all duration-150 group relative
                ${isActive
                   ? 'bg-accent-lime/10 text-accent-lime border-l-2 border-accent-lime font-medium'
                   : 'text-text-secondary hover:bg-dark-hover hover:text-text-primary'
                }
              `}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm whitespace-nowrap">
                  {item.name}
                </span>
              )}
              {isCollapsed && (
                <div className="absolute left-20 bg-dark-panel border border-dark-border text-text-primary text-xs px-2 py-1.5 rounded hidden group-hover:block z-50 whitespace-nowrap shadow-lg">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-dark-border text-center overflow-hidden h-14">
        {!isCollapsed ? (
          <div className="flex items-center justify-center space-x-2 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SYSTEM SECURE</span>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mx-auto"></div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
