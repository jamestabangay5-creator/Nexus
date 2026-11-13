import React, { useState, useEffect } from 'react';
import { useNexus } from '../../context/NexusContext';
import { AgencyLogo } from './AgencyLogo';
import {
  CheckCircle2,
  X,
  Copy,
  Check,
  Users,
  AlertOctagon,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Building2,
  Lock
} from 'lucide-react';

export const ActionSuccessModal: React.FC = () => {
  const { successModal, closeSuccessModal } = useNexus();
  const [copied, setCopied] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && successModal) {
        closeSuccessModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [successModal, closeSuccessModal]);

  // Auto-dismiss timer if configured
  useEffect(() => {
    if (!successModal) return;
    const timeoutDuration = successModal.autoCloseMs ?? 6000;
    if (timeoutDuration <= 0) return;

    const timer = setTimeout(() => {
      closeSuccessModal();
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [successModal, closeSuccessModal]);

  if (!successModal) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    title,
    message,
    trackingCode,
    agency,
    statusBadge,
    actionType = 'general',
    details,
  } = successModal;

  // Choose accent color theme based on actionType
  const getTheme = () => {
    switch (actionType) {
      case 'resolve':
        return {
          bgGradient: 'from-emerald-500/15 via-teal-500/10 to-transparent',
          iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white',
          glowRing: 'border-emerald-200/80 shadow-emerald-500/20',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25',
          Icon: CheckCircle2,
        };
      case 'reject':
        return {
          bgGradient: 'from-rose-500/15 via-red-500/10 to-transparent',
          iconBg: 'bg-gradient-to-tr from-rose-600 to-red-500 text-white',
          glowRing: 'border-rose-200/80 shadow-rose-500/20',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          btnBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/25',
          Icon: AlertOctagon,
        };
      case 'assistance':
        return {
          bgGradient: 'from-indigo-500/15 via-blue-500/10 to-transparent',
          iconBg: 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white',
          glowRing: 'border-indigo-200/80 shadow-indigo-500/20',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          btnBg: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-600/25',
          Icon: Users,
        };
      case 'restore':
        return {
          bgGradient: 'from-teal-500/15 via-emerald-500/10 to-transparent',
          iconBg: 'bg-gradient-to-tr from-teal-600 to-emerald-500 text-white',
          glowRing: 'border-teal-200/80 shadow-teal-500/20',
          badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
          btnBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-600/25',
          Icon: RotateCcw,
        };
      case 'status':
        return {
          bgGradient: 'from-blue-500/15 via-indigo-500/10 to-transparent',
          iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white',
          glowRing: 'border-blue-200/80 shadow-blue-500/20',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          btnBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25',
          Icon: Clock,
        };
      case 'submit':
        return {
          bgGradient: 'from-blue-500/15 via-emerald-500/10 to-transparent',
          iconBg: 'bg-gradient-to-tr from-blue-600 to-emerald-500 text-white',
          glowRing: 'border-blue-200/80 shadow-blue-500/20',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          btnBg: 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 shadow-blue-600/25',
          Icon: Send,
        };
      case 'save':
      default:
        return {
          bgGradient: 'from-indigo-500/15 via-purple-500/10 to-transparent',
          iconBg: 'bg-gradient-to-tr from-indigo-600 to-purple-500 text-white',
          glowRing: 'border-indigo-200/80 shadow-indigo-500/20',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          btnBg: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-600/25',
          Icon: Sparkles,
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.Icon;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xl animate-in fade-in"
      onClick={closeSuccessModal}
    >
      <div
        className="glass-card bg-white/95 backdrop-blur-2xl border border-white/95 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-slate-800 text-center overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div
          className={`absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br ${theme.bgGradient} rounded-full blur-3xl pointer-events-none`}
        />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-slate-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Agency Seal Watermark Background if agency provided */}
        {agency && (
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.04] select-none transform translate-x-8 translate-y-8">
            <AgencyLogo agency={agency} className="w-64 h-64 object-contain filter grayscale" />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={closeSuccessModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer z-10"
          aria-label="Close message"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Animated Status Icon */}
        <div className="relative mx-auto w-16 h-16 mb-4 flex items-center justify-center">
          <div
            className={`w-16 h-16 rounded-2xl ${theme.iconBg} shadow-xl flex items-center justify-center p-3 animate-in zoom-in duration-300`}
          >
            <IconComponent className="w-9 h-9 stroke-[2.5]" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400/40 animate-ping pointer-events-none opacity-40" />
        </div>

        {/* Main Title & Message */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold mb-4">
          {message}
        </p>

        {/* Information Badges Box */}
        {(trackingCode || statusBadge || agency) && (
          <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3.5 mb-4 space-y-2.5 text-xs sm:text-sm">
            {/* Tracking Code with 1-click Copy */}
            {trackingCode && (
              <div className="flex items-center justify-between gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs uppercase font-bold text-slate-500">Tracking Code:</span>
                  <span className="font-mono font-black text-blue-700 text-sm sm:text-base truncate">
                    {trackingCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(trackingCode)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  title="Copy Tracking Code"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Status & Agency Row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {agency && (
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                  <AgencyLogo agency={agency} className="w-5 h-5 object-contain" />
                  <span>{agency} Dispatch</span>
                </div>
              )}
              {statusBadge && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border ${theme.badgeBg}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>{statusBadge}</span>
                </span>
              )}
            </div>

            {/* Additional Audit or Contextual Details */}
            {details && (
              <p className="text-xs sm:text-sm text-slate-600 border-t border-slate-200/70 pt-2 text-left leading-normal font-medium">
                {details}
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={closeSuccessModal}
            className={`w-full py-3.5 px-5 ${theme.btnBg} text-white text-sm sm:text-base font-black rounded-2xl shadow-lg transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[44px]`}
          >
            <span>Acknowledge & Continue</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

