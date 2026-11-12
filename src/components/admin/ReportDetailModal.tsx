import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { IncidentReport, IncidentStatus, IncidentTypeId, Agency } from '../../types';
import { INCIDENT_TYPES, AGENCY_DETAILS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
import { RequestAssistanceModal } from './RequestAssistanceModal';
import {
  X,
  MapPin,
  Calendar,
  User,
  Phone,
  Shield,
  Flame,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive,
  ArrowRight,
  FileText,
  Tag,
  Send,
  Users,
  AlertOctagon,
  History,
  RotateCcw
} from 'lucide-react';

interface Props {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<Props> = ({ reportId, isOpen, onClose }) => {
  const {
    reports,
    activeRole,
    updateIncidentStatus,
    rejectIncidentReport,
    restoreRejectedReport,
    adminProfiles,
    language,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const currentAgency: Agency = activeRole === 'resident' ? 'PNP' : (activeRole as Agency);
  const currentAdmin = adminProfiles[currentAgency];

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);
  const [customActionNote, setCustomActionNote] = useState('');

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !reportId) return null;

  const report = reports.find((r) => r.id === reportId);
  if (!report) return null;

  const typeDef = INCIDENT_TYPES.find(
    (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
  );
  const agencyInfo = AGENCY_DETAILS[report.selectedAgency];

  const handleStatusChange = (status: IncidentStatus, customNote?: string) => {
    updateIncidentStatus(
      report.id,
      status,
      currentAdmin?.name || `${currentAgency} Admin`,
      currentAgency,
      customNote || customActionNote || undefined
    );
    setCustomActionNote('');
  };

  const handleRestoreFromArchive = () => {
    restoreRejectedReport(
      report.id,
      currentAdmin?.name || `${currentAgency} Admin`,
      currentAgency
    );
    onClose();
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    rejectIncidentReport(
      report.id,
      rejectReason.trim(),
      currentAdmin?.name || `${currentAgency} Admin`,
      currentAgency
    );
    setIsRejectOpen(false);
    setRejectReason('');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative text-slate-100 my-8 max-h-[90vh] flex flex-col justify-between">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Content */}
          <div className="overflow-y-auto pr-1 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-400">
                    {report.trackingCode}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block"
                    style={{
                      backgroundColor: `${typeDef?.colorHex}25`,
                      color: typeDef?.colorHex,
                      border: `1px solid ${typeDef?.colorHex}60`,
                    }}
                  >
                    {report.category} — {typeDef?.categoryNameEn}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white mt-1">
                  {language === 'fil' ? typeDef?.fil : typeDef?.en}
                </h2>
                {report.verifiedTypeId && report.verifiedTypeId !== report.initialTypeId && (
                  <p className="text-xs text-amber-300 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                    Verified & Reclassified from initial citizen report
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="self-start sm:self-center">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    report.status === 'Resolved'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : report.status === 'Ongoing'
                      ? 'bg-orange-950 text-orange-400 border-orange-800'
                      : report.status === 'Accepted'
                      ? 'bg-blue-950 text-blue-400 border-blue-800'
                      : report.status === 'Rejected'
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}
                >
                  {t[report.status] || report.status}
                </span>
              </div>
            </div>

            {/* Rejection notice if already rejected */}
            {report.status === 'Rejected' && report.rejection && (
              <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-xl space-y-1.5 text-xs text-rose-200">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Documented Rejection Rationale:</span>
                </div>
                <p className="italic pl-5 text-white">"{report.rejection.reason}"</p>
                <div className="text-[11px] text-slate-400 pl-5 pt-1">
                  Officer: <strong className="text-white">{report.rejection.rejectedByAdmin}</strong> ({report.rejection.agency}) ·{' '}
                  {new Date(report.rejection.rejectedAt).toLocaleString()}
                </div>
              </div>
            )}

            {/* Evidence Image with Resilient Fallback */}
            {report.photoUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <img
                  src={report.photoUrl}
                  alt="Incident evidence"
                  className="w-full max-h-64 object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallbackUrl = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
                    if (target.src !== fallbackUrl) {
                      target.src = fallbackUrl;
                    } else {
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.evidence-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'evidence-fallback flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-400 text-xs h-40';
                        fallback.innerHTML = '<span class="font-bold text-slate-300">Evidence Record Captured</span><span class="text-[10px] text-slate-500 mt-1">Verified Digital Image on File in Central Incident Registry</span>';
                        parent.prepend(fallback);
                      }
                    }
                  }}
                />
                {report.photoCaption && (
                  <div className="p-2 text-xs text-slate-400 bg-slate-950/90 border-t border-slate-800">
                    Evidence Note: {report.photoCaption}
                  </div>
                )}
              </div>
            )}

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Incident Location
                    </span>
                    <strong className="text-white block">{report.barangay}</strong>
                    <span className="text-slate-300">{report.locationDetails}</span>
                    <span className="block font-mono text-[10px] text-slate-500 mt-1">
                      GPS: {report.coordinates.lat.toFixed(5)}, {report.coordinates.lng.toFixed(5)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Occurrence Date & Time
                    </span>
                    <span className="text-slate-200">
                      {new Date(report.dateTime).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Reporting Resident
                    </span>
                    <strong className="text-white block">{report.residentName}</strong>
                    <span className="text-slate-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {report.residentPhone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Selected Agency
                    </span>
                    <span className="text-white font-bold">
                      {report.selectedAgency} ({agencyInfo?.fullNameEn})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Banner (for Resolved Cases) */}
            {report.status === 'Resolved' && (
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/50 rounded-xl text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Case Resolved & Logged in Provincial History</span>
                </div>
                <p className="text-slate-200 pl-6 text-xs leading-relaxed">
                  {report.resolution?.notes || 'Incident successfully cleared and verified resolved.'}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pl-6 pt-1 border-t border-emerald-900/40">
                  <span>
                    Resolved by: <strong className="text-white">{report.resolution?.resolvedByAdmin || 'Command Officer'}</strong> ({report.resolution?.agency || report.selectedAgency})
                  </span>
                  <span>
                    Closed at: <strong className="text-white">{new Date(report.resolution?.resolvedAt || report.updatedAt).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Archived / Rejection Banner (for Rejected Cases) */}
            {report.status === 'Rejected' && (
              <div className="p-3.5 bg-rose-950/30 border border-rose-500/50 rounded-xl text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Case Archived / Discarded</span>
                </div>
                <p className="text-rose-200 pl-6 text-xs font-medium leading-relaxed">
                  "{report.rejection?.reason || 'Case marked as rejected / unverified.'}"
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pl-6 pt-1 border-t border-rose-900/40">
                  <span>
                    Archived by: <strong className="text-white">{report.rejection?.rejectedByAdmin || 'Command Officer'}</strong> ({report.rejection?.agency || report.selectedAgency})
                  </span>
                  <span>
                    Archived at: <strong className="text-white">{new Date(report.rejection?.rejectedAt || report.updatedAt).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Description Narrative */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Resident Narrative / Description:
              </span>
              <p className="text-slate-200 leading-relaxed">{report.description}</p>
            </div>

            {/* Action History / Audit Log Timeline - Requirement 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <History className="w-4 h-4 text-blue-400" />
                <span>{t.auditHistory} (Immutable Audit Log)</span>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 max-h-44 overflow-y-auto space-y-2.5">
                {report.history.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 text-xs pb-2 border-b border-slate-800/60 last:border-0 last:pb-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white">
                          {item.action} — <span className="text-blue-400">{item.adminName}</span> ({item.agency})
                        </span>
                        <span className="font-mono text-slate-500 text-[10px]">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rejection Form Box */}
            {activeRole !== 'resident' && isRejectOpen && (
              <form
                onSubmit={handleConfirmReject}
                className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-xl text-xs space-y-3"
              >
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>Mandatory Rejection Reason (Required for Archiving):</span>
                </div>
                <p className="text-[11px] text-rose-200/80">
                  Rejecting this report will immediately remove it from active dispatch & live map, recording your name ({currentAdmin?.name}), agency ({currentAgency}), date, and time.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State the verifiable reason for rejection (e.g. False alarm / Duplicate / Fictitious address)..."
                  rows={2}
                  required
                  className="w-full bg-slate-950 border border-rose-800/80 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectOpen(false)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow transition"
                  >
                    Confirm Rejection & Archive
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Action Footer for Administrators */}
          {activeRole !== 'resident' && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              {/* CASE 1: Archived / Rejected Report -> Provide Restore Button */}
              {report.status === 'Rejected' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-rose-950/30 border border-rose-900/60 rounded-xl p-3.5">
                  <div className="flex items-start gap-2.5 text-xs text-rose-300">
                    <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-200">Incident Is In Emergency Archive</span>
                      <p className="text-slate-300 text-[11px] mt-0.5 font-medium">
                        "{report.rejection?.reason || 'Case was rejected / marked false alarm.'}"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRestoreFromArchive}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer shrink-0"
                    title="Restore report back to active pending dispatch queue"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore Report to Active Registry</span>
                  </button>
                </div>
              )}

              {/* CASE 2: Resolved Report -> Lock Reject and Request Assistance */}
              {report.status === 'Resolved' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-emerald-950/30 border border-emerald-900/60 rounded-xl p-3.5">
                  <div className="flex items-start gap-2.5 text-xs text-emerald-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-200">Incident Successfully Resolved & Logged in History</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Response is completed. Reject and Assistance requests are disabled for resolved cases.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStatusChange('Ongoing', 'Reopened resolved incident for follow-up verification')}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                    title="Reopen case if further field dispatch is required"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reopen Case (Ongoing)</span>
                  </button>
                </div>
              )}

              {/* CASE 3: Active Ongoing / Pending Cases -> Request Assistance & Reject allowed */}
              {report.status !== 'Rejected' && report.status !== 'Resolved' && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Request Assistance Button */}
                    <button
                      onClick={() => setIsAssistanceModalOpen(true)}
                      className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t.requestAssistance}</span>
                    </button>
                  </div>

                  {/* Status Update Action Pipeline: Accept -> Ongoing -> Resolved / Reject */}
                  <div className="flex items-center gap-2">
                    {report.status === 'Pending Verification' && (
                      <button
                        onClick={() => handleStatusChange('Accepted')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t.accept}</span>
                      </button>
                    )}

                    {(report.status === 'Accepted' || report.status === 'Pending Verification') && (
                      <button
                        onClick={() => handleStatusChange('Ongoing')}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t.setOngoing}</span>
                      </button>
                    )}

                    {report.status === 'Ongoing' && (
                      <button
                        onClick={() => handleStatusChange('Resolved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t.resolve}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsRejectOpen(true)}
                      className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>{t.reject}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inter-Agency Assistance Modal */}
      {isAssistanceModalOpen && (
        <RequestAssistanceModal
          report={report}
          isOpen={isAssistanceModalOpen}
          onClose={() => setIsAssistanceModalOpen(false)}
        />
      )}
    </>
  );
};
