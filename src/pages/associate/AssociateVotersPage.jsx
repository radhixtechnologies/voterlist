import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api.js';
import { StatusBadge } from '../../components/Badge.jsx';
import { formatDate } from '../../utils/formatters.js';
import { TableSkeleton } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import VoterDetailsModal from '../../components/VoterDetailsModal.jsx';
import RegisterVoterModal from '../../components/RegisterVoterModal.jsx';
import VoterCredentialsModal from '../../components/VoterCredentialsModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Vote, Search, Download, UserPlus, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function AssociateVotersPage() {
  const { addToast } = useToast();
  const [voters, setVoters] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registeredVoter, setRegisteredVoter] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [selectedVoter, setSelectedVoter] = useState(null);

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      params.append('page', page);
      params.append('limit', 10);

      const res = await apiRequest(`/api/voters?${params.toString()}`);
      setVoters(res.voters || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, [search, status, page]);

  const handleExportCSV = async () => {
    try {
      const blob = await apiRequest('/api/voters/export/csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `My_Registered_Voters_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Your registered voters exported to CSV.', 'success');
    } catch (err) {
      addToast('Export failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Registered Voters</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {pagination.total} citizens enrolled directly by your account
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Voter</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, mobile, EPIC, or Login ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="FLAGGED">Flagged</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : voters.length === 0 ? (
          <EmptyState
            icon={Vote}
            title="No registered voters found"
            description="You have not enrolled any citizens matching the search criteria."
            actionText="Register Citizen Now"
            onAction={() => setShowRegisterModal(true)}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Citizen Name & Login ID</th>
                    <th className="py-3.5 px-3">EPIC / Voter ID</th>
                    <th className="py-3.5 px-3">Mobile</th>
                    <th className="py-3.5 px-3">Ward / Area</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3">Registration Date</th>
                    <th className="py-3.5 px-4 text-right">View Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {voters.map((voter) => (
                    <tr
                      key={voter.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedVoter(voter)}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{voter.full_name}</p>
                        <p className="text-[11px] text-brand-700 font-mono font-medium">{voter.voter_login_id}</p>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">
                        {voter.epic_number}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        {voter.mobile}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-800">{voter.ward}</p>
                        <p className="text-[11px] text-slate-400">{voter.area}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={voter.status} />
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono">
                        {formatDate(voter.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedVoter(voter)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Digital Slip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} citizens)
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

      <RegisterVoterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={(newVoter, newCreds) => {
          setShowRegisterModal(false);
          setRegisteredVoter(newVoter);
          setCredentials(newCreds);
          fetchVoters();
        }}
      />

      <VoterCredentialsModal
        isOpen={!!registeredVoter && !!credentials}
        onClose={() => {
          setRegisteredVoter(null);
          setCredentials(null);
        }}
        voter={registeredVoter}
        credentials={credentials}
      />

      <VoterDetailsModal
        isOpen={!!selectedVoter}
        onClose={() => setSelectedVoter(null)}
        voter={selectedVoter}
        onUpdated={() => {
          fetchVoters();
          setSelectedVoter(null);
        }}
      />
    </div>
  );
}

