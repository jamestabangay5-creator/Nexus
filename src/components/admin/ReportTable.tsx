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
  Check
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
    updateIncidentStatus(
      reportId,
      newStatus,
      agencyUser?.name || currentAdmin?.name || `${currentScope} Admin`,
      currentScope
    );
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReport || !rejectReason.trim()) return;

    rejectIncidentReport(
      rejectingReport.id,
      rejectReason.trim(),
      agencyUser?.name || currentAdmin?.name || `${currentScope} Admin`,
      currentScope
    );

    setRejectingReport(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search tracking code, citizen, barangay, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Reset Filters button if any active */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[40px] shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Quick Scope Filter Toggle for Department Officers */}
        {currentScope !== 'CENTRAL' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-semibold">Registry Scope:</span>
            <button
              type="button"
              onClick={() => setAgencyFilter(currentScope)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                agencyFilter === currentScope
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {currentScope} Department Incidents ({reports.filter((r) => r.selectedAgency === currentScope && r.status !== 'Rejected').length})
            </button>
            <button
              type="button"
              onClick={() => setAgencyFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                agencyFilter === 'ALL'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Unified 911 Provincial Registry ({activeReports.length})
            </button>
          </div>
        )}

        {/* Quick Status & Resolved History Quick-Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-semibold">Incident State:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>All Incidents</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-slate-300 font-mono">
              {activeReports.filter((r) => agencyFilter === 'ALL' || r.selectedAgency === agencyFilter).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Pending Verification')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Pending Verification'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Triage</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-amber-300 font-mono">
              {activeReports.filter((r) => (agencyFilter === 'ALL' || r.selectedAgency === agencyFilter) && r.status === 'Pending Verification').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Ongoing')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Ongoing'
                ? 'bg-orange-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>Ongoing Response</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-orange-300 font-mono">
              {activeReports.filter((r) => (agencyFilter === 'ALL' || r.selectedAgency === agencyFilter) && (r.status === 'Ongoing' || r.status === 'Accepted')).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Resolved')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Resolved'
                ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-300'
                : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-emerald-900/60'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resolved History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">
              {activeReports.filter((r) => (agencyFilter === 'ALL' || r.selectedAgency === agencyFilter) && r.status === 'Resolved').length}
            </span>
          </button>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[38px]"
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
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[38px]"
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
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[38px]"
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
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[38px]"
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
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-xs flex items-center justify-between gap-3 text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Resolved Cases History Archive:</strong> Viewing {filteredReports.length} completed incidents with resolution timestamps, responding agencies, and immutable audit timeline records.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('ALL')}
            className="text-xs font-semibold text-emerald-400 hover:text-white underline cursor-pointer shrink-0"
          >
            Show All Incidents
          </button>
        </div>
      )}

      {/* 1. MOBILE RESPONSIVE CARDS VIEW (Visible on screens < 768px) */}
      <div className="block md:hidden space-y-3">
        {filteredReports.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
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

            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.id)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-xl space-y-3 cursor-pointer transition active:scale-[0.99]"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-blue-400">
                      {report.trackingCode}
                    </span>
                    <button
                      onClick={(e) => handleCopyCode(e, report.trackingCode, report.id)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Copy Tracking Code"
                    >
                      {copiedId === report.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        color: typeDef?.colorHex,
                        backgroundColor: `${typeDef?.colorHex}22`,
                      }}
                    >
                      {report.category}
                    </span>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
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
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'fil' ? typeDef?.fil : typeDef?.en}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                {/* Location & Agency & Time */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate text-slate-200">{report.barangay}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-bold text-white uppercase">{report.selectedAgency}</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2 text-[10px] text-slate-500">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>{new Date(report.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div
                  className="flex items-center justify-between gap-1.5 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    {/* Advance Status button */}
                    {isPending && (
                      <button
                        onClick={(e) => handleQuickStatus(e, report.id, 'Accepted')}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition flex-1 min-h-[36px]"
                      >
                        Accept
                      </button>
                    )}
                    {(isAccepted || isPending) && (
                      <button
                        onClick={(e) => handleQuickStatus(e, report.id, 'Ongoing')}
                        className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold text-xs transition flex-1 min-h-[36px]"
                      >
                        Deploy
                      </button>
                    )}
                    {isOngoing && (
                      <button
                        onClick={(e) => handleQuickStatus(e, report.id, 'Resolved')}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition flex-1 min-h-[36px]"
                      >
                        Resolve
                      </button>
                    )}

                    {/* Inter-Agency Request (only when not resolved) */}
                    {!isResolved && (
                      <button
                        onClick={() => setAssistanceReport(report)}
                        title="Request Assistance"
                        className="p-2 text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
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
                        className="p-2 text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                      >
                        <AlertOctagon className="w-4 h-4" />
                      </button>
                    )}

                    {/* Resolved status indicator for mobile */}
                    {isResolved && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>

                  {/* View Details */}
                  <button
                    onClick={() => onSelectReport(report.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 min-h-[36px]"
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

      {/* 2. DESKTOP TABLE VIEW (Visible on screens >= 768px) */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
                      <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{report.trackingCode}</span>
                          <button
                            onClick={(e) => handleCopyCode(e, report.trackingCode, report.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition"
                            title="Copy Tracking Code"
                          >
                            {copiedId === report.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
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
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block ${
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
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Assistance (only when not resolved) */}
                          {!isResolved && (
                            <button
                              onClick={() => setAssistanceReport(report)}
                              title="Request Inter-Agency Assistance"
                              className="p-1.5 text-indigo-400 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 rounded-lg transition cursor-pointer"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Accept */}
                          {isPending && (
                            <button
                              onClick={(e) => handleQuickStatus(e, report.id, 'Accepted')}
                              title="Accept Report"
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[11px] transition shadow cursor-pointer"
                            >
                              {t.accept}
                            </button>
                          )}

                          {/* Quick Ongoing */}
                          {(isAccepted || isPending) && (
                            <button
                              onClick={(e) => handleQuickStatus(e, report.id, 'Ongoing')}
                              title="Deploy response (Ongoing)"
                              className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold text-[11px] transition shadow cursor-pointer"
                            >
                              {t.setOngoing}
                            </button>
                          )}

                          {/* Quick Resolve */}
                          {isOngoing && (
                            <button
                              onClick={(e) => handleQuickStatus(e, report.id, 'Resolved')}
                              title="Mark as Resolved"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] transition shadow cursor-pointer"
                            >
                              {t.resolve}
                            </button>
                          )}

                          {/* Resolved Badge */}
                          {isResolved && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Resolved</span>
                            </span>
                          )}

                          {/* Quick Reject (only when not resolved) */}
                          {!isResolved && (
                            <button
                              onClick={() => {
                                setRejectingReport(report);
                                setRejectReason('');
                              }}
                              title="Reject and Archive Report"
                              className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition cursor-pointer"
                            >
                              <AlertOctagon className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Open Dossier */}
                          <button
                            onClick={() => onSelectReport(report.id)}
                            title="View Full Report"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
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
          <div className="bg-slate-900 border border-rose-600/60 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-slate-100">
            <div className="flex items-center gap-3 mb-3 text-rose-400">
              <AlertOctagon className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">
                Reject Incident Report ({rejectingReport.trackingCode})
              </h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
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
