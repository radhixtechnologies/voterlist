import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api.js';
import StatCard from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { formatDate } from '../../utils/formatters.js';
import { TableSkeleton, CardSkeleton } from '../../components/Skeleton.jsx';
import RegisterVoterModal from '../../components/RegisterVoterModal.jsx';
import VoterCredentialsModal from '../../components/VoterCredentialsModal.jsx';
import VoterDetailsModal from '../../components/VoterDetailsModal.jsx';
import {
  Vote,
  Calendar,
  Clock,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Award
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

export default function AssociateDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registeredVoter, setRegisteredVoter] = useState(null);
  const [credentials, setCredentials] = useState(null);
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

  const handleVoterRegisteredSuccess = (voter, creds) => {
    setShowRegisterModal(false);
    setRegisteredVoter(voter);
    setCredentials(creds);
    fetchDashboard();
  };

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

  const { stats, trendData = [], recentVoters = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Field Enrolment Hub</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">Associate Member Workspace</h2>
          <p className="text-xs text-slate-300 mt-1">
            Fast, secure voter registration with automatic credential generation and duplicate protection
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Voter</span>
        </button>
      </div>

      {/* 4 Associate Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Voters Added"
          value={stats?.totalVoters ?? 0}
          icon={Vote}
          color="blue"
          subtitle="All-time registrations"
        />
        <StatCard
          title="Registrations Today"
          value={stats?.todayRegistrations ?? 0}
          icon={Clock}
          color="amber"
          subtitle="Logged in this calendar day"
        />
        <StatCard
          title="This Month"
          value={stats?.thisMonthRegistrations ?? 0}
          icon={TrendingUp}
          color="indigo"
          subtitle="Current electoral period"
        />
        <StatCard
          title="Active Accounts"
          value={stats?.activeVoters ?? 0}
          icon={ShieldCheck}
          color="emerald"
          subtitle="Verified & in good standing"
        />
      </div>

      {/* Trend Area Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Your Enrolment Activity Trajectory</h3>
            <p className="text-xs text-slate-500">Citizen registrations verified by your account</p>
          </div>
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
            Field Productivity
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAssocTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAssocTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Your Recently Registered Voters</h3>
            <p className="text-xs text-slate-500">Citizens you enrolled with temporary login credentials</p>
          </div>
          <button
            onClick={() => onNavigate('voters')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All My Voters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Voter Name & Login ID</th>
                <th className="py-3 px-3">EPIC / Voter ID</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Ward</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Date Registered</th>
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
                    <p className="text-[11px] text-brand-700 font-mono font-medium">{v.voter_login_id}</p>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                    {v.epic_number}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {v.mobile}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {v.ward}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={v.status} />
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

      <RegisterVoterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleVoterRegisteredSuccess}
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
          fetchDashboard();
          setSelectedVoter(null);
        }}
      />
    </div>
  );
}

