import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api.js';
import StatCard from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { formatDate } from '../../utils/formatters.js';
import { TableSkeleton, CardSkeleton } from '../../components/Skeleton.jsx';
import CreateAssociateModal from '../../components/CreateAssociateModal.jsx';
import VoterDetailsModal from '../../components/VoterDetailsModal.jsx';
import {
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Vote,
  Calendar,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function AdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await apiRequest('/api/stats/dashboard');
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <TableSkeleton rows={4} cols={4} />
        </div>
      </div>
    );
  }

  const { stats, trendData = [], managedAssociates = [], recentVoters = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-2xl p-6 shadow-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">Regional Administration</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">Admin Management Workspace</h2>
          <p className="text-xs text-slate-300 mt-1">
            Managing Field Associate Members and monitoring voter enrolment pipeline
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Associate Member</span>
        </button>
      </div>

      {/* 4 Admin Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Associate Members"
          value={stats?.totalAssociates ?? 0}
          icon={UserCheck}
          color="indigo"
          subtitle="Managed in your division"
        />
        <StatCard
          title="Voters Enrolled"
          value={stats?.totalVoters ?? 0}
          icon={Vote}
          color="blue"
          trend="+8% this wk"
          subtitle="Under your team's scope"
        />
        <StatCard
          title="Active Associates"
          value={stats?.activeAssociates ?? 0}
          icon={ShieldCheck}
          color="emerald"
          subtitle="Operational in field"
        />
        <StatCard
          title="Registrations This Month"
          value={stats?.thisMonthRegistrations ?? 0}
          icon={TrendingUp}
          color="amber"
          subtitle={`${stats?.todayRegistrations ?? 0} registered today`}
        />
      </div>

      {/* Trajectory Area Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Enrolment Trend Under Your Team</h3>
            <p className="text-xs text-slate-500">Daily registrations verified by your managed Associate Members</p>
          </div>
          <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
            Regional Scope
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAdminTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdminTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Managed Associates & Recent Scoped Voters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Managed Associates Table */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Associate Members</h3>
              <p className="text-xs text-slate-500">Field staff reporting to you</p>
            </div>
            <button
              onClick={() => onNavigate('associates')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Associate</th>
                  <th className="py-3 px-3">Voters Added</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {managedAssociates.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{assoc.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{assoc.login_id}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">{assoc.voter_count}</span>
                      <span className="text-[11px] text-slate-400"> citizens</span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={assoc.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono">
                      {formatDate(assoc.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Voters Registered under this Admin */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Scoped Voters</h3>
              <p className="text-xs text-slate-500">Registered by your team members</p>
            </div>
            <button
              onClick={() => onNavigate('voters')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Voter Name</th>
                  <th className="py-3 px-3">Ward</th>
                  <th className="py-3 px-3">Registered By</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentVoters.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVoter(v)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{v.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{v.epic_number}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {v.ward}
                    </td>
                    <td className="py-3 px-3 font-medium text-brand-700">
                      {v.associate_name}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono">
                      {formatDate(v.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateAssociateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchDashboard()}
      />

      <VoterDetailsModal
        isOpen={!!selectedVoter}
        onClose={() => setSelectedVoter(null)}
        voter={selectedVoter}
        onUpdated={() => {
          fetchDashboard();
          setSelectedVoter(null);
        }}
      />
    </div>
  );
}

