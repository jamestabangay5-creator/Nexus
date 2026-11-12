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
    portalMode,
    isAgencyAuthenticated,
    agencyUser,
    updateIncidentStatus,
    rejectIncidentReport,
    restoreRejectedReport,
    adminProfiles,
    language,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const isAgencyAdmin =
    portalMode === 'agency' &&
    activeRole !== 'resident' &&
    (isAgencyAuthenticated || agencyUser !== null);
  const currentAgency: Agency =
    isAgencyAdmin && (activeRole === 'PNP' || activeRole === 'BFP' || activeRole === 'MDRRMO')
      ? activeRole
      : 'PNP';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xl overflow-y-auto animate-in fade-in">
        <div className="glass-card bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative text-slate-800 my-8 max-h-[90vh] flex flex-col justify-between">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Content */}
          <div className="overflow-y-auto pr-1 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg">
                    {report.trackingCode}
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase inline-block"
                    style={{
                      backgroundColor: `${typeDef?.colorHex}18`,
                      color: typeDef?.colorHex,
                      border: `1px solid ${typeDef?.colorHex}40`,
                    }}
                  >
                    {report.category} — {typeDef?.categoryNameEn}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                  {language === 'fil' ? typeDef?.fil : typeDef?.en}
                </h2>
                {report.verifiedTypeId && report.verifiedTypeId !== report.initialTypeId && (
                  <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 w-fit">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                    Verified & Reclassified from initial citizen report
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="self-start sm:self-center">
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${
                    report.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : report.status === 'Ongoing'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : report.status === 'Accepted'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : report.status === 'Rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {t[report.status] || report.status}
                </span>
              </div>
            </div>

            {/* Rejection notice if already rejected */}
            {report.status === 'Rejected' && report.rejection && (
              <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl space-y-1.5 text-xs text-rose-900">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Documented Rejection Rationale:</span>
                </div>
                <p className="italic pl-5 text-rose-950 font-medium">"{report.rejection.reason}"</p>
                <div className="text-[11px] text-slate-500 pl-5 pt-1">
                  Officer: <strong className="text-slate-800">{report.rejection.rejectedByAdmin}</strong> ({report.rejection.agency}) ·{' '}
                  {new Date(report.rejection.rejectedAt).toLocaleString()}
                </div>
              </div>
            )}

            {/* Evidence Image with Resilient Fallback */}
            {report.photoUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-sm">
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
                        fallback.className = 'evidence-fallback flex flex-col items-center justify-center p-6 bg-slate-100 text-slate-500 text-xs h-40';
                        fallback.innerHTML = '<span class="font-bold text-slate-700">Evidence Record Captured</span><span class="text-[10px] text-slate-400 mt-1">Verified Digital Image on File in Central Incident Registry</span>';
                        parent.prepend(fallback);
                      }
                    }
                  }}
                />
                {report.photoCaption && (
                  <div className="p-2.5 text-xs text-slate-600 bg-white/90 border-t border-slate-200/80">
                    Evidence Note: {report.photoCaption}
                  </div>
                )}
              </div>
            )}

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-red-100 text-red-600 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Incident Location
                    </span>
                    <strong className="text-slate-900 block text-sm mt-0.5">{report.barangay}</strong>
                    <span className="text-slate-600 leading-snug block mt-0.5">{report.locationDetails}</span>
                    <span className="block font-mono text-[10px] text-slate-400 mt-1">
                      GPS: {report.coordinates.lat.toFixed(5)}, {report.coordinates.lng.toFixed(5)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200/80">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Occurrence Date & Time
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {new Date(report.dateTime).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Reporting Resident
                    </span>
                    <strong className="text-slate-900 block text-sm mt-0.5">{report.residentName}</strong>
                    <span className="text-slate-600 flex items-center gap-1.5 font-medium mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {report.residentPhone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200/80">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Selected Agency
                    </span>
                    <span className="text-slate-900 font-bold">
                      {report.selectedAgency} ({agencyInfo?.fullNameEn})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Banner (for Resolved Cases) */}
            {report.status === 'Resolved' && (
              <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs space-y-1.5 animate-in fade-in text-emerald-950">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Case Resolved & Logged in Provincial History</span>
                </div>
                <p className="text-slate-700 pl-6 text-xs leading-relaxed">
                  {report.resolution?.notes || 'Incident successfully cleared and verified resolved.'}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pl-6 pt-1 border-t border-emerald-200/80">
                  <span>
                    Resolved by: <strong className="text-slate-800">{report.resolution?.resolvedByAdmin || 'Command Officer'}</strong> ({report.resolution?.agency || report.selectedAgency})
                  </span>
                  <span>
                    Closed at: <strong className="text-slate-800">{new Date(report.resolution?.resolvedAt || report.updatedAt).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Archived / Rejection Banner (for Rejected Cases) */}
            {report.status === 'Rejected' && (
              <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl text-xs space-y-1.5 animate-in fade-in text-rose-950">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Case Archived / Discarded</span>
                </div>
                <p className="text-rose-900 pl-6 text-xs font-medium leading-relaxed">
                  "{report.rejection?.reason || 'Case marked as rejected / unverified.'}"
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pl-6 pt-1 border-t border-rose-200/80">
                  <span>
                    Archived by: <strong className="text-slate-800">{report.rejection?.rejectedByAdmin || 'Command Officer'}</strong> ({report.rejection?.agency || report.selectedAgency})
                  </span>
                  <span>
                    Archived at: <strong className="text-slate-800">{new Date(report.rejection?.rejectedAt || report.updatedAt).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Description Narrative */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Resident Narrative / Description:
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">{report.description}</p>
            </div>

            {/* Action History / Audit Log Timeline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <History className="w-4 h-4 text-blue-600" />
                <span>{t.auditHistory} (Immutable Audit Log)</span>
              </div>

              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 max-h-44 overflow-y-auto space-y-2.5">
                {report.history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 text-xs pb-2 border-b border-slate-200/80 last:border-0 last:pb-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900">
                          {item.action} — <span className="text-blue-700">{item.adminName}</span> ({item.agency})
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rejection Form Box (Agency Admins Only) */}
            {isAgencyAdmin && isRejectOpen && (
              <form
                onSubmit={handleConfirmReject}
                className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl text-xs space-y-3"
              >
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Mandatory Rejection Reason (Required for Archiving):</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Rejecting this report will immediately remove it from active dispatch & live map, recording your name ({currentAdmin?.name}), agency ({currentAgency}), date, and time.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State the verifiable reason for rejection (e.g. False alarm / Duplicate / Fictitious address)..."
                  rows={2}
                  required
                  className="w-full bg-white border border-rose-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectOpen(false)}
                    className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition cursor-pointer"
                  >
                    Confirm Rejection & Archive
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Action Footer: Agency Administrators vs Citizen / Resident Report Tracking */}
          {isAgencyAdmin ? (
            <div className="pt-4 mt-4 border-t border-slate-200/80">
              {/* CASE 1: Archived / Rejected Report -> Provide Restore Button */}
              {report.status === 'Rejected' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-rose-50/80 border border-rose-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2.5 text-xs text-rose-900">
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-800">Incident Is In Emergency Archive</span>
                      <p className="text-slate-600 text-[11px] mt-0.5 font-medium">
                        "{report.rejection?.reason || 'Case was rejected / marked false alarm.'}"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRestoreFromArchive}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer shrink-0"
                    title="Restore report back to active pending dispatch queue"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore Report to Active Registry</span>
                  </button>
                </div>
              )}

              {/* CASE 2: Resolved Report -> Lock Reject and Request Assistance */}
              {report.status === 'Resolved' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2.5 text-xs text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-800">Incident Successfully Resolved & Logged in History</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Response is completed. Reject and Assistance requests are disabled for resolved cases.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStatusChange('Ongoing', 'Reopened resolved incident for follow-up verification')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
                    title="Reopen case if further field dispatch is required"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reopen Case (Ongoing)</span>
                  </button>
                </div>
              )}

              {/* CASE 3: Active Ongoing / Pending Cases -> Request Assistance & Reject allowed */}
              {report.status !== 'Rejected' && report.status !== 'Resolved' && (
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Request Assistance Button */}
                    <button
                      onClick={() => setIsAssistanceModalOpen(true)}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{t.requestAssistance}</span>
                    </button>
                  </div>

                  {/* Status Update Action Pipeline: Accept -> Ongoing -> Resolved / Reject */}
                  <div className="flex items-center gap-2">
                    {report.status === 'Pending Verification' && (
                      <button
                        onClick={() => handleStatusChange('Accepted')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t.accept}</span>
                      </button>
                    )}

                    {(report.status === 'Accepted' || report.status === 'Pending Verification') && (
                      <button
                        onClick={() => handleStatusChange('Ongoing')}
                        className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t.setOngoing}</span>
                      </button>
                    )}

                    {report.status === 'Ongoing' && (
                      <button
                        onClick={() => handleStatusChange('Resolved')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t.resolve}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsRejectOpen(true)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>{t.reject}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Citizen / Resident View: Shows Actual Status of the Report */
            <div className="pt-4 mt-4 border-t border-slate-200/80 space-y-3.5">
              {/* Actual Report Status Hero Card */}
              <div
                className={`p-4 rounded-2xl border shadow-xs transition ${
                  report.status === 'Resolved'
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : report.status === 'Ongoing'
                    ? 'bg-orange-50/90 border-orange-200 text-orange-950'
                    : report.status === 'Accepted'
                    ? 'bg-blue-50/90 border-blue-200 text-blue-950'
                    : report.status === 'Rejected'
                    ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                    : 'bg-amber-50/90 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {report.status === 'Resolved' && (
                      <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs shrink-0">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                    )}
                    {report.status === 'Ongoing' && (
                      <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-700 border border-orange-200 shadow-xs shrink-0 animate-pulse">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                    )}
                    {report.status === 'Accepted' && (
                      <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 shadow-xs shrink-0">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    {report.status === 'Pending Verification' && (
                      <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 shadow-xs shrink-0 animate-pulse">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                    )}
                    {report.status === 'Rejected' && (
                      <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 shadow-xs shrink-0">
                        <AlertOctagon className="w-5 h-5 text-rose-600" />
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-75 block">
                        {language === 'fil' ? 'Kasalukuyang Katayuan ng Ulat' : 'Actual Incident Report Status'}
                      </span>
                      <h4 className="text-sm sm:text-base font-black tracking-tight mt-0.5">
                        {report.status === 'Pending Verification' &&
                          (language === 'fil' ? 'Naka-pending para sa Beripikasyon ng Dispatch' : 'Pending Verification & Dispatch Triage')}
                        {report.status === 'Accepted' &&
                          (language === 'fil' ? `Tinanggap ng ${report.selectedAgency} Command` : `Accepted by ${report.selectedAgency} Command`)}
                        {report.status === 'Ongoing' &&
                          (language === 'fil' ? `Kasalukuyang Nirerespondehan ng ${report.selectedAgency}` : `Field Response Ongoing by ${report.selectedAgency}`)}
                        {report.status === 'Resolved' &&
                          (language === 'fil' ? 'Naresolba at Ligtas na Naisaayos' : 'Incident Resolved & Field Verified')}
                        {report.status === 'Rejected' &&
                          (language === 'fil' ? 'Ulat ay Na-archive / Hindi Na-verify' : 'Report Archived / Unverified')}
                      </h4>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`self-start sm:self-center text-xs font-black px-3.5 py-1.5 rounded-full border shadow-xs ${
                      report.status === 'Resolved'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : report.status === 'Ongoing'
                        ? 'bg-orange-500 text-white border-orange-400'
                        : report.status === 'Accepted'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : report.status === 'Rejected'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-amber-500 text-white border-amber-400'
                    }`}
                  >
                    {t[report.status] || report.status}
                  </span>
                </div>

                {/* Explanatory Message for Citizen */}
                <p className="text-xs leading-relaxed font-medium mt-2.5 pt-2.5 border-t border-slate-200/60">
                  {report.status === 'Pending Verification' &&
                    (language === 'fil'
                      ? 'Natanggap na ng central 911 dispatch queue ang iyong ulat. Sinusuri ng duty officer ang iyong lokasyon para sa pagtatalaga ng pinakamalapit na patrol o emergency responder.'
                      : 'Your emergency report has been received in the central 911 queue. Officers are verifying your location coordinates to assign the nearest field unit.')}
                  {report.status === 'Accepted' &&
                    (language === 'fil'
                      ? `Kinumpirma ng ${report.selectedAgency} ang iyong ulat. Inihahanda na ang kaukulang kagamitan at mga tauhan para sa mabilisang deployment sa iyong lokasyon.`
                      : `${report.selectedAgency} has verified and accepted your report. The designated emergency response team is preparing for rapid deployment to your location.`)}
                  {report.status === 'Ongoing' &&
                    (language === 'fil'
                      ? `Kasalukuyang rumeresponde ang mga tauhan ng ${report.selectedAgency} sa iniulat na lokasyon sa ${report.barangay}. Mangyaring manatili sa ligtas na lugar at panatilihing bukas ang inyong telepono (${report.residentPhone}).`
                      : `Emergency personnel and vehicles from ${report.selectedAgency} are actively responding on scene at ${report.barangay}. Please remain in a safe location and keep your phone line (${report.residentPhone}) reachable.`)}
                  {report.status === 'Resolved' &&
                    (language === 'fil'
                      ? `Matagumpay na naresolba ng mga rumespondeng tauhan ang insidenteng ito noong ${new Date(report.resolution?.resolvedAt || report.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Maraming salamat sa iyong pagiging mapagmatyag na mamamayan.`
                      : `The field response has concluded and the incident was officially verified resolved at ${new Date(report.resolution?.resolvedAt || report.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Thank you for your alert and community vigilance.`)}
                  {report.status === 'Rejected' &&
                    (language === 'fil'
                      ? `Dokumentadong dahilan ng Dispatcher: "${report.rejection?.reason || 'Minarkahan bilang hindi kwalipikado o false alarm.'}"`
                      : `Dispatcher Justification: "${report.rejection?.reason || 'Marked as unverified or false alarm.'}"`)}
                </p>

                {/* 4-Stage Dispatch Pipeline Visualizer (if not rejected) */}
                {report.status !== 'Rejected' && (
                  <div className="pt-3 mt-3 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      {language === 'fil' ? 'Progreso ng Operasyon' : 'Dispatch Response Pipeline'}
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-center">
                      {/* Step 1: Submitted */}
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-emerald-700 flex flex-col items-center gap-0.5 shadow-2xs">
                        <span className="text-[9px] text-emerald-600 font-mono">1. Sent</span>
                        <span className="truncate">✓ {language === 'fil' ? 'Naipadala' : 'Submitted'}</span>
                      </div>

                      {/* Step 2: Accepted */}
                      <div
                        className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 shadow-2xs ${
                          report.status === 'Accepted' || report.status === 'Ongoing' || report.status === 'Resolved'
                            ? 'bg-white border-blue-200 text-blue-700'
                            : 'bg-slate-100/60 border-slate-200 text-slate-400'
                        }`}
                      >
                        <span className="text-[9px] font-mono opacity-75">2. Verified</span>
                        <span className="truncate">
                          {report.status === 'Accepted' || report.status === 'Ongoing' || report.status === 'Resolved' ? '✓ ' : ''}
                          {language === 'fil' ? 'Tinanggap' : 'Accepted'}
                        </span>
                      </div>

                      {/* Step 3: Ongoing */}
                      <div
                        className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 shadow-2xs ${
                          report.status === 'Ongoing' || report.status === 'Resolved'
                            ? 'bg-white border-orange-200 text-orange-700'
                            : 'bg-slate-100/60 border-slate-200 text-slate-400'
                        }`}
                      >
                        <span className="text-[9px] font-mono opacity-75">3. En Route</span>
                        <span className="truncate">
                          {report.status === 'Ongoing' || report.status === 'Resolved' ? '✓ ' : ''}
                          {language === 'fil' ? 'Rumeresponde' : 'Ongoing'}
                        </span>
                      </div>

                      {/* Step 4: Resolved */}
                      <div
                        className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 shadow-2xs ${
                          report.status === 'Resolved'
                            ? 'bg-white border-emerald-200 text-emerald-700'
                            : 'bg-slate-100/60 border-slate-200 text-slate-400'
                        }`}
                      >
                        <span className="text-[9px] font-mono opacity-75">4. Cleared</span>
                        <span className="truncate">
                          {report.status === 'Resolved' ? '✓ ' : ''}
                          {language === 'fil' ? 'Naresolba' : 'Resolved'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Citizen Hotline Speed Dial & Close Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {language === 'fil'
                      ? `Nakatakdang Ahensya: ${report.selectedAgency} (${agencyInfo?.fullNameFil})`
                      : `Assigned Agency: ${report.selectedAgency} (${agencyInfo?.fullNameEn})`}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {agencyInfo?.hotline && (
                    <a
                      href={`tel:${agencyInfo.hotline.replace(/[^\d+]/g, '') || '911'}`}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                      title={`Direct call ${report.selectedAgency} emergency hotline`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call {report.selectedAgency} Hotline</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {language === 'fil' ? 'Isara' : 'Close Details'}
                  </button>
                </div>
              </div>
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
