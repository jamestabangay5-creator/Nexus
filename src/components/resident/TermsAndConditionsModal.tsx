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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (hasAgreed) {
      acceptTerms();
      if (onAccepted) onAccepted();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in">
      <div className="glass-card bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl max-w-2xl w-full p-6 shadow-2xl shadow-slate-300/60 relative text-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Ambient Glow & Legal Shield Watermark Background */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-slate-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-4 bottom-4 pointer-events-none opacity-[0.04] select-none">
          <ShieldCheck className="w-64 h-64 text-blue-900" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {t.termsTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Republic Act 10173 (Data Privacy Act) & Emergency Dispatch Terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs text-slate-600 leading-relaxed pr-2">
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
            <h4 className="font-black text-slate-900 text-sm">
              1. Centralized Emergency Dispatch Authorization
            </h4>
            <p>
              By submitting incident reports through Nexus, you understand and acknowledge that all reports, including initial incident classifications, uploaded photos, and location coordinates, are automatically accessible to all three public safety agencies:
              <strong className="text-blue-700"> Philippine National Police (PNP)</strong>,
              <strong className="text-orange-700"> Bureau of Fire Protection (BFP)</strong>, and
              <strong className="text-emerald-700"> Municipal Disaster Risk Reduction and Management Office (MDRRMO)</strong>
              via a unified municipal emergency database.
            </p>

            <h4 className="font-black text-slate-900 text-sm pt-2">
              2. Initial Classification & Administrator Verification Notice
            </h4>
            <p>
              The incident type you select during reporting is treated as an <em>initial report</em>. Official responders and dispatch administrators retain the authority to verify, reassess, and reclassify the incident category upon on-site verification to ensure accurate triage and dispatch protocols.
            </p>

            <h4 className="font-black text-slate-900 text-sm pt-2">
              3. Protection Against False Reports & Prank Submissions
            </h4>
            <p>
              Submission of malicious, false, or fabricated emergency alarms constitutes a criminal offense under Presidential Decree No. 1727 and Revised Penal Code Article 154 (Unlawful use of means of publication and unlawful utterances). Fictitious reports will be rejected, documented in the Rejected Reports Archive, and referred for investigation.
            </p>

            <h4 className="font-black text-slate-900 text-sm pt-2">
              4. Privacy Notice & Citizen Evidence Protection
            </h4>
            <p>
              Any uploaded photo evidence, phone number, and physical coordinates provided are strictly collected under emergency exigent response standards. Data will not be shared with unauthorized third-party commercial entities and is retained solely for emergency operational history and police blotter archiving.
            </p>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300"
            />
            <span className="font-semibold">
              I have read, understood, and accept the Terms and Conditions and Privacy Notice.
            </span>
          </label>

          <button
            onClick={handleConfirm}
            disabled={!hasAgreed}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 shrink-0 cursor-pointer"
          >
            {t.acceptTermsBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
