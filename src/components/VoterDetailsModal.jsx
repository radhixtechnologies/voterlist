import React, { useState } from 'react';
import Modal from './Modal.jsx';
import DigitalVoterCard from './DigitalVoterCard.jsx';
import { StatusBadge } from './Badge.jsx';
import { formatDate, formatDateTime } from '../utils/formatters.js';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { User, Phone, MapPin, Calendar, Award, Shield, Check, Edit2 } from 'lucide-react';

export default function VoterDetailsModal({ isOpen, onClose, voter, onUpdated }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'card' | 'edit'
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (voter) {
      setEditForm({
        full_name: voter.full_name || '',
        mobile: voter.mobile || '',
        address: voter.address || '',
        ward: voter.ward || '',
        area: voter.area || '',
        constituency: voter.constituency || '',
        emergency_contact: voter.emergency_contact || '',
        status: voter.status || 'ACTIVE'
      });
      setActiveTab('details');
    }
  }, [voter]);

  if (!isOpen || !voter) return null;

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiRequest(`/api/voters/${voter.id}`, {
        method: 'PATCH',
        body: editForm
      });
      addToast('Voter record updated successfully.', 'success');
      if (onUpdated) onUpdated();
      setActiveTab('details');
    } catch (err) {
      addToast(err.message || 'Failed to update voter.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await apiRequest(`/api/voters/${voter.id}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      addToast(`Voter status updated to ${newStatus}.`, 'success');
      if (onUpdated) onUpdated();
    } catch (err) {
      addToast(err.message || 'Failed to change status.', 'error');
    }
  };

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ASSOCIATE_MEMBER' || user?.role === 'ADMIN';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Voter Profile & Verification" maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Voter Particulars
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'card'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Digital Voter Card
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab('edit')}
              className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'edit'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Record
            </button>
          )}
        </div>

        {/* Tab 1: Particulars */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Header snippet */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">
                  {voter.full_name?.charAt(0) || 'V'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{voter.full_name}</h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Login ID: <strong className="text-slate-800">{voter.voter_login_id}</strong> • EPIC: <strong className="text-brand-700">{voter.epic_number}</strong>
                  </p>
                </div>
              </div>
              <StatusBadge status={voter.status} />
            </div>

            {/* Quick Status actions for Admin/Super Admin */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-600">Quick Status Management:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={voter.status === 'ACTIVE'}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40"
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => handleStatusChange('INACTIVE')}
                    disabled={voter.status === 'INACTIVE'}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 disabled:opacity-40"
                  >
                    Set Inactive
                  </button>
                  <button
                    onClick={() => handleStatusChange('FLAGGED')}
                    disabled={voter.status === 'FLAGGED'}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-40"
                  >
                    Flag / Suspend
                  </button>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Mobile Number</span>
                <p className="font-semibold text-slate-800 mt-0.5 font-mono">{voter.mobile}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Gender & Age</span>
                <p className="font-semibold text-slate-800 mt-0.5">{voter.gender || '—'} {voter.age ? `(${voter.age} yrs)` : ''}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Date of Birth</span>
                <p className="font-semibold text-slate-800 mt-0.5">{formatDate(voter.dob)}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Constituency</span>
                <p className="font-semibold text-slate-800 mt-0.5">{voter.constituency}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Ward</span>
                <p className="font-semibold text-slate-800 mt-0.5">{voter.ward}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Area / Locality</span>
                <p className="font-semibold text-slate-800 mt-0.5">{voter.area}</p>
              </div>

              <div className="col-span-2 sm:col-span-3 p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Complete Address</span>
                <p className="font-semibold text-slate-800 mt-0.5">{voter.address}, {voter.district}, {voter.state}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Referred By</span>
                <p className="font-semibold text-brand-700 mt-0.5">{voter.associate_name || 'Associate Member'}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Registration Date</span>
                <p className="font-semibold text-slate-800 mt-0.5">{formatDate(voter.created_at)}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-medium">Last Record Update</span>
                <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(voter.updated_at)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Digital Voter Card */}
        {activeTab === 'card' && (
          <div className="p-2">
            <DigitalVoterCard voter={voter} />
          </div>
        )}

        {/* Tab 3: Edit Record */}
        {activeTab === 'edit' && canEdit && (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={editForm.mobile}
                  onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ward</label>
                <input
                  type="text"
                  required
                  value={editForm.ward}
                  onChange={(e) => setEditForm(prev => ({ ...prev, ward: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Area</label>
                <input
                  type="text"
                  required
                  value={editForm.area}
                  onChange={(e) => setEditForm(prev => ({ ...prev, area: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Constituency</label>
                <input
                  type="text"
                  required
                  value={editForm.constituency}
                  onChange={(e) => setEditForm(prev => ({ ...prev, constituency: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={editForm.emergency_contact}
                  onChange={(e) => setEditForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  placeholder="Relative name & phone"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="px-3 py-2 text-xs font-semibold rounded-lg border bg-white text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

