import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { RoleBadge } from './Badge.jsx';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  UserCheck,
  BarChart3,
  History,
  Settings,
  UserPlus,
  FileText,
  User,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Vote,
  X
} from 'lucide-react';

export default function Sidebar({
  currentPath,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) {
  const { user, logout } = useAuth();

  const getNavItems = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return [
          { path: 'overview', label: 'Overview', icon: LayoutDashboard },
          { path: 'voters', label: 'Voters Directory', icon: Users },
          { path: 'admins', label: 'Admin Management', icon: ShieldAlert },
          { path: 'associates', label: 'Associate Members', icon: UserCheck },
          { path: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { path: 'audit', label: 'Activity Logs', icon: History },
          { path: 'settings', label: 'Portal Settings', icon: Settings },
        ];
      case 'ADMIN':
        return [
          { path: 'overview', label: 'Overview', icon: LayoutDashboard },
          { path: 'associates', label: 'Associate Members', icon: UserCheck },
          { path: 'voters', label: 'Voter Records', icon: Users },
          { path: 'reports', label: 'Reports', icon: BarChart3 },
          { path: 'profile', label: 'My Profile', icon: User },
        ];
      case 'ASSOCIATE_MEMBER':
        return [
          { path: 'overview', label: 'Overview', icon: LayoutDashboard },
          { path: 'register-voter', label: 'Register Voter', icon: UserPlus },
          { path: 'voters', label: 'My Registered Voters', icon: Users },
        ];
      case 'VOTER':
        return [
          { path: 'overview', label: 'My Voter Slip', icon: Vote },
          { path: 'profile', label: 'Update Profile', icon: User },
          { path: 'security', label: 'Change Password', icon: Lock },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none">
      {/* Brand Logo & Title */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white shadow-md">
            <Vote className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-bold text-base tracking-tight text-white block">CivicPulse</span>
              <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider block">Enterprise Portal</span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                if (isMobileOpen) onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* User Info & Logout at bottom */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0 border border-slate-600">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate font-mono">{user?.login_id}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <RoleBadge role={user?.role} />
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs border border-slate-600">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-slate-800"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

