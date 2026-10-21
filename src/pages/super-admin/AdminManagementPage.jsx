import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api.js';
import { StatusBadge, RoleBadge } from '../../components/Badge.jsx';
import { formatDate } from '../../utils/formatters.js';
import { TableSkeleton } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import CreateAdminModal from '../../components/CreateAdminModal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ShieldAlert, UserPlus, Search, CheckCircle, Ban, Trash2, Mail, Phone, Users } from 'lucide-react';

export default function AdminManagementPage() {
  const { addToast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Status toggle confirmation
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await apiRequest(`/api/users/admins?${params.toString()}`);
      setAdmins(res.admins || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [search, statusFilter]);

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    try {
      setConfirmLoading(true);
      const newStatus = confirmTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await apiRequest(`/api/users/${confirmTarget.id}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      addToast(`Admin ${confirmTarget.name} status updated to ${newStatus}.`, 'success');
      setConfirmTarget(null);
      fetchAdmins();
    } catch (err) {
      addToast(err.message || 'Failed to update status.', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure regional portal administrators & supervisor access</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New Admin</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : admins.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No administrators found"
            description="Create an admin account to delegate regional associate management."
            actionText="Add Admin"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Admin Name & Login ID</th>
                  <th className="py-3.5 px-3">Contact</th>
                  <th className="py-3.5 px-3">Supervised Team</th>
                  <th className="py-3.5 px-3">Account Status</th>
                  <th className="py-3.5 px-3">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{admin.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{admin.login_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 space-y-0.5">
                      <p className="text-slate-800 font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{admin.email}</span>
                      </p>
                      {admin.mobile && (
                        <p className="text-slate-500 flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{admin.mobile}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Users className="w-3.5 h-3.5 text-brand-600" />
                        <span>{admin.managed_associates_count} Associates</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{admin.total_voters_count} voters enrolled</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={admin.status} />
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 font-mono">
                      {formatDate(admin.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setConfirmTarget(admin)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          admin.status === 'ACTIVE'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {admin.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateAdminModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchAdmins()}
      />

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleToggleStatus}
        isLoading={confirmLoading}
        isDanger={confirmTarget?.status === 'ACTIVE'}
        title={`${confirmTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Admin Account`}
        message={`Are you sure you want to change the account status of ${confirmTarget?.name}? Inactive administrators cannot log in to the portal.`}
        confirmText={confirmTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
}

