import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { Agency } from '../../types';
import { AGENCY_DETAILS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
import { ReportTable } from './ReportTable';
import { IncidentMapView } from '../map/IncidentMapView';
import { AnalyticsView } from './AnalyticsView';
import { InterAgencyCoordination } from './InterAgencyCoordination';
import { RejectedReportsArchive } from './RejectedReportsArchive';
import { ReportDetailModal } from './ReportDetailModal';
import {
  ShieldAlert,
  Flame,
  Activity,
  ListFilter,
  Map,
  BarChart3,
  Users,
  Archive,
  Phone,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';

interface Props {
  agency: Agency;
  selectedReportId?: string | null;
  onSelectReport?: (id: string | null) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  agency,
  selectedReportId: propSelectedReportId,
  onSelectReport: propOnSelectReport,
}) => {
  const { adminProfiles, reports, language, simulateIncomingIncident } = useNexus();
  const t = TRANSLATIONS[language];

  const [activeTab, setActiveTab] = useState<'reports' | 'map' | 'analytics' | 'coordination' | 'archive'>('reports');
  const [internalSelectedReportId, setInternalSelectedReportId] = useState<string | null>(null);

  const selectedReportId = propSelectedReportId !== undefined ? propSelectedReportId : internalSelectedReportId;
  const setSelectedReportId = (id: string | null) => {
    if (propOnSelectReport) propOnSelectReport(id);
    setInternalSelectedReportId(id);
  };

  const agencyInfo = AGENCY_DETAILS[agency];
  const adminProfile = adminProfiles[agency];

  // Incident counts in centralized database
  const activeReportsCount = reports.filter((r) => r.status !== 'Rejected').length;
  const pendingCount = reports.filter((r) => r.status === 'Pending Verification').length;
  const rejectedCount = reports.filter((r) => r.status === 'Rejected').length;

  // Inter-agency assistance count directed to this agency
  const incomingCoordCount = reports.reduce((acc, rep) => {
    const matching = rep.assistanceRequests.filter(
      (req) => req.targetAgencies.includes(agency) && !req.acknowledgments.some((a) => a.agency === agency)
    );
    return acc + matching.length;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Agency Command Banner */}
      <div
        className={`bg-gradient-to-r ${agencyInfo.bgGrad} border ${agencyInfo.border} rounded-2xl p-5 shadow-2xl relative overflow-hidden`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-700/80 shadow-inner flex items-center justify-center">
              {agency === 'PNP' && <ShieldAlert className="w-8 h-8 text-blue-400 animate-pulse" />}
              {agency === 'BFP' && <Flame className="w-8 h-8 text-orange-400 animate-pulse" />}
              {agency === 'MDRRMO' && <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                  {agencyInfo.badge}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Station: {adminProfile.badgeNumber}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {language === 'fil' ? agencyInfo.fullNameFil : agencyInfo.fullNameEn}
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                {language === 'fil' ? agencyInfo.descriptionFil : agencyInfo.descriptionEn}
              </p>
            </div>
          </div>

          {/* Commander & Hotline info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Duty Officer:
              </span>
              <span className="font-bold text-white block">{adminProfile.name}</span>
              <span className="text-[10px] text-slate-400">{adminProfile.title}</span>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
              <span className="text-[10px] text-slate-400 block uppercase font-bold flex items-center gap-1">
                <Phone className="w-3 h-3 text-red-400" />
                Hotline:
              </span>
              <span className="font-mono font-bold text-red-300">{agencyInfo.hotline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {/* Active Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <ListFilter className="w-4 h-4 text-blue-400" />
            <span>{t.tabActiveReports}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-slate-300 font-mono">
              {activeReportsCount}
            </span>
          </button>

          {/* Map & Heatmap */}
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'map'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>{t.tabMapHeatmap}</span>
          </button>

          {/* Statistics & Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>{t.tabStatistics}</span>
          </button>

          {/* Inter-Agency Coordination */}
          <button
            onClick={() => setActiveTab('coordination')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'coordination'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>{t.tabCoordination}</span>
            {incomingCoordCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold animate-bounce">
                {incomingCoordCount}
              </span>
            )}
          </button>

          {/* Rejected Reports Archive */}
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Archive className="w-4 h-4 text-rose-400" />
            <span>{t.tabArchive}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono">
              {rejectedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'reports' && (
          <ReportTable onSelectReport={(id) => setSelectedReportId(id)} />
        )}

        {activeTab === 'map' && (
          <IncidentMapView onSelectReport={(id) => setSelectedReportId(id)} />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'coordination' && (
          <InterAgencyCoordination onSelectReport={(id) => setSelectedReportId(id)} />
        )}

        {activeTab === 'archive' && (
          <RejectedReportsArchive onSelectReport={(id) => setSelectedReportId(id)} />
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          isOpen={!!selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
};
