import React from 'react';
import { ShieldCheck, Printer, CheckCircle, MapPin, Phone, User, Calendar, Award } from 'lucide-react';
import { formatDate } from '../utils/formatters.js';

export default function DigitalVoterCard({ voter, onPrint }) {
  if (!voter) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top action bar */}
      <div className="flex justify-end no-print">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print / Download Voter Slip
        </button>
      </div>

      {/* The Printable Digital Card */}
      <div 
        id="printable-voter-card" 
        className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-slate-300 shadow-premium overflow-hidden text-slate-800"
      >
        {/* Card Header with Navy styling */}
        <div className="bg-slate-900 text-white p-5 border-b-4 border-brand-500 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white shadow">
                <Award className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">CivicPulse Portal</p>
                <h2 className="text-lg font-bold tracking-tight text-white">CITIZEN VOTER SLIP</h2>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED RECORD
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">{voter.voter_login_id || voter.login_id}</p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* Avatar & QR representation */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-200 border-2 border-brand-500 flex items-center justify-center text-slate-600 text-2xl font-bold mb-3 shadow-inner">
                {voter.full_name ? voter.full_name.charAt(0).toUpperCase() : 'V'}
              </div>
              <span className="text-xs font-semibold text-slate-700">{voter.gender || 'CITIZEN'}</span>
              <span className="text-[11px] text-slate-500">{voter.age ? `${voter.age} Yrs` : ''}</span>

              {/* QR Code Graphic placeholder */}
              <div className="mt-4 p-2 bg-white rounded border border-slate-300 text-center w-full">
                <div className="font-mono text-[9px] text-slate-400 uppercase tracking-tighter">AUTHENTIC HASH</div>
                <div className="font-mono text-[10px] text-slate-800 font-bold tracking-wider truncate">
                  {voter.epic_number || voter.voter_login_id}
                </div>
              </div>
            </div>

            {/* Voter particulars */}
            <div className="md:col-span-3 space-y-4">
              {/* Highlight Box for EPIC */}
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider">Voter ID / EPIC Number</span>
                  <div className="text-xl font-extrabold text-brand-900 font-mono tracking-wide">
                    {voter.epic_number || 'PENDING'}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-white font-semibold rounded-lg text-brand-700 border border-brand-200">
                  {voter.status || 'ACTIVE'}
                </span>
              </div>

              {/* Grid of info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Full Registered Name</span>
                  <p className="font-bold text-slate-900 text-base">{voter.full_name}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Registered Mobile</span>
                  <p className="font-semibold text-slate-800 font-mono">{voter.mobile}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Constituency</span>
                  <p className="font-semibold text-slate-800">{voter.constituency}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Ward / Polling Area</span>
                  <p className="font-semibold text-slate-800">{voter.ward}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400 font-medium">Registered Address</span>
                  <p className="font-medium text-slate-700 text-xs mt-0.5 leading-relaxed">{voter.address}, {voter.area}, {voter.district}, {voter.state}</p>
                </div>
              </div>

              {/* Attribution */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-500">
                <div>
                  <span className="font-medium text-slate-700">Referred by:</span> {voter.referred_by_name || voter.associate_name || 'Associate Member'}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Registered:</span> {formatDate(voter.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Disclaimer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 leading-tight">
            This card represents a validated voter registration record within the CivicPulse portal. Electoral participation is governed by respective statutory election authority guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}

