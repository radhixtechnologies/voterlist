import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Vote, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();

  const [identifier, setIdentifier] = useState('superadmin');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoPresets = [
    {
      role: 'SUPER_ADMIN',
      badge: 'Super Admin',
      identifier: 'superadmin',
      password: 'Password@123',
      desc: 'Full system control, admin management, portal audit & settings'
    },
    {
      role: 'ADMIN',
      badge: 'Admin',
      identifier: 'admin.metro',
      password: 'Password@123',
      desc: 'Scoped team management, associate members & analytics'
    },
    {
      role: 'ASSOCIATE_MEMBER',
      badge: 'Associate Member',
      identifier: 'assoc.rahul',
      password: 'Password@123',
      desc: 'Register voters, view registered voters, export slips'
    },
    {
      role: 'VOTER',
      badge: 'Voter (Active)',
      identifier: 'VOTER10025',
      password: 'Password@123',
      desc: 'View personal voter slip, profile update & digital card'
    },
    {
      role: 'VOTER_TEMP',
      badge: 'Voter (1st Login)',
      identifier: 'VOTER10026',
      password: 'Vote#8921',
      desc: 'Tests mandatory first-time password reset security flow'
    }
  ];

  const handleSelectPreset = (preset) => {
    setIdentifier(preset.identifier);
    setPassword(preset.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Please provide your Login ID / Email and Password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(identifier, password);
      addToast(`Welcome back, ${res.user.name}!`, 'success');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-900/20 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left column: Branding & Demo Quick Access */}
        <div className="lg:col-span-6 text-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/30">
              <Vote className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">CivicPulse</h1>
              <p className="text-xs uppercase font-semibold text-brand-400 tracking-wider">Enterprise Voter Management</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Secure, Role-Based <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-brand-300">
                Electoral Governance
              </span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              A modern, enterprise-grade portal with multi-tiered role authorization for Super Admins, Regional Admins, Associate Field Members, and Citizens.
            </p>
          </div>

          {/* Quick Demo Credentials Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>1-Click Demo Accounts</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoPresets.map((preset) => {
                const isSelected = identifier === preset.identifier;
                return (
                  <button
                    key={preset.identifier}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-950/60 border-brand-500/80 text-white shadow-sm'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{preset.badge}</span>
                        <span className="font-mono text-[10px] text-slate-400">({preset.identifier})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{preset.desc}</p>
                    </div>
                    <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-brand-400 translate-x-1' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Login Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
              <p className="text-xs text-slate-500 mt-1">Enter your credentials or select a demo role from the left</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Login ID / Email / Mobile
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. superadmin or VOTER10025"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 font-medium transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <span className="text-[11px] text-brand-600 hover:underline cursor-pointer" onClick={() => addToast('Please contact your administrator for password reset.', 'info')}>
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 font-medium transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>TLS 1.3 End-to-End Encryption & Audit Logging Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

