import React, { useState, useMemo } from 'react';
import { useNexus } from '../../context/NexusContext';
import { IncidentReport, IncidentStatus, Agency, IncidentTypeId } from '../../types';
import { INCIDENT_TYPES, BARANGAYS, AGENCY_DETAILS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
import { RequestAssistanceModal } from './RequestAssistanceModal';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertOctagon,
  Users,
  MapPin,
  Calendar,
  Building2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

interface Props {
  onSelectReport: (reportId: string) => void;
}

export const ReportTable: React.FC<Props> = ({ onSelectReport }) => {
  const {
    reports,
    activeRole,
    updateIncidentStatus,
    rejectIncidentReport,
    adminProfiles,
    language,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const currentAgency: Agency = activeRole === 'resident' ? 'PNP' : (activeRole as Agency);
  const currentAdmin = adminProfiles[currentAgency];

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [barangayFilter, setBarangayFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [agencyFilter, setAgencyFilter] = useState('ALL');

  // Quick Assistance Modal
  const [assistanceReport, setAssistanceReport] = useState<IncidentReport | null>(null);

  // Quick Reject Dialog
  const [rejectingReport, setRejectingReport] = useState<IncidentReport | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Requirement 2: Exclude rejected reports from active dashboard
  const activeReports = useMemo(() => {
    return reports.filter((r) => r.status !== 'Rejected');
  }, [reports]);

  const filteredReports = useMemo(() => {
    return activeReports.filter((rep) => {
      if (statusFilter !== 'ALL' && rep.status !== statusFilter) return false;
      if (barangayFilter !== 'ALL' && rep.barangay !== barangayFilter) return false;
      if (categoryFilter !== 'ALL' && rep.category !== categoryFilter) return false;
      if (agencyFilter !== 'ALL' && rep.selectedAgency !== agencyFilter) return false;

      if (search) {
        const query = search.toLowerCase();
        const matchCode = rep.trackingCode.toLowerCase().includes(query);
        const matchDesc = rep.description.toLowerCase().includes(query);
        const matchBrgy = rep.barangay.toLowerCase().includes(query);
        const matchResident = rep.residentName.toLowerCase().includes(query);
        if (!matchCode && !matchDesc && !matchBrgy && !matchResident) return false;
      }

      return true;
    });
  }, [activeReports, statusFilter, barangayFilter, categoryFilter, agencyFilter, search]);

  const handleQuickStatus = (reportId: string, newStatus: IncidentStatus) => {
    updateIncidentStatus(
      reportId,
      newStatus,
      currentAdmin?.name || `${currentAgency} Admin`,
      currentAgency
    );
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReport || !rejectReason.trim()) return;

    rejectIncidentReport(
      rejectingReport.id,
      rejectReason.trim(),
      currentAdmin?.name || `${currentAgency} Admin`,
      currentAgency
    );

    setRejectingReport(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search tracking code, resident, location, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Accepted">Accepted</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Barangay Filter */}
          <select
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Barangays</option>
            {BARANGAYS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="RED">RED — Critical Safety</option>
            <option value="ORANGE">ORANGE — Accidents & Emergencies</option>
            <option value="YELLOW">YELLOW — Suspected Criminal</option>
            <option value="GREEN">GREEN — Community Concerns</option>
            <option value="BLUE">BLUE — Online & Complaints</option>
            <option value="WHITE">WHITE — Other</option>
          </select>

          {/* Selected Agency Filter */}
          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Primary Agencies</option>
            <option value="PNP">PNP Filed</option>
            <option value="BFP">BFP Filed</option>
            <option value="MDRRMO">MDRRMO Filed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{t.trackingCode}</th>
                <th className="py-3 px-4">{t.incidentType}</th>
                <th className="py-3 px-4">{t.location}</th>
                <th className="py-3 px-4">{t.agency}</th>
                <th className="py-3 px-4">{t.dateTime}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No active incident reports match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const typeDef = INCIDENT_TYPES.find(
                    (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
                  );
                  const isPending = report.status === 'Pending Verification';
                  const isAccepted = report.status === 'Accepted';
                  const isOngoing = report.status === 'Ongoing';
                  const isResolved = report.status === 'Resolved';

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => onSelectReport(report.id)}
                    >
                      {/* Tracking Code */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {report.trackingCode}
                      </td>

                      {/* Incident Type & Color Category */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow"
                            style={{ backgroundColor: typeDef?.colorHex }}
                          />
                          <div>
                            <span className="font-semibold text-white block">
                              {language === 'fil' ? typeDef?.fil : typeDef?.en}
                            </span>
                            <span
                              className="text-[9px] font-bold uppercase inline-block px-1 rounded"
                              style={{
                                color: typeDef?.colorHex,
                                backgroundColor: `${typeDef?.colorHex}22`,
                              }}
                            >
                              {report.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200 block">
                          {report.barangay}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block max-w-[180px]">
                          {report.locationDetails}
                        </span>
                      </td>

                      {/* Selected Agency */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-white uppercase text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {report.selectedAgency}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(report.dateTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
                            isResolved
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : isOngoing
                              ? 'bg-orange-950 text-orange-400 border-orange-800'
                              : isAccepted
                              ? 'bg-blue-950 text-blue-400 border-blue-800'
                              : 'bg-amber-950 text-amber-400 border-amber-800'
                          }`}
                        >
                          {t[report.status] || report.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Assistance */}
                          <button
                            onClick={() => setAssistanceReport(report)}
                            title="Request Inter-Agency Assistance"
                            className="p-1.5 text-indigo-400 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 rounded-lg transition"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Accept */}
                          {isPending && (
                            <button
                              onClick={() => handleQuickStatus(report.id, 'Accepted')}
                              title="Accept Report"
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[11px] transition shadow"
                            >
                              {t.accept}
                            </button>
                          )}

                          {/* Quick Ongoing */}
                          {(isAccepted || isPending) && (
                            <button
                              onClick={() => handleQuickStatus(report.id, 'Ongoing')}
                              title="Deploy response (Ongoing)"
                              className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold text-[11px] transition shadow"
                            >
                              {t.setOngoing}
                            </button>
                          )}

                          {/* Quick Resolve */}
                          {isOngoing && (
                            <button
                              onClick={() => handleQuickStatus(report.id, 'Resolved')}
                              title="Mark as Resolved"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] transition shadow"
                            >
                              {t.resolve}
                            </button>
                          )}

                          {/* Quick Reject */}
                          <button
                            onClick={() => {
                              setRejectingReport(report);
                              setRejectReason('');
                            }}
                            title="Reject and Archive Report"
                            className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                          </button>

                          {/* Open Dossier */}
                          <button
                            onClick={() => onSelectReport(report.id)}
                            title="View Full Report"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal with documented justification requirement */}
      {rejectingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-600/60 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <div className="flex items-center gap-3 mb-3 text-rose-400">
              <AlertOctagon className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">
                Reject Incident Report ({rejectingReport.trackingCode})
              </h3>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Per emergency protocol, this report will be moved to the <strong>Rejected Reports Archive</strong> and removed from active dispatch and map. You must document the reason.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Documented Rejection Reason:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Verified false alarm by patrol / Duplicate case / Unverified prank submission..."
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span>Recorded Admin: </span>
                <strong className="text-white">{currentAdmin?.name}</strong> ({currentAgency})
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectingReport(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950 transition"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inter-Agency Assistance Modal */}
      {assistanceReport && (
        <RequestAssistanceModal
          report={assistanceReport}
          isOpen={!!assistanceReport}
          onClose={() => setAssistanceReport(null)}
        />
      )}
    </div>
  );
};
