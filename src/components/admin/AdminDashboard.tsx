import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { Agency, AgencyScope } from '../../types';
import { AGENCY_DETAILS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
import { ReportTable } from './ReportTable';
import { IncidentMapView } from '../map/IncidentMapView';
import { AnalyticsView } from './AnalyticsView';
import { InterAgencyCoordination } from './InterAgencyCoordination';
import { RejectedReportsArchive } from './RejectedReportsArchive';
import { ReportDetailModal } from './ReportDetailModal';
import { PnpDashboardView } from './agency/PnpDashboardView';
import { BfpDashboardView } from './agency/BfpDashboardView';
import { MdrrmoDashboardView } from './agency/MdrrmoDashboardView';
import { CentralDashboardView } from './agency/CentralDashboardView';
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
  Sparkles,
  Shield,
  LayoutDashboard,
  Settings
} from 'lucide-react';

interface Props {
  agency: AgencyScope;
  selectedReportId?: string | null;
  onSelectReport?: (id: string | null) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  agency,
  selectedReportId: propSelectedReportId,
  onSelectReport: propOnSelectReport,
}) => {
  const {
    adminProfiles,
    agencyDetails,
    openAgencyProfileModal,
    reports,
    language,
    simulateIncomingIncident,
    agencyUser,
    setActiveRole,
    agencyActiveTab,
    setAgencyActiveTab,
  } = useNexus();
  const t = TRANSLATIONS[language];

  const activeTab = agencyActiveTab;
  const setActiveTab = setAgencyActiveTab;
  const tabContentRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll on mobile when tab changes from bottom navigation
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [agencyActiveTab]);

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
  const archivedCount = reports.filter((r) => r.status === 'Rejected' || r.status === 'Resolved').length;

  // Inter-agency assistance count directed to this agency (or all pending requests for CENTRAL)
  const incomingCoordCount = reports.reduce((acc, rep) => {
    if (agency === 'CENTRAL') {
      const pending = rep.assistanceRequests.filter((req) => req.status === 'Pending');
      return acc + pending.length;
    }
    const matching = rep.assistanceRequests.filter(
      (req) => req.targetAgencies.includes(agency as Agency) && !req.acknowledgments.some((a) => a.agency === agency)
    );
    return acc + matching.length;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Agency Command Banner */}
      <div
        className={`bg-gradient-to-r ${agencyInfo.bgGrad} border ${agencyInfo.border} rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/85 border border-slate-700/80 shadow-inner flex items-center justify-center shrink-0">
              {agency === 'CENTRAL' && <Radio className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400 animate-pulse" />}
              {agency === 'PNP' && <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400 animate-pulse" />}
              {agency === 'BFP' && <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-orange-400 animate-pulse" />}
              {agency === 'MDRRMO' && <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 animate-pulse" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                  {agencyInfo.badge}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-300 font-mono">
                  Station: {adminProfile.badgeNumber}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-1">
                {language === 'fil' ? agencyInfo.fullNameFil : agencyInfo.fullNameEn}
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-0.5 hidden xs:block line-clamp-2 sm:line-clamp-none">
                {language === 'fil' ? agencyInfo.descriptionFil : agencyInfo.descriptionEn}
              </p>
            </div>
          </div>

          {/* Commander, Hotline info & Profile Settings Button */}
          <div className="flex flex-row items-center justify-between w-full lg:w-auto gap-3 bg-slate-950/85 border border-slate-800 p-3 rounded-xl text-xs shrink-0 flex-wrap sm:flex-nowrap">
            <div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-bold">
                Duty Officer:
              </span>
              <span className="font-bold text-white block truncate max-w-[140px]">
                {adminProfile?.name || (agency === 'CENTRAL' && agencyUser ? agencyUser.name : 'Duty Officer')}
              </span>
              <span className="text-[10px] text-purple-300 font-mono block truncate max-w-[140px]">
                {adminProfile?.title || (agency === 'CENTRAL' && agencyUser ? agencyUser.email : 'Command Staff')}
              </span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-bold flex items-center gap-1">
                <Phone className="w-3 h-3 text-red-400" />
                Emergency Hotline:
              </span>
              <span className="font-mono font-bold text-red-300 text-sm sm:text-base">
                {agencyDetails[agency]?.hotline || agencyInfo.hotline}
              </span>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <button
                onClick={openAgencyProfileModal}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md hover:scale-[1.02]"
                title="Edit department profile, change password, update duty officer & hotlines"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profile Settings</span>
                <span className="sm:hidden">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs with Smooth Horizontal Mobile Scrolling */}
      <div ref={tabContentRef} className="border-b border-slate-800 overflow-x-auto no-scrollbar pb-0.5 scroll-mt-20">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          {/* Department Specialized Command Console */}
          <button
            onClick={() => setActiveTab('command')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer min-h-[42px] ${
              activeTab === 'command'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm ring-1 ring-purple-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            {agency === 'CENTRAL' && <Radio className="w-4 h-4 text-purple-400 animate-pulse" />}
            {agency === 'PNP' && <ShieldAlert className="w-4 h-4 text-blue-400 animate-pulse" />}
            {agency === 'BFP' && <Flame className="w-4 h-4 text-orange-400 animate-pulse" />}
            {agency === 'MDRRMO' && <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />}
            <span>
              {agency === 'CENTRAL'
                ? 'Joint Operations Command'
                : agency === 'PNP'
                ? 'Police Operations'
                : agency === 'BFP'
                ? 'Fire Dispatch'
                : 'Disaster Operations'}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-purple-950 text-purple-300 font-bold uppercase tracking-wider border border-purple-500/30">
              Live
            </span>
          </button>

          {/* Active Reports Registry */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer min-h-[42px] ${
              activeTab === 'reports'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm ring-1 ring-blue-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <ListFilter className="w-4 h-4 text-blue-400" />
            <span>{t.tabActiveReports}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950 text-slate-300 font-mono font-bold">
              {activeReportsCount}
            </span>
          </button>

          {/* Map & Heatmap */}
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer min-h-[42px] ${
              activeTab === 'map'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm ring-1 ring-emerald-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>{t.tabMapHeatmap}</span>
          </button>

          {/* Statistics & Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer min-h-[42px] ${
              activeTab === 'analytics'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm ring-1 ring-indigo-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>{t.tabStatistics}</span>
          </button>

          {/* Inter-Agency Coordination */}
          <button
            onClick={() => setActiveTab('coordination')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer min-h-[42px] ${
              activeTab === 'coordination'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm ring-1 ring-amber-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>{t.tabCoordination}</span>
            {incomingCoordCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold animate-bounce">
                {incomingCoordCount}
              </span>
            )}
          </button>

          {/* Emergency Archive */}
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer min-h-[42px] ${
              activeTab === 'archive'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm ring-1 ring-rose-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Archive className="w-4 h-4 text-rose-400" />
            <span>Emergency Archive</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono font-bold">
              {archivedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'command' && (
          agency === 'PNP' ? (
            <PnpDashboardView
              onSelectReport={(id) => setSelectedReportId(id)}
              onRequestAssistance={() => setActiveTab('coordination')}
            />
          ) : agency === 'BFP' ? (
            <BfpDashboardView
              onSelectReport={(id) => setSelectedReportId(id)}
              onRequestAssistance={() => setActiveTab('coordination')}
            />
          ) : agency === 'MDRRMO' ? (
            <MdrrmoDashboardView
              onSelectReport={(id) => setSelectedReportId(id)}
              onRequestAssistance={() => setActiveTab('coordination')}
            />
          ) : (
            <CentralDashboardView
              onSelectReport={(id) => setSelectedReportId(id)}
              onRequestAssistance={() => setActiveTab('coordination')}
              onSwitchAgencyView={(targetAgency) => {
                setActiveRole(targetAgency);
              }}
            />
          )
        )}

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
