import React, { useState, useMemo, useEffect } from 'react';
import { useNexus } from '../../context/NexusContext';
import { IncidentReport, Agency, AgencyScope } from '../../types';
import { INCIDENT_TYPES, BARANGAYS } from '../../constants/incidentData';
import { ALL_UNIQUE_ORIENTAL_MINDORO_BARANGAYS } from '../../constants/orientalMindoroData';
import { TRANSLATIONS } from '../../constants/translations';
import { ExportReportsButton } from '../common/ExportReportsButton';
import {
  Archive,
  Search,
  RotateCcw,
  Eye,
  AlertOctagon,
  Calendar,
  User,
  Building2,
  FileText,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

interface Props {
  onSelectReport?: (reportId: string) => void;
}

export const RejectedReportsArchive: React.FC<Props> = ({ onSelectReport }) => {
  const {
    reports,
    activeRole,
    restoreRejectedReport,
    adminProfiles,
    language,
    agencyUser,
    residentUser,
    portalMode,
    isAgencyAuthenticated,
  } = useNexus();

  const isAgencyAdmin =
    portalMode === 'agency' &&
    activeRole !== 'resident' &&
    (isAgencyAuthenticated || agencyUser !== null);

  const t = TRANSLATIONS[language];
  const currentScope: AgencyScope = activeRole === 'resident' ? 'CENTRAL' : activeRole;
  const currentAgency: Agency = (currentScope === 'CENTRAL' ? 'PNP' : currentScope) as Agency;
  const currentAdmin = adminProfiles[currentAgency];

  const [search, setSearch] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState('ALL');
  const [archiveFilter, setArchiveFilter] = useState<'ALL' | 'Rejected' | 'Resolved'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | '24h' | '7d' | '30d' | 'custom'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const dateValidationError = useMemo(() => {
    if (dateFilter !== 'custom') return null;
    if (customStartDate && customStartDate > todayStr) {
      return 'Starting date cannot be in the future. Reports can only be filtered up to today.';
    }
    if (customEndDate && customEndDate > todayStr) {
      return 'Ending date cannot be in the future. Please select today or an earlier date.';
    }
    if (customStartDate && customEndDate && customStartDate > customEndDate) {
      return "Invalid date range: 'From' date cannot be later than 'To' date.";
    }
    return null;
  }, [dateFilter, customStartDate, customEndDate, todayStr]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalRejected = reports.filter((r) => r.status === 'Rejected').length;
  const totalResolved = reports.filter((r) => r.status === 'Resolved').length;

  // Reset pagination on any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedBarangay, selectedCategory, selectedAgencyFilter, archiveFilter, dateFilter, customStartDate, customEndDate]);

  // Filter archived reports (both Rejected and Resolved incidents) - sorted descending (newest on top)
  const archivedReports = useMemo(() => {
    return reports
      .filter((r) => r.status === 'Rejected' || r.status === 'Resolved')
      .filter((r) => {
        if (archiveFilter !== 'ALL' && r.status !== archiveFilter) return false;
        if (selectedBarangay !== 'ALL' && r.barangay !== selectedBarangay) return false;
        if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
        if (selectedAgencyFilter !== 'ALL' && r.selectedAgency !== selectedAgencyFilter) return false;

        // Date Filter
        if (dateFilter !== 'ALL') {
          const now = Date.now();
          const repTime = new Date(r.rejection?.rejectedAt || r.updatedAt || r.createdAt).getTime();
          if (dateFilter === '24h' && now - repTime > 24 * 60 * 60 * 1000) return false;
          if (dateFilter === '7d' && now - repTime > 7 * 24 * 60 * 60 * 1000) return false;
          if (dateFilter === '30d' && now - repTime > 30 * 24 * 60 * 60 * 1000) return false;
          if (dateFilter === 'custom' && !dateValidationError) {
            if (customStartDate) {
              const start = new Date(customStartDate + 'T00:00:00').getTime();
              if (repTime < start) return false;
            }
            if (customEndDate) {
              const end = new Date(customEndDate + 'T23:59:59.999').getTime();
              if (repTime > end) return false;
            }
          }
        }

        if (search) {
          const query = search.toLowerCase();
          const matchCode = r.trackingCode.toLowerCase().includes(query);
          const matchDesc = r.description.toLowerCase().includes(query);
          const matchLoc = (r.locationDetails || '').toLowerCase().includes(query);
          const matchCitizen = (r.residentName || '').toLowerCase().includes(query);
          const matchReason = r.rejection?.reason.toLowerCase().includes(query) || false;
          const matchOfficer = r.rejection?.rejectedByAdmin.toLowerCase().includes(query) || false;
          if (!matchCode && !matchDesc && !matchLoc && !matchCitizen && !matchReason && !matchOfficer) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, archiveFilter, selectedBarangay, selectedCategory, selectedAgencyFilter, dateFilter, customStartDate, customEndDate, search]);

  const totalReports = archivedReports.length;
  const totalPages = Math.max(1, Math.ceil(totalReports / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReports = useMemo(() => {
    return archivedReports.slice(startIndex, startIndex + pageSize);
  }, [archivedReports, startIndex, pageSize]);

  const hasActiveFilters =
    search !== '' ||
    selectedBarangay !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedAgencyFilter !== 'ALL' ||
    archiveFilter !== 'ALL' ||
    dateFilter !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setSelectedBarangay('ALL');
    setSelectedCategory('ALL');
    setSelectedAgencyFilter('ALL');
    setArchiveFilter('ALL');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
  };

  const handleRestore = (reportId: string) => {
    restoreRejectedReport(
      reportId,
      agencyUser?.name || currentAdmin?.name || `${currentAgency} Officer`,
      currentAgency
    );
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-30">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-2xl shadow-sm">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Emergency Case & Rejection Archive
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanent repository of rejected, false alarm, and resolved emergency cases.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-slate-700 font-mono font-bold">
            <span>{archivedReports.length} Cases in View</span>
          </div>

          {/* Export Button */}
          <ExportReportsButton
            reports={archivedReports}
            agencyScope={currentScope}
            officerName={agencyUser?.name || currentAdmin?.name}
            badgeNumber={agencyUser?.badgeNumber || currentAdmin?.badgeNumber}
            buttonLabel="Download Archive Dossier"
            filtersApplied={{
              category: selectedCategory,
              status: archiveFilter,
              dateRange: dateFilter,
              barangay: selectedBarangay,
              searchQuery: search,
            }}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/50 space-y-3 relative z-20">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search archive by code, keyword, citizen, officer, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[40px] font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2"
              >
                Clear
              </button>
            )}
          </div>

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

        {/* Dropdowns Filter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Barangay Filter */}
          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer min-h-[40px]"
          >
            <option value="ALL">All Barangays</option>
            {ALL_UNIQUE_ORIENTAL_MINDORO_BARANGAYS.map((brgy, idx) => (
              <option key={`arch-brgy-${brgy}-${idx}`} value={brgy}>
                {brgy}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer min-h-[40px]"
          >
            <option value="ALL">All Categories</option>
            <option value="RED">RED — Critical Safety</option>
            <option value="ORANGE">ORANGE — Accidents & Emergencies</option>
            <option value="YELLOW">YELLOW — Suspected Criminal</option>
            <option value="GREEN">GREEN — Community Concerns</option>
            <option value="BLUE">BLUE — Online & Complaints</option>
            <option value="WHITE">WHITE — Other</option>
          </select>

          {/* Agency Filter */}
          <select
            value={selectedAgencyFilter}
            onChange={(e) => setSelectedAgencyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer min-h-[40px]"
          >
            <option value="ALL">All Primary Agencies</option>
            <option value="PNP">PNP</option>
            <option value="BFP">BFP</option>
            <option value="MDRRMO">MDRRMO</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer min-h-[40px]"
          >
            <option value="ALL">All Time</option>
            <option value="24h">Past 24 Hours</option>
            <option value="7d">Past 7 Days</option>
            <option value="30d">Past 30 Days</option>
            <option value="custom">Custom Date Range...</option>
          </select>
        </div>

        {/* Custom Date Interval Input Row */}
        {dateFilter === 'custom' && (
          <div className="flex flex-col gap-2 pt-2.5 border-t border-slate-100 bg-slate-50/80 p-3 rounded-2xl animate-in fade-in">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Select Date Interval:</span>
              </span>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  max={todayStr}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`bg-white border rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 shadow-2xs ${
                    (customStartDate && customStartDate > todayStr) || (customStartDate && customEndDate && customStartDate > customEndDate)
                      ? 'border-rose-400 bg-rose-50/50 text-rose-800'
                      : 'border-slate-200'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  max={todayStr}
                  min={customStartDate || undefined}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`bg-white border rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 shadow-2xs ${
                    (customEndDate && customEndDate > todayStr) || (customStartDate && customEndDate && customStartDate > customEndDate)
                      ? 'border-rose-400 bg-rose-50/50 text-rose-800'
                      : 'border-slate-200'
                  }`}
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                >
                  Clear Dates
                </button>
              )}
            </div>

            {/* Reactive Date Validation Alert */}
            {dateValidationError && (
              <div className="w-full flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{dateValidationError}</span>
              </div>
            )}
          </div>
        )}

        {/* Archive Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-bold">Archive Scope:</span>
          <button
            type="button"
            onClick={() => setArchiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
              archiveFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All Archived ({totalRejected + totalResolved})
          </button>
          <button
            type="button"
            onClick={() => setArchiveFilter('Rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
              archiveFilter === 'Rejected'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Rejected / Discarded ({totalRejected})
          </button>
          <button
            type="button"
            onClick={() => setArchiveFilter('Resolved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
              archiveFilter === 'Resolved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Resolved & Cleared ({totalResolved})
          </button>
        </div>
      </div>

      {/* Archived Reports Cards */}
      <div className="space-y-4">
        {totalReports === 0 ? (
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-12 text-center text-slate-500 text-xs shadow-xl shadow-slate-200/50">
            <Archive className="w-10 h-10 text-slate-400 mx-auto mb-2 stroke-1" />
            <p className="text-sm font-bold text-slate-700">
              No archived cases found matching your filters.
            </p>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              Any incident rejected or completed by PNP, BFP, or MDRRMO is preserved here for historical audits and accountability.
            </p>
          </div>
        ) : (
          paginatedReports.map((report) => {
            const typeDef = INCIDENT_TYPES.find(
              (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
            );

            const isRejected = report.status === 'Rejected';

            return (
              <div
                key={report.id}
                className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60">
                      {report.trackingCode}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'fil' ? typeDef?.fil : typeDef?.en}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        isRejected
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {report.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {report.selectedAgency}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    Originally Filed: {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Documented Rejection / False Alarm Reason Box */}
                {isRejected && (
                  report.isFalseAlarm ? (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-2xl text-xs space-y-2 text-red-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-800 font-black">
                          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                          <span className="uppercase tracking-wide">🚨 Confirmed False Alarm · Offense #{report.falseAlarmDetails?.offenseNumber || 1}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          report.falseAlarmDetails?.actionTaken === 'account_deactivated'
                            ? 'bg-red-700 text-white'
                            : 'bg-amber-500 text-white'
                        }`}>
                          {report.falseAlarmDetails?.actionTaken === 'account_deactivated' ? 'Account Deactivated & Revoked' : 'Official Warning Issued'}
                        </span>
                      </div>
                      <p className="text-red-900 pl-6 text-xs leading-relaxed font-medium">
                        "{report.falseAlarmDetails?.reason || report.rejection?.reason || 'Verified false alarm by emergency responders.'}"
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pl-6 pt-1 border-t border-red-200">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-red-600" />
                          <span>Flagged by: <strong className="text-slate-800">{report.falseAlarmDetails?.flaggedBy || report.rejection?.rejectedByAdmin || 'Command Officer'}</strong> ({report.falseAlarmDetails?.agency || report.selectedAgency})</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-red-600" />
                          <span>Classified at: <strong className="text-slate-800">{new Date(report.falseAlarmDetails?.flaggedAt || report.rejection?.rejectedAt || report.updatedAt).toLocaleString()}</strong></span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl text-xs space-y-2 text-rose-950">
                      <div className="flex items-center gap-2 text-rose-800 font-bold">
                        <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Documented Justification & Archive Reason:</span>
                      </div>
                      <p className="text-rose-900 pl-6 text-xs leading-relaxed font-medium">
                        "{report.rejection?.reason || 'Report rejected by dispatch authority.'}"
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pl-6 pt-1 border-t border-rose-200/80">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-rose-600" />
                          <span>Rejected by: <strong className="text-slate-800">{report.rejection?.rejectedByAdmin || 'Command Officer'}</strong> ({report.rejection?.agency || report.selectedAgency})</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Archived at: <strong className="text-slate-800">{new Date(report.rejection?.rejectedAt || report.updatedAt).toLocaleString()}</strong></span>
                        </span>
                      </div>
                    </div>
                  )
                )}

                {/* Resolution Summary Box (for Resolved) */}
                {!isRejected && (
                  <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs space-y-2 text-emerald-950">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Incident Cleared & Successfully Resolved:</span>
                    </div>
                    <p className="text-slate-700 pl-6 text-xs leading-relaxed">
                      Incident response completed. All field teams returned to base.
                    </p>
                    <div className="text-[11px] text-slate-500 pl-6 pt-1 border-t border-emerald-200/80">
                      <span>Completed at: <strong className="text-slate-800">{new Date(report.updatedAt).toLocaleString()}</strong></span>
                    </div>
                  </div>
                )}

                {/* Location and Resident info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-900 font-bold block">{report.barangay}, {report.municipality || 'Calapan City'}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{report.locationDetails}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      {(() => {
                        const isOwner = Boolean(
                          (residentUser?.id && report.residentId === residentUser.id) ||
                          (residentUser?.name && report.residentName.toLowerCase() === residentUser.name.toLowerCase()) ||
                          (residentUser?.email && report.residentEmail && report.residentEmail.toLowerCase() === residentUser.email.toLowerCase())
                        );
                        const canViewReporter = isAgencyAdmin || isOwner;
                        if (canViewReporter) {
                          return (
                            <>
                              <span className="text-slate-900 font-bold block">Citizen: {report.residentName}</span>
                              <span className="block text-[11px] text-slate-500">{report.residentPhone}</span>
                            </>
                          );
                        }
                        return (
                          <>
                            <span className="text-slate-900 font-bold block">Citizen: Verified Informant (Protected)</span>
                            <span className="block text-[11px] text-slate-400">•••••••••••• (Confidential Contact)</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-2">
                  {onSelectReport && (
                    <button
                      onClick={() => onSelectReport(report.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Action Timeline & Details</span>
                    </button>
                  )}

                  {isRejected && (
                    <button
                      onClick={() => handleRestore(report.id)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition ml-auto cursor-pointer"
                      title="Restore report back to pending verification queue"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore to Active Registry</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls Bar */}
      {totalReports > 0 && (
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900 font-bold">{startIndex + 1}</strong> to{' '}
              <strong className="text-slate-900 font-bold">{Math.min(startIndex + pageSize, totalReports)}</strong> of{' '}
              <strong className="text-slate-900 font-bold">{totalReports}</strong> archived cases
            </span>
            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                currentPage === 1
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="text-xs font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                currentPage === totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
