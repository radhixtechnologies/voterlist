import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { Check, Copy, ShieldAlert, KeyRound, User, Printer, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VoterCredentialsModal({ isOpen, onClose, voter, credentials }) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Trigger celebration confetti when opened
  React.useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen || !credentials) return null;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else if (type === 'pass') {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    } else if (type === 'all') {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const fullCredentialSummary = `CivicPulse Voter Registration Successful!\nName: ${voter?.full_name}\nVoter ID / EPIC: ${voter?.epic_number}\nLogin ID: ${credentials?.login_id}\nTemporary Password: ${credentials?.temp_password}\nConstituency: ${voter?.constituency}, Ward: ${voter?.ward}\nPlease login and change your temporary password on your first visit.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Voter Registered Successfully" maxWidth="max-w-lg">
      <div className="space-y-5">
        {/* Success header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Award className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">{voter?.full_name}</h4>
          <p className="text-xs text-slate-500 font-medium">EPIC: {voter?.epic_number} • {voter?.ward}</p>
        </div>

        {/* Security Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Important Security Notice:</strong> These credentials are generated securely and will only be displayed <strong>once</strong>. Share them securely with the voter. The voter will be required to change this temporary password at their first login.
          </div>
        </div>

        {/* Credentials Cards */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          {/* Login ID */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Generated Login ID</span>
              <span className="text-base font-bold text-slate-900 font-mono">{credentials.login_id}</span>
            </div>
            <button
              onClick={() => copyToClipboard(credentials.login_id, 'id')}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              title="Copy Login ID"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Temporary Password */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Temporary Password</span>
              <span className="text-base font-bold text-brand-700 font-mono">{credentials.temp_password}</span>
            </div>
            <button
              onClick={() => copyToClipboard(credentials.temp_password, 'pass')}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              title="Copy Password"
            >
              {copiedPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => copyToClipboard(fullCredentialSummary, 'all')}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAll ? 'Summary Copied!' : 'Copy Full Details'}</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm text-center"
          >
            Done & Return to Directory
          </button>
        </div>
      </div>
    </Modal>
  );
}

