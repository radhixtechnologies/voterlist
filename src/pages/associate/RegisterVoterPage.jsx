import React, { useState } from 'react';
import { apiRequest } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import VoterCredentialsModal from '../../components/VoterCredentialsModal.jsx';
import { User, Phone, MapPin, Calendar, Shield, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RegisterVoterPage({ onNavigate }) {
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    epic_number: '',
    dob: '',
    age: '',
    gender: 'MALE',
    address: '',
    state: 'Delhi NCT',
    district: 'South District',
    constituency: 'South Delhi Metro',
    ward: 'Ward 04 - Metro South',
    area: 'Sector 14 Garden',
    emergency_contact: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [registeredVoter, setRegisteredVoter] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = formData.mobile.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile phone number.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest('/api/voters', {
        method: 'POST',
        body: formData
      });

      addToast('Voter registered successfully!', 'success');
      setRegisteredVoter(res.voter);
      setCredentials(res.credentials);

      // Reset form
      setFormData({
        full_name: '',
        mobile: '',
        epic_number: '',
        dob: '',
        age: '',
        gender: 'MALE',
        address: '',
        state: 'Delhi NCT',
        district: 'South District',
        constituency: 'South Delhi Metro',
        ward: 'Ward 04 - Metro South',
        area: 'Sector 14 Garden',
        emergency_contact: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to register voter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Citizen Enrolment Form</h2>
          <p className="text-xs text-slate-500 mt-0.5">Enter validated citizen particulars to generate official credentials</p>
        </div>

        <button
          onClick={() => onNavigate('overview')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Chandra Verma"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number (10 Digits) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  maxLength={10}
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* EPIC Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Voter ID / EPIC Number <span className="text-slate-400 font-normal">(optional, auto-generates if blank)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="epic_number"
                  value={formData.epic_number}
                  onChange={handleChange}
                  placeholder="e.g. EPIC-ND-498210"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono uppercase"
                />
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* DOB & Age */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Years"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Complete Residential Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House / Flat No., Society / Street Name"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Ward */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ward / Polling Division <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            {/* Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Area / Sector <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            {/* Constituency */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Constituency <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                name="constituency"
                value={formData.constituency}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            {/* District & State */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  required
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing Enrolment...' : 'Register Citizen & Generate Passcode'}
            </button>
          </div>
        </form>
      </div>

      <VoterCredentialsModal
        isOpen={!!registeredVoter && !!credentials}
        onClose={() => {
          setRegisteredVoter(null);
          setCredentials(null);
        }}
        voter={registeredVoter}
        credentials={credentials}
      />
    </div>
  );
}

