import React, { useState, useMemo } from 'react';
import { useNexus } from '../../context/NexusContext';
import { IncidentReport, IncidentStatus, Agency, IncidentTypeId, AgencyScope } from '../../types';
import { INCIDENT_TYPES, BARANGAYS, AGENCY_DETAILS } from '../../constants/incidentData';
import { ALL_UNIQUE_ORIENTAL_MINDORO_BARANGAYS } from '../../constants/orientalMindoroData';
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
  ChevronRight,
  RotateCcw,
  Copy,
  Check,
  Lock
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
    agencyUser,
    triggerSuccessModal,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const currentScope: AgencyScope = activeRole === 'resident' ? 'CENTRAL' : activeRole;
  const currentAgency: Agency = (currentScope === 'CENTRAL' ? 'PNP' : currentScope) as Agency;
  const currentAdmin = adminProfiles[currentScope];

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [barangayFilter, setBarangayFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [agencyFilter, setAgencyFilter] = useState(currentScope === 'CENTRAL' ? 'ALL' : currentScope);

  // Quick Assistance Modal
  const [assistanceReport, setAssistanceReport] = useState<IncidentReport | null>(null);

  // Quick Reject Dialog
  const [rejectingReport, setRejectingReport] = useState<IncidentReport | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Copied code feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (e: React.MouseEvent, code: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Requirement 2: Exclude rejected reports from active dashboard
  const activeReports = useMemo(() => {
    return reports.filter((r) => r.status !== 'Rejected');
  }, [reports]);

  const hasActiveFilters =
    search !== '' ||
    statusFilter !== 'ALL' ||
    barangayFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    agencyFilter !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setBarangayFilter('ALL');
    setCategoryFilter('ALL');
    setAgencyFilter('ALL');
  };

  const filteredReports = useMemo(() => {
    return activeReports
      .filter((rep) => {
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
          const matchResolution =
            (rep.resolution?.notes || '').toLowerCase().includes(query) ||
            (rep.resolution?.resolvedByAdmin || '').toLowerCase().includes(query);
          if (!matchCode && !matchDesc && !matchBrgy && !matchResident && !matchResolution) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeReports, statusFilter, barangayFilter, categoryFilter, agencyFilter, search]);

  const handleQuickStatus = (e: React.MouseEvent, reportId: string, newStatus: IncidentStatus) => {
    e.stopPropagation();
    const rep = reports.find((r) => r.id === reportId);
    updateIncidentStatus(
      reportId,
      newStatus,
      agencyUser?.name || currentAdmin?.name || `${currentScope} Admin`,
      currentScope
    );

    if (rep) {
      const isResolve = newStatus === 'Resolved';
      const isOngoing = newStatus === 'Ongoing';
      const isAccept = newStatus === 'Accepted';

      triggerSuccessModal({
        title: isResolve
          ? 'Incident Marked as Resolved!'
          : isOngoing
          ? 'Response Team Deployed (Ongoing)!'
          : isAccept
          ? 'Report Accepted for Dispatch!'
          : 'Status Updated Successfully!',
        message: isResolve
          ? `Incident report ${rep.trackingCode} is now officially resolved.`
          : isOngoing
          ? `Field responders are actively engaged for ${rep.trackingCode}.`
          : isAccept
          ? `Report ${rep.trackingCode} has been accepted for response.`
          : `Incident status updated to ${newStatus}.`,
        trackingCode: rep.trackingCode,
        agency: rep.selectedAgency,
        statusBadge: newStatus,
        actionType: isResolve ? 'resolve' : 'status',
        details: `Confirmed by ${agencyUser?.name || currentAdmin?.name || 'Authorized Officer'} (${currentScope}).`
      });
    }
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReport || !rejectReason.trim()) return;

    const savedReason = rejectReason.trim();
    const rep = rejectingReport;

    rejectIncidentReport(
      rep.id,
      savedReason,
      agencyUser?.name || currentAdmin?.name || `${currentScope} Admin`,
      currentScope
    );

    setRejectingReport(null);
    setRejectReason('');

    triggerSuccessModal({
      title: 'Incident Successfully Rejected & Archived',
      message: `Report ${rep.trackingCode} has been moved to the Emergency Archive.`,
      trackingCode: rep.trackingCode,
      agency: currentScope,
      statusBadge: 'Archived / Rejected',
      actionType: 'reject',
      details: `Justification: "${savedReason}". Removed from active dispatch.`
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar - Frosted Neo-Aero Glass */}
      <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/50 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search tracking code, citizen, barangay, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none min-h-[40px] shadow-2xs font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Reset Filters button if any active */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[40px] shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Quick Scope Filter Toggle for Department Officers */}
        {currentScope !== 'CENTRAL' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-bold">Registry Scope:</span>
            <button
              type="button"
              onClick={() => setAgencyFilter(currentScope)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                agencyFilter === currentScope
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {currentScope} Department Incidents ({reports.filter((r) => r.selectedAgency === currentScope && r.status !== 'Rejected').length})
            </button>
            <button
              type="button"
              onClick={() => setAgencyFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                agencyFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Unified 911 Provincial Registry ({activeReports.length})
            </button>
          </div>
        )}

        {/* Quick Status & Resolved History Quick-Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-600 font-bold">Incident State:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <span>All Incidents</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-800 font-mono font-bold">
              {activeReports.filter((r) => agencyFilter === 'ALL' || r.selectedAgency === agencyFilter).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Pending Verification')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
              statusFilter === 'Pending Verification'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Pending Triage</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-800 font-mono font-bold border border-amber-200">
              {activeReports.filter((r) => (agencyFilter === 'ALL' || r.selectedAgency === agencyFilter) && r.status === 'Pending Verification').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Ongoing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
              statusFilter === 'Ongoing'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Ongoing Response</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-800 font-mono font-bold border border-orange-200">
              {activeReports.filter((r) => (agencyFilter === 'ALL' || r.selectedAgency === agencyFilter) && (r.status === 'Ongoing' || r.status === 'Accepted')).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Resolved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
              statusFilter === 'Resolved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200 font-bold'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Resolved History</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200">
              {activeReports.filter((r) => (agencyFilter === 'ALL' || r.selectedAgency === agencyFilter) && r.status === 'Resolved').length}
            </span>
          </button>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs sm:text-sm">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-[42px] shadow-2xs font-semibold"
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
            className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-[42px] shadow-2xs font-semibold"
          >
            <option value="ALL">All Barangays</option>
            {ALL_UNIQUE_ORIENTAL_MINDORO_BARANGAYS.map((b, idx) => (
              <option key={`rt-brgy-${b}-${idx}`} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-[42px] shadow-2xs font-semibold"
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
            className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-[42px] shadow-2xs font-semibold"
          >
            <option value="ALL">All Primary Agencies</option>
            <option value="PNP">PNP Filed</option>
            <option value="BFP">BFP Filed</option>
            <option value="MDRRMO">MDRRMO Filed</option>
          </select>
        </div>
      </div>

      {/* Resolved Incidents History Context Banner */}
      {statusFilter === 'Resolved' && (
        <div className="bg-emerald-50/95 border border-emerald-200/90 rounded-2xl p-4 text-xs flex items-center justify-between gap-3 text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="font-bold">Resolved Cases History Archive:</strong> Viewing {filteredReports.length} completed incidents with resolution timestamps, responding agencies, and immutable audit timeline records.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('ALL')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer shrink-0"
          >
            Show All Incidents
          </button>
        </div>
      )}

      {/* 1. MOBILE RESPONSIVE CARDS VIEW (Visible on screens < 768px) */}
      <div className="block md:hidden space-y-3">
        {filteredReports.length === 0 ? (
          <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-8 text-center text-slate-500 text-xs shadow-sm">
            No active incident reports match the selected filters.
          </div>
        ) : (
          filteredReports.map((report) => {
            const typeDef = INCIDENT_TYPES.find(
              (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
            );
            const isPending = report.status === 'Pending Verification';
            const isAccepted = report.status === 'Accepted';
            const isOngoing = report.status === 'Ongoing';
            const isResolved = report.status === 'Resolved';
            const isCentral = currentScope === 'CENTRAL' || Boolean(agencyUser?.isSystemAdmin);
            const canManage = isCentral || report.selectedAgency === currentScope;

            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.id)}
                className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 hover:border-slate-300 rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/50 space-y-3 cursor-pointer transition active:scale-[0.99]"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-xs text-blue-700">
                      {report.trackingCode}
                    </span>
                    <button
                      onClick={(e) => handleCopyCode(e, report.trackingCode, report.id)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Copy Tracking Code"
                    >
                      {copiedId === report.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        color: typeDef?.colorHex,
                        backgroundColor: `${typeDef?.colorHex}15`,
                        border: `1px solid ${typeDef?.colorHex}30`,
                      }}
                    >
                      {report.category}
                    </span>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isOngoing
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : isAccepted
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {t[report.status] || report.status}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {language === 'fil' ? typeDef?.fil : typeDef?.en}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1 line-clamp-2 leading-relaxed font-medium">
                    {report.description}
                  </p>
                </div>

                {/* Location & Agency & Time */}
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="truncate text-slate-900 font-bold">{report.barangay}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-black text-slate-900 uppercase">{report.selectedAgency}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{new Date(report.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div
                  className="flex items-center justify-between gap-1.5 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    {canManage ? (
                      <>
                        {/* Advance Status button */}
                        {isPending && (
                          <button
                            onClick={(e) => handleQuickStatus(e, report.id, 'Accepted')}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition flex-1 min-h-[36px] shadow-xs cursor-pointer"
                          >
                            Accept
                          </button>
                        )}
                        {(isAccepted || isPending) && (
                          <button
                            onClick={(e) => handleQuickStatus(e, report.id, 'Ongoing')}
                            className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition flex-1 min-h-[36px] shadow-xs cursor-pointer"
                          >
                            Deploy
                          </button>
                        )}
                        {isOngoing && (
                          <button
                            onClick={(e) => handleQuickStatus(e, report.id, 'Resolved')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex-1 min-h-[36px] shadow-xs cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}

                        {/* Inter-Agency Request (only when not resolved) */}
                        {!isResolved && (
                          <button
                            onClick={() => setAssistanceReport(report)}
                            title="Request Assistance"
                            className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reject (only when not resolved) */}
                        {!isResolved && (
                          <button
                            onClick={() => {
                              setRejectingReport(report);
                              setRejectReason('');
                            }}
                            title="Reject Report"
                            className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            <AlertOctagon className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      /* Read-Only Lead Agency Notice for non-lead agencies */
                      !isResolved && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-slate-500 text-[11px] font-semibold">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{report.selectedAgency} Lead Agency</span>
                        </div>
                      )
                    )}

                    {/* Resolved status indicator for mobile */}
                    {isResolved && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>

                  {/* View Details */}
                  <button
                    onClick={() => onSelectReport(report.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 min-h-[36px]"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. DESKTOP TABLE VIEW (Visible on screens >= 768px) - Reference Image Table Styling */}
      <div className="hidden md:block glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/90 text-slate-600 uppercase font-black text-xs tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-4 font-black">{t.trackingCode}</th>
                <th className="py-4 px-4 font-black">{t.incidentType}</th>
                <th className="py-4 px-4 font-black">{t.location}</th>
                <th className="py-4 px-4 font-black">{t.agency}</th>
                <th className="py-4 px-4 font-black">{t.dateTime}</th>
                <th className="py-4 px-4 font-black">{t.status}</th>
                <th className="py-4 px-4 text-right font-black">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm font-semibold">
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
                  const isCentral = currentScope === 'CENTRAL' || Boolean(agencyUser?.isSystemAdmin);
                  const canManage = isCentral || report.selectedAgency === currentScope;

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                      onClick={() => onSelectReport(report.id)}
                    >
                      {/* Tracking Code */}
                      <td className="py-4 px-4 font-mono font-black text-blue-700 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{report.trackingCode}</span>
                          <button
                            onClick={(e) => handleCopyCode(e, report.trackingCode, report.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition"
                            title="Copy Tracking Code"
                          >
                            {copiedId === report.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Incident Type & Color Category */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: typeDef?.colorHex }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                              {language === 'fil' ? typeDef?.fil : typeDef?.en}
                            </span>
                            <span
                              className="text-xs font-bold uppercase inline-block px-2 py-0.5 rounded-full mt-0.5"
                              style={{
                                color: typeDef?.colorHex,
                                backgroundColor: `${typeDef?.colorHex}15`,
                                border: `1px solid ${typeDef?.colorHex}30`,
                              }}
                            >
                              {report.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                          {report.barangay}
                        </span>
                        <span className="text-xs text-slate-600 truncate block max-w-[200px] font-medium">
                          {report.locationDetails}
                        </span>
                      </td>

                      {/* Selected Agency */}
                      <td className="py-4 px-4">
                        <span className="font-black text-slate-900 uppercase text-xs px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                          {report.selectedAgency}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-4 text-slate-600 text-xs sm:text-sm font-medium whitespace-nowrap">
                        {new Date(report.dateTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status matching Reference Image (Recent Campaigns dot + pill) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isOngoing
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : isAccepted
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            isResolved ? 'bg-emerald-500' : isOngoing ? 'bg-orange-500' : isAccepted ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          <span>{t[report.status] || report.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage ? (
                            <>
                              {/* Quick Assistance (only when not resolved) */}
                              {!isResolved && (
                                <button
                                  onClick={() => setAssistanceReport(report)}
                                  title="Request Inter-Agency Assistance"
                                  className="p-1.5 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition cursor-pointer shadow-2xs"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Quick Accept */}
                              {isPending && (
                                <button
                                  onClick={(e) => handleQuickStatus(e, report.id, 'Accepted')}
                                  title="Accept Report"
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer"
                                >
                                  {t.accept}
                                </button>
                              )}

                              {/* Quick Ongoing */}
                              {(isAccepted || isPending) && (
                                <button
                                  onClick={(e) => handleQuickStatus(e, report.id, 'Ongoing')}
                                  title="Deploy response (Ongoing)"
                                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer"
                                >
                                  {t.setOngoing}
                                </button>
                              )}

                              {/* Quick Resolve */}
                              {isOngoing && (
                                <button
                                  onClick={(e) => handleQuickStatus(e, report.id, 'Resolved')}
                                  title="Mark as Resolved"
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer"
                                >
                                  {t.resolve}
                                </button>
                              )}

                              {/* Quick Reject (only when not resolved) */}
                              {!isResolved && (
                                <button
                                  onClick={() => {
                                    setRejectingReport(report);
                                    setRejectReason('');
                                  }}
                                  title="Reject and Archive Report"
                                  className="p-1.5 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer shadow-2xs"
                                >
                                  <AlertOctagon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            /* Read-Only Lead Agency Badge for non-lead agencies */
                            !isResolved && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md"
                                title={`Lead Agency: ${report.selectedAgency}. Operational actions reserved.`}
                              >
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>{report.selectedAgency} Lead</span>
                              </span>
                            )
                          )}

                          {/* Resolved Badge */}
                          {isResolved && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Resolved</span>
                            </span>
                          )}

                          {/* Open Full Report */}
                          <button
                            onClick={() => onSelectReport(report.id)}
                            title="View Full Report Details"
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in">
          <div className="glass-card bg-white/95 backdrop-blur-2xl border border-rose-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-slate-800 overflow-hidden">
            {/* Visual background ambient glow & watermark */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-2 bottom-2 pointer-events-none opacity-[0.05] select-none">
              <AlertOctagon className="w-36 h-36 text-rose-800" />
            </div>
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <AlertOctagon className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">
                Reject Incident Report ({rejectingReport.trackingCode})
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
              Per emergency protocol, this report will be moved to the <strong className="text-slate-900">Rejected Reports Archive</strong> and removed from active dispatch and map. You must document the reason.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Documented Rejection Reason:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Verified false alarm by patrol / Duplicate case / Unverified prank submission..."
                  rows={3}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs font-medium"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span>Recorded Admin: </span>
                <strong className="text-slate-900 font-bold">{currentAdmin?.name}</strong> ({currentAgency})
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectingReport(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer"
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
