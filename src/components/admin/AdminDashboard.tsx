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
import { AgencyLogo } from '../common/AgencyLogo';
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
      {/* Agency Command Banner - Luminous Frosted Neo-Aero Glass */}
      <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className={`p-2.5 sm:p-3 rounded-2xl shadow-sm border flex items-center justify-center shrink-0 w-16 h-16 sm:w-18 sm:h-18 bg-white/95 ${
              agency === 'CENTRAL' ? 'border-purple-200 shadow-purple-500/10' :
              agency === 'PNP' ? 'border-blue-200 shadow-blue-500/10' :
              agency === 'BFP' ? 'border-orange-200 shadow-orange-500/10' :
              'border-emerald-200 shadow-emerald-500/10'
            }`}>
              <AgencyLogo
                agency={agency}
                className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-sm"
                animate
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] sm:text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                  agency === 'CENTRAL' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  agency === 'PNP' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  agency === 'BFP' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {agencyInfo.badge}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-mono font-semibold">
                  Station: {adminProfile.badgeNumber}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                {language === 'fil' ? agencyInfo.fullNameFil : agencyInfo.fullNameEn}
              </h1>
              <p className="text-xs text-slate-500 max-w-2xl mt-0.5 hidden xs:block line-clamp-2 sm:line-clamp-none">
                {language === 'fil' ? agencyInfo.descriptionFil : agencyInfo.descriptionEn}
              </p>
            </div>
          </div>

          {/* Commander, Hotline info & Profile Settings Button (Responsive Grid on Mobile) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-between w-full lg:w-auto gap-2.5 sm:gap-3.5 bg-slate-50/90 border border-slate-200/80 p-3.5 rounded-2xl text-xs sm:text-sm shrink-0 shadow-xs">
            <div className="min-w-0">
              <span className="text-xs text-slate-500 block uppercase font-bold">
                Duty Officer:
              </span>
              <span className="font-black text-slate-900 block truncate text-xs sm:text-sm">
                {adminProfile?.name || (agency === 'CENTRAL' && agencyUser ? agencyUser.name : 'Duty Officer')}
              </span>
              <span className="text-xs text-indigo-700 font-mono font-bold block truncate">
                {adminProfile?.title || (agency === 'CENTRAL' && agencyUser ? agencyUser.email : 'Command Staff')}
              </span>
            </div>
            <div className="border-l border-slate-200 pl-3 min-w-0">
              <span className="text-xs text-slate-500 block uppercase font-bold flex items-center gap-1 truncate">
                <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">Hotline:</span>
              </span>
              <span className="font-mono font-black text-red-600 text-sm sm:text-base block truncate">
                {agencyDetails[agency]?.hotline || agencyInfo.hotline}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2.5 sm:pt-0 sm:pl-3">
              <button
                onClick={openAgencyProfileModal}
                className="w-full sm:w-auto justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 min-h-[40px]"
                title="Edit department profile, change password, update duty officer & hotlines"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Profile Settings</span>
                <span className="sm:hidden">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs with Smooth Horizontal Mobile Scrolling */}
      <div ref={tabContentRef} className="overflow-x-auto no-scrollbar pb-0.5 scroll-mt-20 scroll-smooth">
        <div className="glass-card-subtle bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 flex items-center gap-1.5 min-w-max shadow-sm">
          {/* Department Specialized Command Console */}
          <button
            onClick={() => setActiveTab('command')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer min-h-[42px] shrink-0 ${
              activeTab === 'command'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-100 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            }`}
          >
            <AgencyLogo agency={agency} className="w-4 h-4 object-contain" animate />
            <span>
              {agency === 'CENTRAL'
                ? 'Joint Operations Command'
                : agency === 'PNP'
                ? 'Police Operations'
                : agency === 'BFP'
                ? 'Fire Dispatch'
                : 'Disaster Operations'}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-indigo-50 text-indigo-700 font-black uppercase tracking-wider border border-indigo-200">
              Live
            </span>
          </button>

          {/* Active Reports Registry */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer min-h-[42px] shrink-0 ${
              activeTab === 'reports'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-100 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            }`}
          >
            <ListFilter className="w-4 h-4 text-blue-600" />
            <span>{t.tabActiveReports}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200/60 font-mono font-bold">
              {activeReportsCount}
            </span>
          </button>

          {/* Map & Heatmap */}
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer min-h-[42px] shrink-0 ${
              activeTab === 'map'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-100 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            }`}
          >
            <Map className="w-4 h-4 text-emerald-600" />
            <span>{t.tabMapHeatmap}</span>
          </button>

          {/* Statistics & Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer min-h-[42px] shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-100 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>{t.tabStatistics}</span>
          </button>

          {/* Inter-Agency Coordination */}
          <button
            onClick={() => setActiveTab('coordination')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer min-h-[42px] shrink-0 ${
              activeTab === 'coordination'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-100 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>{t.tabCoordination}</span>
            {incomingCoordCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black animate-bounce shadow-xs">
                {incomingCoordCount}
              </span>
            )}
          </button>

          {/* Emergency Archive */}
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer min-h-[42px] shrink-0 ${
              activeTab === 'archive'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-100 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            }`}
          >
            <Archive className="w-4 h-4 text-rose-600" />
            <span>Emergency Archive</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-200/60 font-mono font-bold">
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
