import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { RoleBadge } from './Badge.jsx';
import { Menu, Bell, User, LogOut, Shield, Check, RefreshCw } from 'lucide-react';

export default function Navbar({ onOpenMobile, pageTitle, onQuickSwitchRole }) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const demoAccounts = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', identifier: 'superadmin' },
    { role: 'ADMIN', label: 'Admin (Metro)', identifier: 'admin.metro' },
    { role: 'ASSOCIATE_MEMBER', label: 'Associate Member', identifier: 'assoc.rahul' },
    { role: 'VOTER', label: 'Voter (Arjun)', identifier: 'VOTER10025' },
    { role: 'VOTER_NEW', label: 'Voter (1st Login)', identifier: 'VOTER10026' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
            <p className="hidden sm:block text-xs text-slate-500 font-medium">Enterprise Voter Management & Registry Portal</p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Election status pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>2026 Assembly Cycle: OPEN</span>
          </div>

          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleSwitcher(!showRoleSwitcher);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
              title="Test other role dashboards"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">Switch Role</span>
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-premium border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Demo Account
                </div>
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.identifier}
                    onClick={() => {
                      setShowRoleSwitcher(false);
                      onQuickSwitchRole(acc.identifier);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      user?.login_id === acc.identifier ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    <span>{acc.label}</span>
                    {user?.login_id === acc.identifier && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleSwitcher(false);
              }}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-slate-800 block truncate max-w-[120px]">{user?.name}</span>
                <span className="text-[10px] text-slate-500 font-medium block leading-none">{user?.role}</span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-premium border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate font-mono">{user?.login_id}</p>
                  <div className="mt-1.5">
                    <RoleBadge role={user?.role} />
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

