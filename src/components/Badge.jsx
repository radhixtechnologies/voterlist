import React from 'react';
import { getRoleBadge, getStatusBadge } from '../utils/formatters.js';

export function RoleBadge({ role }) {
  const badge = getRoleBadge(role);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
      {badge.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const badge = getStatusBadge(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'ACTIVE' ? 'bg-emerald-500' : status === 'FLAGGED' || status === 'SUSPENDED' ? 'bg-rose-500' : 'bg-slate-400'
      }`} />
      {badge.label}
    </span>
  );
}

