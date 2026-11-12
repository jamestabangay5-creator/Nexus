import React, { useState, useMemo } from 'react';
import { useNexus } from '../../context/NexusContext';
import { IncidentReport, Agency } from '../../types';
import { INCIDENT_TYPES, BARANGAYS } from '../../constants/incidentData';
import { ALL_UNIQUE_ORIENTAL_MINDORO_BARANGAYS } from '../../constants/orientalMindoroData';
import { TRANSLATIONS } from '../../constants/translations';
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
  CheckCircle2
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
  } = useNexus();

  const t = TRANSLATIONS[language];
  const currentAgency: Agency = activeRole === 'resident' ? 'PNP' : (activeRole as Agency);
  const currentAdmin = adminProfiles[currentAgency];

  const [search, setSearch] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('ALL');
  const [archiveFilter, setArchiveFilter] = useState<'ALL' | 'Rejected' | 'Resolved'>('ALL');

  const totalRejected = reports.filter((r) => r.status === 'Rejected').length;
  const totalResolved = reports.filter((r) => r.status === 'Resolved').length;

  // Filter archived reports (both Rejected and Resolved incidents) - sorted descending (newest on top)
  const archivedReports = useMemo(() => {
    return reports
      .filter((r) => r.status === 'Rejected' || r.status === 'Resolved')
      .filter((r) => {
        if (archiveFilter !== 'ALL' && r.status !== archiveFilter) return false;
        if (selectedBarangay !== 'ALL' && r.barangay !== selectedBarangay) return false;
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
  }, [reports, archiveFilter, selectedBarangay, search]);

  const handleRestore = (reportId: string) => {
    restoreRejectedReport(
      reportId,
      currentAdmin?.name || `${currentAgency} Officer`,
      currentAgency
    );
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

        <div className="flex items-center gap-2">
          <div className="text-xs bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80 text-slate-700 font-mono font-bold">
            <span>{archivedReports.length} Cases in Archive</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search archive by code, keyword, citizen, officer, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Barangays</option>
            {ALL_UNIQUE_ORIENTAL_MINDORO_BARANGAYS.map((brgy, idx) => (
              <option key={`arch-brgy-${brgy}-${idx}`} value={brgy}>
                {brgy}
              </option>
            ))}
          </select>
        </div>

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
        {archivedReports.length === 0 ? (
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
          archivedReports.map((report) => {
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

                {/* Documented Rejection Reason Box (for Rejected) */}
                {isRejected && (
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
                      <span className="text-slate-900 font-bold">Citizen: {report.residentName}</span>
                      <span className="block text-[11px] text-slate-500">{report.residentPhone}</span>
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
    </div>
  );
};
