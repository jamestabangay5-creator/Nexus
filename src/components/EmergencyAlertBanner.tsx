import React from 'react';
import { useNexus } from '../context/NexusContext';
import { INCIDENT_TYPES, AGENCY_DETAILS } from '../constants/incidentData';
import { TRANSLATIONS } from '../constants/translations';
import { AlertTriangle, MapPin, Clock, Building2, X, ChevronRight, Volume2 } from 'lucide-react';

interface Props {
  onSelectReport?: (reportId: string) => void;
}

export const EmergencyAlertBanner: React.FC<Props> = ({ onSelectReport }) => {
  const { incomingAlert, clearIncomingAlert, language, triggerEmergencySound } = useNexus();
  const t = TRANSLATIONS[language];

  if (!incomingAlert) return null;

  const { report, timestamp } = incomingAlert;
  const typeDef = INCIDENT_TYPES.find(
    (item) => item.id === (report.verifiedTypeId || report.initialTypeId)
  );
  const typeName = language === 'fil' ? typeDef?.fil : typeDef?.en;
  const agencyInfo = AGENCY_DETAILS[report.selectedAgency];

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="relative z-50 bg-gradient-to-r from-red-950 via-red-900 to-rose-950 border-b-2 border-red-500 shadow-2xl text-white animate-pulse-glow">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Flashing badge & Header */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-red-400 opacity-75"></span>
              <div className="relative inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-600 border border-red-300 shadow-lg">
                <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-black uppercase tracking-widest bg-red-600 text-white rounded border border-red-400/80 shadow">
                  🚨 {language === 'fil' ? 'BAGONG ULAT NG EMERHENSIYA' : 'NEW INCOMING EMERGENCY REPORT'}
                </span>
                <span className="text-xs font-mono text-red-200 bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                  {report.trackingCode}
                </span>
              </div>
              <h4 className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5">
                <span>{typeName}</span>
                <span className="text-red-300 text-xs font-normal">
                  ({typeDef?.category} - {typeDef?.categoryNameEn})
                </span>
              </h4>
            </div>
          </div>

          {/* Details Row: Location, Time, Agency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs text-red-100 bg-red-950/60 p-2 sm:px-3 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {t.location}
                </span>
                <span className="font-medium text-white truncate block max-w-[150px]">
                  {report.barangay}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {t.dateTime}
                </span>
                <span className="font-mono text-amber-200">{formattedTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {t.agency}
                </span>
                <span className="font-bold text-white uppercase">{agencyInfo?.name || report.selectedAgency}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={triggerEmergencySound}
              title="Re-play audio siren alert"
              className="px-2.5 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-200 rounded text-xs flex items-center gap-1 border border-red-700 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Re-Sound</span>
            </button>

            {onSelectReport && (
              <button
                onClick={() => {
                  onSelectReport(report.id);
                  clearIncomingAlert();
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold flex items-center gap-1 shadow-md hover:shadow-red-500/50 transition cursor-pointer"
              >
                <span>{t.viewDetails}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={clearIncomingAlert}
              className="p-1.5 text-red-300 hover:text-white hover:bg-red-800/80 rounded transition"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
