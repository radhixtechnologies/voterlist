import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Settings, Save, ShieldCheck, Mail, Phone, Flag, HelpCircle } from 'lucide-react';

export default function SettingsPage() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    portal_name: 'CivicPulse Enterprise Voter Portal',
    election_title: '2026 Metropolitan General Assembly Election',
    require_epic: 'true',
    allow_voter_self_edit: 'true',
    support_email: 'support@civicpulse.org',
    support_phone: '+91 1800 233 4567',
    registration_status: 'OPEN'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/api/settings')
      .then(res => {
        if (res && res.settings) {
          const mapped = {};
          res.settings.forEach(s => {
            mapped[s.key] = s.value;
          });
          setSettings(prev => ({ ...prev, ...mapped }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: { settings }
      });
      addToast('Portal settings updated successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Portal Configuration & Governance</h2>
        <p className="text-xs text-slate-500 mt-0.5">Global policies, active electoral session parameters and contact channels</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Identity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-600" />
            General Branding & Session
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Public Portal Title</label>
              <input
                type="text"
                value={settings.portal_name}
                onChange={(e) => handleChange('portal_name', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Active Election Cycle Title</label>
              <input
                type="text"
                value={settings.election_title}
                onChange={(e) => handleChange('election_title', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Registration Status</label>
              <select
                value={settings.registration_status}
                onChange={(e) => handleChange('registration_status', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-800"
              >
                <option value="OPEN">OPEN (Accepting New Registrations)</option>
                <option value="CLOSED">CLOSED (Electoral Roll Finalized)</option>
                <option value="MAINTENANCE">MAINTENANCE (Read Only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Validation Policies */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Registration & Verification Policies
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_epic === 'true'}
                onChange={(e) => handleChange('require_epic', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Mandate Official EPIC / Voter ID Format</span>
                <span className="text-slate-500 block text-[11px]">Enforce unique statutory EPIC number on all new citizen enrolments</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allow_voter_self_edit === 'true'}
                onChange={(e) => handleChange('allow_voter_self_edit', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Allow Citizen Profile Updates</span>
                <span className="text-slate-500 block text-[11px]">Permit authenticated voters to update mobile number, address, and emergency contact details</span>
              </div>
            </label>
          </div>
        </div>

        {/* Support Helpdesk */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            Public Helpdesk Contact Channels
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Helpdesk Email Address</label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Toll-Free Helpline Phone</label>
              <input
                type="text"
                value={settings.support_phone}
                onChange={(e) => handleChange('support_phone', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

