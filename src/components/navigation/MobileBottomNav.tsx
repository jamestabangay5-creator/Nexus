import React from 'react';
import { useNexus } from '../../context/NexusContext';
import { AgencyScope, Agency } from '../../types';
import { AgencyLogo } from '../common/AgencyLogo';
import {
  AlertTriangle,
  FileText,
  MapPin,
  Map,
  Phone,
  User,
  Settings,
  ListFilter,
  Users,
  Home,
  LogIn,
  Archive
} from 'lucide-react';

interface Props {
  onOpenProfile?: () => void;
  onToggleGlobalMap?: () => void;
  isGlobalMapActive?: boolean;
}

export const MobileBottomNav: React.FC<Props> = ({
  onOpenProfile,
  onToggleGlobalMap,
  isGlobalMapActive = false,
}) => {
  const {
    portalMode,
    activeRole,
    residentActiveTab,
    setResidentActiveTab,
    agencyActiveTab,
    setAgencyActiveTab,
    triggerScrollToReportForm,
    openHotlinesModal,
    openAgencyProfileModal,
    openAuthModal,
    setPortalMode,
    reports,
    residentUser,
    firebaseUser,
    agencyUser,
    isAgencyProfileModalOpen
  } = useNexus();

  // Resident's filed reports count
  const myReportsCount = reports.filter(
    (r) => r.residentId === residentUser?.id || r.residentName === residentUser?.name
  ).length;

  // Active reports count for agency
  const activeReportsCount = reports.filter((r) => r.status !== 'Rejected').length;

  // Incoming coordination requests for agency
  const currentAgency = activeRole === 'resident' ? 'CENTRAL' : (activeRole as AgencyScope);
  const incomingCoordCount = reports.reduce((acc, rep) => {
    if (currentAgency === 'CENTRAL') {
      const pending = rep.assistanceRequests.filter((req) => req.status === 'Pending');
      return acc + pending.length;
    }
    const matching = rep.assistanceRequests.filter(
      (req) => req.targetAgencies.includes(currentAgency as Agency) && !req.acknowledgments.some((a) => a.agency === currentAgency)
    );
    return acc + matching.length;
  }, 0);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-4px_30px_rgba(148,163,184,0.25)] px-1.5 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom,0.5rem))] transition-all text-slate-600 select-none"
      aria-label="Mobile Bottom Navigation"
    >
      {/* RESIDENT CITIZEN PORTAL MODE */}
      {portalMode === 'resident' && (
        <div className="grid grid-cols-5 items-center justify-items-center gap-1">
          {/* 1. Track Reports */}
          <button
            onClick={() => setResidentActiveTab('tracking')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              residentActiveTab === 'tracking'
                ? 'bg-blue-50/90 text-blue-700 font-black border border-blue-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
          >
            {residentActiveTab === 'tracking' && (
              <span className="w-5 h-1 rounded-full bg-blue-600 -mt-0.5 mb-0.5 shadow-xs" />
            )}
            <div className="relative">
              <FileText className={`w-5 h-5 ${residentActiveTab === 'tracking' ? 'text-blue-600 scale-105' : 'text-slate-500'} transition-transform`} />
              {myReportsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-blue-600 text-white rounded-full font-mono text-[9px] font-bold shadow-xs">
                  {myReportsCount}
                </span>
              )}
            </div>
            <span className={`text-xs leading-tight ${residentActiveTab === 'tracking' ? 'font-black' : 'font-bold'}`}>
              Tracking
            </span>
          </button>

          {/* 2. Live Map */}
          <button
            onClick={() => setResidentActiveTab('map')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              residentActiveTab === 'map'
                ? 'bg-emerald-50/90 text-emerald-700 font-black border border-emerald-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
          >
            {residentActiveTab === 'map' && (
              <span className="w-5 h-1 rounded-full bg-emerald-600 -mt-0.5 mb-0.5 shadow-xs" />
            )}
            <MapPin className={`w-5 h-5 ${residentActiveTab === 'map' ? 'text-emerald-600 scale-105' : 'text-slate-500'} transition-transform`} />
            <span className={`text-xs leading-tight ${residentActiveTab === 'map' ? 'font-black' : 'font-bold'}`}>
              Live Map
            </span>
          </button>

          {/* 3. Center: 🚨 Send Report (Hero Elevated only when active, clean action when inactive) */}
          <button
            onClick={triggerScrollToReportForm}
            className={`flex flex-col items-center justify-center transition cursor-pointer group ${
              residentActiveTab === 'report' ? '-translate-y-2.5' : ''
            }`}
            title="File Emergency Report Immediately"
          >
            {residentActiveTab === 'report' ? (
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 via-red-600 to-indigo-600 border-4 border-white shadow-xl shadow-rose-500/40 flex items-center justify-center text-white active:scale-95 group-hover:scale-105 transition">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/90 shadow-xs flex items-center justify-center active:scale-95 group-hover:bg-rose-100 transition">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
            )}
            <span className={`text-xs mt-0.5 uppercase tracking-tight ${
              residentActiveTab === 'report' ? 'font-black text-rose-600' : 'font-bold text-rose-600/90'
            }`}>
              Report Emergency
            </span>
          </button>

          {/* 4. Hotlines */}
          <button
            onClick={openHotlinesModal}
            className="flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center text-slate-500 hover:text-rose-600 hover:bg-slate-50/60 rounded-2xl min-h-[46px] transition cursor-pointer"
          >
            <Phone className="w-5 h-5 text-rose-500" />
            <span className="text-xs leading-tight font-bold">Hotlines</span>
          </button>

          {/* 5. My Profile */}
          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 rounded-2xl min-h-[46px] transition cursor-pointer"
          >
            <User className="w-5 h-5 text-slate-600" />
            <span className="text-xs leading-tight font-bold">Profile</span>
          </button>
        </div>
      )}

      {/* AGENCY COMMAND MODE */}
      {portalMode === 'agency' && (
        <div className="grid grid-cols-6 items-center justify-items-center gap-1">
          {/* 1. Command Operations */}
          <button
            onClick={() => setAgencyActiveTab('command')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              agencyActiveTab === 'command'
                ? 'bg-blue-50/90 text-blue-700 font-black border border-blue-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
          >
            {agencyActiveTab === 'command' && (
              <span className="w-5 h-1 rounded-full bg-blue-600 -mt-0.5 mb-0.5 shadow-xs" />
            )}
            <AgencyLogo agency={currentAgency} className="w-5 h-5 object-contain" animate={agencyActiveTab === 'command'} />
            <span className={`text-[11px] leading-tight truncate max-w-full ${agencyActiveTab === 'command' ? 'font-black' : 'font-bold'}`}>
              Command
            </span>
          </button>

          {/* 2. Reports Queue */}
          <button
            onClick={() => setAgencyActiveTab('reports')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              agencyActiveTab === 'reports'
                ? 'bg-blue-50/90 text-blue-700 font-black border border-blue-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
          >
            {agencyActiveTab === 'reports' && (
              <span className="w-5 h-1 rounded-full bg-blue-600 -mt-0.5 mb-0.5 shadow-xs" />
            )}
            <div className="relative">
              <ListFilter className={`w-5 h-5 ${agencyActiveTab === 'reports' ? 'text-blue-600 scale-105' : 'text-slate-500'} transition-transform`} />
              {activeReportsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-blue-600 text-white rounded-full font-mono text-[9px] font-bold shadow-xs">
                  {activeReportsCount}
                </span>
              )}
            </div>
            <span className={`text-[11px] leading-tight truncate max-w-full ${agencyActiveTab === 'reports' ? 'font-black' : 'font-bold'}`}>
              Queue
            </span>
          </button>

          {/* 3. Mutual Aid Coordination (Dynamic highlighting - only elevated/highlighted when ACTIVE) */}
          <button
            onClick={() => setAgencyActiveTab('coordination')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              agencyActiveTab === 'coordination'
                ? 'bg-indigo-50/90 text-indigo-700 font-black border border-indigo-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
            title="Inter-Agency Mutual Aid Coordination"
          >
            {agencyActiveTab === 'coordination' && (
              <span className="w-5 h-1 rounded-full bg-indigo-600 -mt-0.5 mb-0.5 shadow-xs" />
            )}
            <div className="relative">
              <Users className={`w-5 h-5 ${agencyActiveTab === 'coordination' ? 'text-indigo-600 scale-105' : 'text-slate-500'} transition-transform`} />
              {incomingCoordCount > 0 && (
                <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {incomingCoordCount}
                </span>
              )}
            </div>
            <span className={`text-[11px] leading-tight truncate max-w-full ${agencyActiveTab === 'coordination' ? 'font-black text-indigo-700' : 'font-bold text-slate-600'}`}>
              Mutual Aid
            </span>
          </button>

          {/* 4. Live GIS Map */}
          <button
            onClick={() => setAgencyActiveTab('map')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              agencyActiveTab === 'map'
                ? 'bg-emerald-50/90 text-emerald-700 font-black border border-emerald-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
          >
            {agencyActiveTab === 'map' && (
              <span className="w-5 h-1 rounded-full bg-emerald-600 -mt-0.5 mb-0.5 shadow-xs" />
            )}
            <Map className={`w-5 h-5 ${agencyActiveTab === 'map' ? 'text-emerald-600 scale-105' : 'text-slate-500'} transition-transform`} />
            <span className={`text-[11px] leading-tight truncate max-w-full ${agencyActiveTab === 'map' ? 'font-black' : 'font-bold'}`}>
              GIS Map
            </span>
          </button>

          {/* 5. Archive */}
          <button
            onClick={() => setAgencyActiveTab('archive')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              agencyActiveTab === 'archive'
                ? 'bg-rose-50/90 text-rose-700 font-black border border-rose-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
          >
            {agencyActiveTab === 'archive' && (
              <span className="w-5 h-1 rounded-full bg-rose-600 -mt-0.5 mb-0.5 shadow-xs" />
            )}
            <Archive className={`w-5 h-5 ${agencyActiveTab === 'archive' ? 'text-rose-600 scale-105' : 'text-slate-500'} transition-transform`} />
            <span className={`text-[11px] leading-tight truncate max-w-full ${agencyActiveTab === 'archive' ? 'font-black' : 'font-bold'}`}>
              Archive
            </span>
          </button>

          {/* 6. Department Settings & Profile */}
          <button
            onClick={openAgencyProfileModal}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              isAgencyProfileModalOpen
                ? 'bg-slate-100 text-slate-900 font-black border border-slate-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
          >
            <Settings className="w-5 h-5 text-blue-600" />
            <span className="text-[11px] leading-tight truncate max-w-full font-bold">
              Settings
            </span>
          </button>
        </div>
      )}

      {/* LANDING PAGE MODE */}
      {portalMode === 'landing' && (
        <div className="grid grid-cols-5 items-center justify-items-center gap-1">
          {/* 1. Home */}
          <button
            onClick={() => {
              if (isGlobalMapActive && onToggleGlobalMap) {
                onToggleGlobalMap();
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              !isGlobalMapActive
                ? 'bg-blue-50/90 text-blue-700 font-black border border-blue-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
          >
            {!isGlobalMapActive && (
              <span className="w-5 h-1 rounded-full bg-blue-600 -mt-0.5 mb-0.5 shadow-xs" />
            )}
            <Home className={`w-5 h-5 ${!isGlobalMapActive ? 'text-blue-600 scale-105' : 'text-slate-500'} transition-transform`} />
            <span className={`text-[10px] leading-tight ${!isGlobalMapActive ? 'font-black' : 'font-medium'}`}>
              Home
            </span>
          </button>

          {/* 2. Global GIS Map */}
          <button
            onClick={onToggleGlobalMap}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center transition cursor-pointer relative rounded-2xl min-h-[46px] ${
              isGlobalMapActive
                ? 'bg-emerald-50/90 text-emerald-700 font-black border border-emerald-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 font-medium'
            }`}
          >
            {isGlobalMapActive && (
              <span className="w-5 h-1 rounded-full bg-emerald-600 -mt-0.5 mb-0.5 shadow-xs" />
            )}
            <Map className={`w-5 h-5 ${isGlobalMapActive ? 'text-emerald-600 scale-105' : 'text-slate-500'} transition-transform`} />
            <span className={`text-[10px] leading-tight ${isGlobalMapActive ? 'font-black' : 'font-medium'}`}>
              Live Map
            </span>
          </button>

          {/* 3. Center: 🚨 Report 911 */}
          <button
            onClick={() => {
              if (firebaseUser) {
                setPortalMode('resident');
              } else {
                openAuthModal('login');
              }
            }}
            className="flex flex-col items-center justify-center transition cursor-pointer group"
            title="Report Emergency"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 text-white shadow-md shadow-blue-500/30 flex items-center justify-center active:scale-95 group-hover:scale-105 transition">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-rose-600 mt-0.5 uppercase tracking-tight">
              Report Emergency
            </span>
          </button>

          {/* 4. Hotlines */}
          <button
            onClick={openHotlinesModal}
            className="flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center text-slate-500 hover:text-rose-600 hover:bg-slate-50/60 rounded-2xl min-h-[46px] transition cursor-pointer"
          >
            <Phone className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] leading-tight font-medium">Hotlines</span>
          </button>

          {/* 5. Sign In */}
          <button
            onClick={() => {
              if (agencyUser) {
                setPortalMode('agency');
              } else if (firebaseUser) {
                setPortalMode('resident');
              } else {
                openAuthModal('login');
              }
            }}
            className="flex flex-col items-center justify-center gap-0.5 w-full py-1 text-center text-slate-500 hover:text-slate-900 hover:bg-slate-50/60 rounded-2xl min-h-[46px] transition cursor-pointer"
          >
            {agencyUser || firebaseUser ? (
              <User className="w-5 h-5 text-emerald-600" />
            ) : (
              <LogIn className="w-5 h-5 text-blue-600" />
            )}
            <span className="text-[10px] leading-tight font-medium">
              {agencyUser ? 'Console' : firebaseUser ? 'Portal' : 'Sign In'}
            </span>
          </button>
        </div>
      )}
    </nav>
  );
};
