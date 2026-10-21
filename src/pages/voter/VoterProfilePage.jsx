import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { StatusBadge } from '../../components/Badge.jsx';
import { formatDate } from '../../utils/formatters.js';
import { User, MapPin, Phone, Save, ShieldCheck } from 'lucide-react';

export default function VoterProfilePage() {
  const { user, voterProfile, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [voter, setVoter] = useState(voterProfile);
  const [address, setAddress] = useState(voterProfile?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(voterProfile?.emergency_contact || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/api/stats/dashboard')
      .then(res => {
        if (res?.voter) {
          setVoter(res.voter);
          setAddress(res.voter.address || '');
          setEmergencyContact(res.voter.emergency_contact || '');
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!voter?.id) return;

    try {
      setSaving(true);
      await apiRequest(`/api/voters/${voter.id}`, {
        method: 'PATCH',
        body: {
          address,
          emergency_contact: emergencyContact
        }
      });
      addToast('Profile details updated successfully.', 'success');
      refreshUser();
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Citizen Profile Particulars</h2>
        <p className="text-xs text-slate-500 mt-0.5">Verified voter information on record with CivicPulse portal</p>
      </div>

      {/* Verified Details Read-Only */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center border border-brand-200">
              {voter?.full_name?.charAt(0) || 'V'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{voter?.full_name}</h3>
              <p className="text-xs text-slate-400 font-mono">Account ID: {voter?.voter_login_id}</p>
            </div>
          </div>
          <StatusBadge status={voter?.status || 'ACTIVE'} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-medium">EPIC / Voter ID</span>
            <p className="font-bold text-brand-700 mt-0.5 font-mono">{voter?.epic_number}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-medium">Constituency</span>
            <p className="font-semibold text-slate-800 mt-0.5">{voter?.constituency}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-medium">Ward</span>
            <p className="font-semibold text-slate-800 mt-0.5">{voter?.ward}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-medium">Registered Mobile</span>
            <p className="font-semibold text-slate-800 mt-0.5 font-mono">{voter?.mobile}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-medium">Enrolled By</span>
            <p className="font-semibold text-slate-800 mt-0.5">{voter?.referred_by_name || 'Associate Member'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-medium">Enrolment Date</span>
            <p className="font-semibold text-slate-800 mt-0.5">{formatDate(voter?.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-600" />
          Update Permitted Information
        </h3>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Emergency Contact</label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="e.g. Next of kin name & contact number"
              className="w-full sm:w-80 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

