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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {t.requestAssistance}
            </h3>
            <p className="text-xs text-slate-400">
              Inter-Agency Mutual Aid Dispatch for <span className="text-blue-400 font-mono font-bold">{report.trackingCode}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-xs space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Location:</span>
            <strong className="text-slate-200">{report.barangay}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Requesting Agency:</span>
            <strong className="text-blue-400">{currentAgency} ({adminProfiles[currentAgency]?.name})</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Agencies Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
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
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/70 border-blue-500 text-white shadow-lg shadow-blue-950/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{agency}</span>
                      {agency === 'PNP' && <Shield className="w-4 h-4 text-blue-400" />}
                      {agency === 'BFP' && <Flame className="w-4 h-4 text-orange-400" />}
                      {agency === 'MDRRMO' && <Activity className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block line-clamp-1">
                      {info.fullNameEn}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-400 mt-2 block">
                      {isSelected ? '✓ Selected for Alert' : '+ Click to add'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Urgency Level:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Routine', 'Urgent', 'Critical'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setUrgency(lvl)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    urgency === lvl
                      ? lvl === 'Critical'
                        ? 'bg-red-600 text-white border-red-400 shadow-md'
                        : lvl === 'Urgent'
                        ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                        : 'bg-blue-600 text-white border-blue-400 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Specific Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Reason & Field Deployment Instructions:
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Requesting water tanker support / Need trauma medics and stretcher / Requesting crowd control cordon..."
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedTargetAgencies.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 disabled:opacity-50 transition cursor-pointer"
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
