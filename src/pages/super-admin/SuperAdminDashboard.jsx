import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api.js';
import StatCard from '../../components/StatCard.jsx';
import { StatusBadge, RoleBadge } from '../../components/Badge.jsx';
import { formatDate, formatDateTime } from '../../utils/formatters.js';
import { TableSkeleton, CardSkeleton } from '../../components/Skeleton.jsx';
import CreateAdminModal from '../../components/CreateAdminModal.jsx';
import CreateAssociateModal from '../../components/CreateAssociateModal.jsx';
import RegisterVoterModal from '../../components/RegisterVoterModal.jsx';
import VoterCredentialsModal from '../../components/VoterCredentialsModal.jsx';
import VoterDetailsModal from '../../components/VoterDetailsModal.jsx';
import {
  Users,
  ShieldAlert,
  UserCheck,
  UserPlus,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function SuperAdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showRegisterVoterModal, setShowRegisterVoterModal] = useState(false);

  // Success credentials modal
  const [registeredVoter, setRegisteredVoter] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [selectedVoter, setSelectedVoter] = useState(null);

  const fetchDashboardData = async () => {
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
    fetchDashboardData();
  }, []);

  const handleVoterRegisteredSuccess = (voter, credentials) => {
    setShowRegisterVoterModal(false);
    setRegisteredVoter(voter);
    setGeneratedCredentials(credentials);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <TableSkeleton rows={4} cols={5} />
        </div>
      </div>
    );
  }

  const { stats, trendData = [], wardBreakdown = [], recentVoters = [], recentAssociates = [], recentActivity = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Quick Actions Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">Governance Portal</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">Super Admin Control Hub</h2>
          <p className="text-xs text-slate-300 mt-1">
            System overview • Active Election: <strong>2026 Metropolitan General Assembly</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowRegisterVoterModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Voter</span>
          </button>
          <button
            onClick={() => setShowAssociateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <UserCheck className="w-4 h-4 text-teal-400" />
            <span>Add Associate</span>
          </button>
          <button
            onClick={() => setShowAdminModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {/* 6 Metric Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Voters"
          value={stats?.totalVoters ?? 0}
          icon={Users}
          color="blue"
          trend="+12% mo"
          subtitle="All registered records"
        />
        <StatCard
          title="Active Voters"
          value={stats?.activeVoters ?? 0}
          icon={ShieldCheck}
          color="emerald"
          subtitle="Verified active"
        />
        <StatCard
          title="Inactive / Flagged"
          value={stats?.inactiveVoters ?? 0}
          icon={Activity}
          color="rose"
          subtitle="Suspended accounts"
        />
        <StatCard
          title="Admins"
          value={stats?.totalAdmins ?? 0}
          icon={ShieldAlert}
          color="purple"
          subtitle="Regional administrators"
        />
        <StatCard
          title="Associate Members"
          value={stats?.totalAssociates ?? 0}
          icon={UserCheck}
          color="indigo"
          subtitle="Field registration staff"
        />
        <StatCard
          title="This Month"
          value={stats?.thisMonthRegistrations ?? 0}
          icon={TrendingUp}
          color="amber"
          subtitle="New voter enrolments"
        />
      </div>

      {/* Charts Section: Registration Trend & Ward Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Voter Registration Trajectory</h3>
              <p className="text-xs text-slate-500">Daily voter enrolments over the past 14 days</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
              Live Aggregate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown by Ward */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Distribution by Polling Ward</h3>
              <p className="text-xs text-slate-500">Highest registration volume divisions</p>
            </div>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="ward" type="category" width={110} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {wardBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Voters & Recent Administrative Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Voter Registrations */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Voter Enrolments</h3>
              <p className="text-xs text-slate-500">Latest registrations processed across all wards</p>
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
              <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Voter Name & ID</th>
                  <th className="py-3 px-3">Ward / Area</th>
                  <th className="py-3 px-3">Referred By</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentVoters.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVoter(v)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{v.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{v.epic_number} • {v.voter_login_id}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-800">{v.ward}</p>
                      <p className="text-[11px] text-slate-400">{v.area}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-brand-700">
                      {v.associate_name || 'Associate Member'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono">
                      {formatDate(v.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity / Audit Log feed */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Audit Activity</h3>
              <p className="text-xs text-slate-500">Live operational & security trace</p>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Audit Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {recentActivity.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(log.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={log.user_role} />
                  <span className="text-slate-600 truncate">{log.user_name}</span>
                </div>
                {log.details && (
                  <p className="text-[11px] text-slate-500 font-mono truncate">{log.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateAdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <CreateAssociateModal
        isOpen={showAssociateModal}
        onClose={() => setShowAssociateModal(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <RegisterVoterModal
        isOpen={showRegisterVoterModal}
        onClose={() => setShowRegisterVoterModal(false)}
        onSuccess={handleVoterRegisteredSuccess}
      />

      <VoterCredentialsModal
        isOpen={!!registeredVoter && !!generatedCredentials}
        onClose={() => {
          setRegisteredVoter(null);
          setGeneratedCredentials(null);
        }}
        voter={registeredVoter}
        credentials={generatedCredentials}
      />

      <VoterDetailsModal
        isOpen={!!selectedVoter}
        onClose={() => setSelectedVoter(null)}
        voter={selectedVoter}
        onUpdated={() => {
          fetchDashboardData();
          setSelectedVoter(null);
        }}
      />
    </div>
  );
}

