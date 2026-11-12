import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { IncidentReport, Agency } from '../../types';
import { AGENCY_DETAILS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
import {
  Users,
  Send,
  X,
  AlertTriangle,
  Building2,
  FileText,
  Shield,
  Flame,
  Activity
} from 'lucide-react';

interface Props {
  report: IncidentReport;
  isOpen: boolean;
  onClose: () => void;
}

export const RequestAssistanceModal: React.FC<Props> = ({ report, isOpen, onClose }) => {
  const { activeRole, sendAssistanceRequest, adminProfiles, language } = useNexus();
  const t = TRANSLATIONS[language];

  const currentAgency: Agency = activeRole === 'resident' ? 'PNP' : (activeRole as Agency);
  const otherAgencies: Agency[] = (['PNP', 'BFP', 'MDRRMO'] as Agency[]).filter(
    (a) => a !== currentAgency
  );

  const [selectedTargetAgencies, setSelectedTargetAgencies] = useState<Agency[]>([otherAgencies[0]]);
  const [urgency, setUrgency] = useState<'Routine' | 'Urgent' | 'Critical'>('Urgent');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleAgency = (ag: Agency) => {
    if (selectedTargetAgencies.includes(ag)) {
      if (selectedTargetAgencies.length > 1) {
        setSelectedTargetAgencies(selectedTargetAgencies.filter((a) => a !== ag));
      }
    } else {
      setSelectedTargetAgencies([...selectedTargetAgencies, ag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTargetAgencies.length === 0) return;

    setIsSubmitting(true);
    const adminName = adminProfiles[currentAgency]?.name || `${currentAgency} Officer`;

    sendAssistanceRequest(
      report.id,
      currentAgency,
      selectedTargetAgencies,
      urgency,
      note || `Mutual aid requested by ${currentAgency} for incident at ${report.barangay}.`,
      adminName
    );

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in">
      <div className="glass-card bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {t.requestAssistance}
            </h3>
            <p className="text-xs text-slate-500">
              Inter-Agency Mutual Aid Dispatch for <span className="text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">{report.trackingCode}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 mb-5 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-500">
            <span>Location:</span>
            <strong className="text-slate-900">{report.barangay}</strong>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Requesting Agency:</span>
            <strong className="text-blue-700 font-bold">{currentAgency} ({adminProfiles[currentAgency]?.name})</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Agencies Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Target Agencies (One or Both):
            </label>
            <div className="grid grid-cols-2 gap-3">
              {otherAgencies.map((agency) => {
                const info = AGENCY_DETAILS[agency];
                const isSelected = selectedTargetAgencies.includes(agency);

                return (
                  <button
                    key={agency}
                    type="button"
                    onClick={() => toggleAgency(agency)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 text-slate-900 shadow-md shadow-blue-500/10'
                        : 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-sm text-slate-900">{agency}</span>
                      {agency === 'PNP' && <Shield className="w-4 h-4 text-blue-600" />}
                      {agency === 'BFP' && <Flame className="w-4 h-4 text-orange-600" />}
                      {agency === 'MDRRMO' && <Activity className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 block line-clamp-1">
                      {info.fullNameEn}
                    </span>
                    <span className={`text-[10px] font-bold mt-2.5 block ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                      {isSelected ? '✓ Selected for Alert' : '+ Click to add'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Urgency Level:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Routine', 'Urgent', 'Critical'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setUrgency(lvl)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    urgency === lvl
                      ? lvl === 'Critical'
                        ? 'bg-red-600 text-white border-red-500 shadow-sm'
                        : lvl === 'Urgent'
                        ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
                        : 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Specific Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason & Field Deployment Instructions:
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Requesting water tanker support / Need trauma medics and stretcher / Requesting crowd control cordon..."
              rows={3}
              required
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedTargetAgencies.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Assistance Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
