import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { apiRequest } from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { User, Phone, MapPin, Calendar, Shield, AlertCircle } from 'lucide-react';

export default function RegisterVoterModal({ isOpen, onClose, onSuccess }) {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Quick client-side validations
    if (!formData.full_name.trim()) {
      setError('Please provide the full name.');
      return;
    }
    const cleanPhone = formData.mobile.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest('/api/voters', {
        method: 'POST',
        body: formData
      });

      addToast(res.message || 'Voter registered successfully!', 'success');
      onSuccess(res.voter, res.credentials);
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
      setError(err.message || 'Failed to register voter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Voter" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

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
                placeholder="e.g. Vikramaditya Rathore"
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
                placeholder="e.g. 9811223344"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* EPIC / Voter ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              EPIC / Voter ID Number <span className="text-slate-400 font-normal">(optional, auto-generated if blank)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="epic_number"
                value={formData.epic_number}
                onChange={handleChange}
                placeholder="e.g. EPIC-ND-992144"
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
              <option value="OTHER">Other / Non-Binary</option>
            </select>
          </div>

          {/* DOB / Age */}
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
                placeholder="Age"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Full Residential Address */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Residential Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House / Flat No., Street, Landmark"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
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
              placeholder="e.g. South Delhi Metro"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
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
              placeholder="e.g. Ward 04 - Metro South"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Area / Locality <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="e.g. Sector 14 Garden"
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

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Creating Account & Registering...' : 'Register Voter & Generate Credentials'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

