import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { TRANSLATIONS } from '../../constants/translations';
import { ShieldCheck, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAccepted?: () => void;
}

export const TermsAndConditionsModal: React.FC<Props> = ({ isOpen, onClose, onAccepted }) => {
  const { acceptTerms, residentUser, language } = useNexus();
  const t = TRANSLATIONS[language];

  const [hasAgreed, setHasAgreed] = useState(residentUser.termsAccepted);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (hasAgreed) {
      acceptTerms();
      if (onAccepted) onAccepted();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.termsTitle}
              </h3>
              <p className="text-xs text-slate-400">
                Republic Act 10173 (Data Privacy Act) & Emergency Dispatch Terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs text-slate-300 leading-relaxed pr-2">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-sm">
              1. Centralized Emergency Dispatch Authorization
            </h4>
            <p>
              By submitting incident reports through Nexus, you understand and acknowledge that all reports, including initial incident classifications, uploaded photos, and location coordinates, are automatically accessible to all three public safety agencies:
              <strong className="text-blue-400"> Philippine National Police (PNP)</strong>,
              <strong className="text-orange-400"> Bureau of Fire Protection (BFP)</strong>, and
              <strong className="text-emerald-400"> Municipal Disaster Risk Reduction and Management Office (MDRRMO)</strong>
              via a unified municipal emergency database.
            </p>

            <h4 className="font-bold text-white text-sm pt-2">
              2. Initial Classification & Administrator Verification Notice
            </h4>
            <p>
              The incident type you select during reporting is treated as an <em>initial report</em>. Official responders and dispatch administrators retain the authority to verify, reassess, and reclassify the incident category upon on-site verification to ensure accurate triage and dispatch protocols.
            </p>

            <h4 className="font-bold text-white text-sm pt-2">
              3. Protection Against False Reports & Prank Submissions
            </h4>
            <p>
              Submission of malicious, false, or fabricated emergency alarms constitutes a criminal offense under Presidential Decree No. 1727 and Revised Penal Code Article 154 (Unlawful use of means of publication and unlawful utterances). Fictitious reports will be rejected, documented in the Rejected Reports Archive, and referred for investigation.
            </p>

            <h4 className="font-bold text-white text-sm pt-2">
              4. Privacy Notice & Citizen Evidence Protection
            </h4>
            <p>
              Any uploaded photo evidence, phone number, and physical coordinates provided are strictly collected under emergency exigent response standards. Data will not be shared with unauthorized third-party commercial entities and is retained solely for emergency operational history and police blotter archiving.
            </p>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700"
            />
            <span className="font-medium">
              I have read, understood, and accept the Terms and Conditions and Privacy Notice.
            </span>
          </label>

          <button
            onClick={handleConfirm}
            disabled={!hasAgreed}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-900/40 shrink-0"
          >
            {t.acceptTermsBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
