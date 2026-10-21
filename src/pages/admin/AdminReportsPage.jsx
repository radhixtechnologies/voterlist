import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api.js';
import { TableSkeleton } from '../../components/Skeleton.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Download, Users, Vote, CheckCircle2, Award } from 'lucide-react';

export default function AdminReportsPage() {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/stats/dashboard')
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = async () => {
    try {
      const blob = await apiRequest('/api/voters/export/csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Regional_Voter_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Regional voter records downloaded.', 'success');
    } catch (err) {
      addToast('Download failed.', 'error');
    }
  };

  if (loading) {
    return <TableSkeleton rows={4} cols={4} />;
  }

  const { stats, managedAssociates = [] } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Regional Electoral Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Summary metrics and exports for voters enrolled under your supervision</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Regional CSV Report</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Supervised Enrolments</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalVoters ?? 0}</p>
            <span className="text-[11px] text-emerald-600 font-semibold">{stats?.activeVoters ?? 0} active voters</span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Vote className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Supervised Associate Members</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalAssociates ?? 0}</p>
            <span className="text-[11px] text-brand-600 font-semibold">{stats?.activeAssociates ?? 0} currently active in field</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">This Month's Registrations</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.thisMonthRegistrations ?? 0}</p>
            <span className="text-[11px] text-amber-600 font-semibold">{stats?.todayRegistrations ?? 0} processed today</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Associate Member Productivity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Associate Member Enrolment Breakdown</h3>
          <p className="text-xs text-slate-500">Performance rankings by number of verified citizens added</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Associate Member</th>
                <th className="py-3 px-3">Login ID</th>
                <th className="py-3 px-3">Contact Email</th>
                <th className="py-3 px-3">Total Voters Added</th>
                <th className="py-3 px-4 text-right">Team Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {managedAssociates.map((assoc) => {
                const total = stats?.totalVoters || 1;
                const percentage = Math.round(((assoc.voter_count || 0) / total) * 100);
                return (
                  <tr key={assoc.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{assoc.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{assoc.login_id}</td>
                    <td className="py-3 px-3 text-slate-600">{assoc.email}</td>
                    <td className="py-3 px-3 font-bold text-brand-700">{assoc.voter_count} voters</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{percentage}%</span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

