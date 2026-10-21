import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api.js';
import { StatusBadge } from '../../components/Badge.jsx';
import { formatDate } from '../../utils/formatters.js';
import { TableSkeleton } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import VoterDetailsModal from '../../components/VoterDetailsModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Users, Search, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function AdminVotersPage() {
  const { addToast } = useToast();
  const [voters, setVoters] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [ward, setWard] = useState('');
  const [page, setPage] = useState(1);
  const [selectedVoter, setSelectedVoter] = useState(null);

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (ward) params.append('ward', ward);
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
  }, [search, status, ward, page]);

  const handleExportCSV = async () => {
    try {
      const blob = await apiRequest('/api/voters/export/csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Voters_Regional_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Regional voter records exported.', 'success');
    } catch (err) {
      addToast('Export failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Regional Voter Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {pagination.total} citizens enrolled under your managed Associate Members
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Scoped CSV</span>
        </button>
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
            placeholder="Search by name, mobile, EPIC..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="sm:col-span-3">
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

        <div className="sm:col-span-3">
          <select
            value={ward}
            onChange={(e) => {
              setWard(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
          >
            <option value="">All Wards</option>
            <option value="Ward 01 - Metro Central">Ward 01 - Metro Central</option>
            <option value="Ward 02 - Metro East">Ward 02 - Metro East</option>
            <option value="Ward 03 - Metro North">Ward 03 - Metro North</option>
            <option value="Ward 04 - Metro South">Ward 04 - Metro South</option>
            <option value="Ward 05 - West Central">Ward 05 - West Central</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : voters.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No voter records found"
            description="Your team has not registered voters matching this search."
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Voter Name & EPIC</th>
                    <th className="py-3.5 px-3">Contact</th>
                    <th className="py-3.5 px-3">Ward & Area</th>
                    <th className="py-3.5 px-3">Registered By</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3">Enrolled</th>
                    <th className="py-3.5 px-4 text-right">View</th>
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
                        <p className="text-[11px] text-slate-400 font-mono">{voter.epic_number}</p>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-medium text-slate-800">
                        {voter.mobile}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-800">{voter.ward}</p>
                        <p className="text-[11px] text-slate-400">{voter.area}</p>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-brand-700">
                        {voter.associate_name}
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
                          title="View Details"
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} voters)
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

