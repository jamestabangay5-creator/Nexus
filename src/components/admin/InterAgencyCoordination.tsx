import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { Agency, IncidentReport, AssistanceRequest } from '../../types';
import { AGENCY_DETAILS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
import { AgencyLogo } from '../common/AgencyLogo';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Shield,
  Flame,
  Activity,
  ArrowRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface Props {
  onSelectReport?: (reportId: string) => void;
}

export const InterAgencyCoordination: React.FC<Props> = ({ onSelectReport }) => {
  const {
    reports,
    activeRole,
    acknowledgeAssistanceRequest,
    adminProfiles,
    language,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const currentAgency: Agency = activeRole === 'resident' ? 'PNP' : (activeRole as Agency);
  const currentAdmin = adminProfiles[currentAgency];

  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [ackNote, setAckNote] = useState('');

  // Collect all assistance requests across all reports in centralized database
  const allRequests: { report: IncidentReport; request: AssistanceRequest }[] = [];
  reports.forEach((report) => {
    report.assistanceRequests.forEach((request) => {
      allRequests.push({ report, request });
    });
  });

  // Filter incoming requests targeting current agency
  const incomingRequests = allRequests.filter(({ request }) =>
    request.targetAgencies.includes(currentAgency)
  );

  // Filter outgoing requests originated by current agency
  const outgoingRequests = allRequests.filter(
    ({ request }) => request.fromAgency === currentAgency
  );

  const handleAcknowledge = (reportId: string, requestId: string) => {
    acknowledgeAssistanceRequest(
      reportId,
      requestId,
      currentAgency,
      currentAdmin?.name || `${currentAgency} Admin`,
      ackNote || `${currentAgency} responder unit dispatched to scene.`
    );
    setAcknowledgingId(null);
    setAckNote('');
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Header Banner */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-2xl shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.coordinationTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.coordinationSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80">
          <span className="text-slate-500 font-medium">Operating As:</span>
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
            <AgencyLogo agency={currentAgency} className="w-4 h-4 object-contain" />
            {currentAgency} Command
          </span>
        </div>
      </div>

      {/* Grid: Incoming and Outgoing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Requests to Current Agency */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900">
                  Incoming Assistance Dispatches for {currentAgency}
                </h3>
              </div>
              <span className="text-xs font-mono bg-amber-50 px-2.5 py-0.5 rounded-lg text-amber-700 font-bold border border-amber-200">
                {incomingRequests.length} Active
              </span>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No incoming assistance requests directed to {currentAgency} at this time.
                </div>
              ) : (
                incomingRequests.map(({ report, request }) => {
                  const isAcknowledgedByMe = request.acknowledgments.some(
                    (a) => a.agency === currentAgency
                  );

                  return (
                    <div
                      key={request.id}
                      className={`p-4 rounded-2xl border transition ${
                        isAcknowledgedByMe
                          ? 'bg-slate-50/80 border-slate-200/80'
                          : 'bg-amber-50/90 border-amber-300 shadow-md shadow-amber-500/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                            {report.trackingCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              request.urgency === 'Critical'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : request.urgency === 'Urgent'
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {request.urgency}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isAcknowledgedByMe
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          }`}
                        >
                          {isAcknowledgedByMe ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {t.acknowledged}
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              {t.pendingAck}
                            </>
                          )}
                        </span>
                      </div>

                      <div className="text-xs space-y-2 text-slate-700 mb-3">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            From: <strong className="text-slate-900">{request.fromAgency}</strong> ({request.requestedBy})
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-slate-800">
                          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">
                            Mutual Aid Note:
                          </span>
                          <p className="text-xs italic font-medium">"{request.note}"</p>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
                          <span>Location: {report.barangay}</span>
                          <span>{new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                        {onSelectReport && (
                          <button
                            onClick={() => onSelectReport(report.id)}
                            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect Incident Dossier</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}

                        {!isAcknowledgedByMe ? (
                          acknowledgingId === request.id ? (
                            <div className="flex flex-col gap-2 w-full mt-2">
                              <input
                                type="text"
                                placeholder="Response note (e.g. Unit 3 en route)..."
                                value={ackNote}
                                onChange={(e) => setAckNote(e.target.value)}
                                className="bg-white border border-slate-300 text-slate-900 rounded-xl p-2 text-xs focus:ring-2 focus:ring-blue-500/20"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setAcknowledgingId(null)}
                                  className="px-3 py-1.5 text-slate-500 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAcknowledge(report.id, request.id)}
                                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                                >
                                  Confirm & Acknowledge
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAcknowledgingId(request.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.acknowledge}</span>
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold">
                            ✓ Confirmed by {currentAdmin?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Outgoing Requests Sent by Current Agency */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Outgoing Requests Dispatched by {currentAgency}
                </h3>
              </div>
              <span className="text-xs font-mono bg-blue-50 px-2.5 py-0.5 rounded-lg text-blue-700 font-bold border border-blue-200">
                {outgoingRequests.length} Dispatched
              </span>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {outgoingRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {currentAgency} has not dispatched any assistance requests yet. You can request assistance from any incident report card or table row.
                </div>
              ) : (
                outgoingRequests.map(({ report, request }) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-2xl border bg-slate-50/80 border-slate-200/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                            {report.trackingCode}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            → Requested: <strong className="text-slate-900">{request.targetAgencies.join(' & ')}</strong>
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          request.status === 'Acknowledged'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {request.status === 'Acknowledged' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Acknowledged
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Response
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 italic font-medium">
                      "{request.note}"
                    </p>

                    {/* Acknowledgment history */}
                    <div className="text-[11px] space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Agency Acknowledgment Status:
                      </span>
                      {request.targetAgencies.map((agency) => {
                        const ack = request.acknowledgments.find((a) => a.agency === agency);
                        return (
                          <div
                            key={agency}
                            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/60"
                          >
                            <span className="font-bold text-slate-800">{agency}:</span>
                            {ack ? (
                              <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {ack.acknowledgedBy} ({new Date(ack.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            ) : (
                              <span className="text-amber-600 italic text-[11px] font-medium">
                                Awaiting response...
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
