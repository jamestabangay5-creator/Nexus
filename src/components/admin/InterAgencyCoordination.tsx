import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { Agency, IncidentReport, AssistanceRequest } from '../../types';
import { AGENCY_DETAILS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {t.coordinationTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.coordinationSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <span className="text-slate-400">Operating As:</span>
          <span className="font-bold text-white flex items-center gap-1.5 uppercase">
            {currentAgency === 'PNP' && <Shield className="w-4 h-4 text-blue-400" />}
            {currentAgency === 'BFP' && <Flame className="w-4 h-4 text-orange-400" />}
            {currentAgency === 'MDRRMO' && <Activity className="w-4 h-4 text-emerald-400" />}
            {currentAgency} Command
          </span>
        </div>
      </div>

      {/* Grid: Incoming and Outgoing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Requests to Current Agency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">
                  Incoming Assistance Dispatches for {currentAgency}
                </h3>
              </div>
              <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-400 font-bold border border-slate-800">
                {incomingRequests.length} Active
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
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
                      className={`p-4 rounded-xl border transition ${
                        isAcknowledgedByMe
                          ? 'bg-slate-950/60 border-slate-800'
                          : 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400">
                            {report.trackingCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              request.urgency === 'Critical'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : request.urgency === 'Urgent'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {request.urgency}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isAcknowledgedByMe
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          }`}
                        >
                          {isAcknowledgedByMe ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {t.acknowledged}
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              {t.pendingAck}
                            </>
                          )}
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 text-slate-300 mb-3">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>
                            From: <strong className="text-white">{request.fromAgency}</strong> ({request.requestedBy})
                          </span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-200">
                          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                            Mutual Aid Note:
                          </span>
                          <p className="text-xs italic">"{request.note}"</p>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Location: {report.barangay}</span>
                          <span>{new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        {onSelectReport && (
                          <button
                            onClick={() => onSelectReport(report.id)}
                            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
                                className="bg-slate-950 border border-slate-700 text-white rounded p-1.5 text-xs"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => setAcknowledgingId(null)}
                                  className="px-2 py-1 text-slate-400 text-xs"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAcknowledge(report.id, request.id)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow transition"
                                >
                                  Confirm & Acknowledge
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAcknowledgingId(request.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.acknowledge}</span>
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-semibold">
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Outgoing Requests Dispatched by {currentAgency}
                </h3>
              </div>
              <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded text-blue-400 font-bold border border-slate-800">
                {outgoingRequests.length} Dispatched
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {outgoingRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {currentAgency} has not dispatched any assistance requests yet. You can request assistance from any incident report card or table row.
                </div>
              ) : (
                outgoingRequests.map(({ report, request }) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl border bg-slate-950/60 border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400">
                            {report.trackingCode}
                          </span>
                          <span className="text-xs text-slate-400">
                            → Requested: <strong className="text-white">{request.targetAgencies.join(' & ')}</strong>
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          request.status === 'Acknowledged'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {request.status === 'Acknowledged' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Acknowledged
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-400" />
                            Pending Response
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      "{request.note}"
                    </p>

                    {/* Acknowledgment history */}
                    <div className="text-[11px] space-y-1 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Agency Acknowledgment Status:
                      </span>
                      {request.targetAgencies.map((agency) => {
                        const ack = request.acknowledgments.find((a) => a.agency === agency);
                        return (
                          <div
                            key={agency}
                            className="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-900/60"
                          >
                            <span className="font-bold text-slate-300">{agency}:</span>
                            {ack ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                {ack.acknowledgedBy} ({new Date(ack.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            ) : (
                              <span className="text-amber-400/90 italic text-[11px]">
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
