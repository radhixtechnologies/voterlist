import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api.js';
import { RoleBadge } from '../../components/Badge.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { TableSkeleton } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { History, Search, Filter, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [action, setAction] = useState('');
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (action) params.append('action', action);
      if (role) params.append('role', role);
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', 15);

      const res = await apiRequest(`/api/audit?${params.toString()}`);
      setLogs(res.logs || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [action, role, search, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Audit & Compliance Logs</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable event stream capturing administrative actions, registrations, status changes, and logins
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-6 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by user name, target ID, details..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="sm:col-span-3">
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE_VOTER">CREATE_VOTER</option>
            <option value="UPDATE_VOTER">UPDATE_VOTER</option>
            <option value="TOGGLE_STATUS">TOGGLE_STATUS</option>
            <option value="CREATE_ADMIN">CREATE_ADMIN</option>
            <option value="CREATE_ASSOCIATE_MEMBER">CREATE_ASSOCIATE_MEMBER</option>
            <option value="CHANGE_PASSWORD">CHANGE_PASSWORD</option>
            <option value="UPDATE_SETTINGS">UPDATE_SETTINGS</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
          >
            <option value="">All Operator Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="ASSOCIATE_MEMBER">Associate Member</option>
            <option value="VOTER">Voter</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit events found"
            description="No logged operational events match the current filter parameters."
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Actor / Role</th>
                    <th className="py-3 px-3">Action Event</th>
                    <th className="py-3 px-3">Target Entity</th>
                    <th className="py-3 px-4">Event Details & Metadata</th>
                    <th className="py-3 px-3 text-right">Origin IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{log.user_name || 'System'}</p>
                        <div className="mt-0.5">
                          <RoleBadge role={log.user_role} />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {log.target_type && (
                          <span className="font-semibold text-slate-800">{log.target_type}: </span>
                        )}
                        {log.target_id || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                        {log.details || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} audit events)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

