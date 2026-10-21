import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../utils/api.js';
import DigitalVoterCard from '../../components/DigitalVoterCard.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { formatDate } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Vote,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  Lock,
  Phone,
  FileText,
  AlertCircle,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function VoterDashboard({ onNavigate }) {
  const { user, voterProfile, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [voterData, setVoterData] = useState(voterProfile);
  const [loading, setLoading] = useState(!voterProfile);

  // Edit fields permitted for voter
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch latest verified voter profile
    apiRequest('/api/stats/dashboard')
      .then(res => {
        if (res?.voter) {
          setVoterData(res.voter);
          setAddress(res.voter.address || '');
          setEmergencyContact(res.voter.emergency_contact || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!voterData?.id) return;

    try {
      setSaving(true);
      await apiRequest(`/api/voters/${voterData.id}`, {
        method: 'PATCH',
        body: {
          address,
          emergency_contact: emergencyContact
        }
      });
      addToast('Profile updated successfully!', 'success');
      refreshUser();
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Citizen Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-2xl p-6 sm:p-7 shadow-premium relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">Citizen Portal</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            Welcome, {voterData?.full_name || user?.name}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Your official voter registration profile and credentials registered with CivicPulse. You can view your validated Voter Slip, download your official record, or update your residential address.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-white/10 rounded-full font-mono text-slate-200 border border-white/10">
              Account ID: {user?.login_id}
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full font-mono text-slate-200 border border-white/10">
              EPIC: {voterData?.epic_number || 'PENDING'}
            </span>
            <StatusBadge status={voterData?.status || user?.status || 'ACTIVE'} />
          </div>
        </div>
      </div>

      {/* Digital Voter Slip Presentation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-base font-bold text-slate-900">Your Official Digital Voter Slip</h3>
          <p className="text-xs text-slate-500">System-verified citizen credential for local electoral assembly verification</p>
        </div>

        <DigitalVoterCard voter={voterData} />
      </div>

      {/* Permitted Profile Updates */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Permitted Profile Updates</h3>
          <p className="text-xs text-slate-500">Keep your contact and address information up-to-date with electoral staff</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Update residential address if relocated"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Emergency Contact Information</label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="e.g. Spouse / Parent name & phone number"
              className="w-full sm:w-96 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Updated Address'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Quick Link */}
      <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Account Password & Security</h4>
          <p className="text-xs text-slate-500">Protect your voter profile by maintaining a strong, unique password.</p>
        </div>

        <button
          onClick={() => onNavigate('security')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-colors shadow-sm"
        >
          <Lock className="w-3.5 h-3.5 text-brand-600" />
          <span>Change Password</span>
        </button>
      </div>
    </div>
  );
}

