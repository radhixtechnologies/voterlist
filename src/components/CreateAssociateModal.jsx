import React, { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import { apiRequest } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { User, Mail, Phone, Lock, AlertCircle, Shield } from 'lucide-react';

export default function CreateAssociateModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    login_id: '',
    password: '',
    managed_by_admin_id: ''
  });

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If Super Admin, fetch admins list for assignment
  useEffect(() => {
    if (isOpen && user?.role === 'SUPER_ADMIN') {
      apiRequest('/api/users/admins')
        .then(res => {
          if (res?.admins) setAdmins(res.admins);
        })
        .catch(console.error);
    }
  }, [isOpen, user?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await apiRequest('/api/users/associates', {
        method: 'POST',
        body: formData
      });

      addToast(res.message || 'Associate Member created successfully!', 'success');
      onSuccess(res.associate);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        login_id: '',
        password: '',
        managed_by_admin_id: ''
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create Associate Member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Associate Member" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
          <div className="relative">
            <input
              type="text"
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Meera Krishnan"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
          <div className="relative">
            <input
              type="email"
              required
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="assoc.meera@civicpulse.org"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
          <div className="relative">
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="9800000021"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* If Super Admin, show Admin Assignment */}
        {user?.role === 'SUPER_ADMIN' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Admin (Scope)</label>
            <div className="relative">
              <select
                name="managed_by_admin_id"
                value={formData.managed_by_admin_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="">Directly Under Super Admin</option>
                {admins.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.login_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
          <div className="relative">
            <input
              type="password"
              required
              minLength={6}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter temporary password"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Associate Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

