import React from 'react';
import { useNexus } from '../../context/NexusContext';
import { AgencyScope, Agency } from '../../types';
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
  Radio,
  ShieldAlert,
  Flame,
  Activity,
  Home,
  LogIn,
  Send,
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
    agencyUser
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

  // Agency icon helper
  const getAgencyIcon = (role: AgencyScope) => {
    switch (role) {
      case 'PNP':
        return ShieldAlert;
      case 'BFP':
        return Flame;
      case 'MDRRMO':
        return Activity;
      case 'CENTRAL':
      default:
        return Radio;
    }
  };

  const AgencyIcon = getAgencyIcon(currentAgency);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 shadow-[0_-4px_25px_rgba(0,0,0,0.7)] px-2 pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom,0.5rem))] transition-all"
      aria-label="Mobile Bottom Navigation"
    >
      {/* RESIDENT CITIZEN PORTAL MODE */}
      {portalMode === 'resident' && (
        <div className="grid grid-cols-5 items-end justify-items-center">
          {/* 1. Track Reports */}
          <button
            onClick={() => setResidentActiveTab('tracking')}
            className={`flex flex-col items-center justify-center gap-1 w-full py-1 text-center transition cursor-pointer relative ${
              residentActiveTab === 'tracking' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <FileText className="w-5 h-5" />
              {myReportsCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-purple-600 text-white rounded-full font-mono text-[9px] font-bold">
                  {myReportsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none">Tracking</span>
          </button>

          {/* 2. Live Map */}
          <button
            onClick={() => setResidentActiveTab('map')}
            className={`flex flex-col items-center justify-center gap-1 w-full py-1 text-center transition cursor-pointer ${
              residentActiveTab === 'map' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] leading-none">Live Map</span>
          </button>

          {/* 3. Center Elevated: 🚨 Send Report */}
          <button
            onClick={triggerScrollToReportForm}
            className="flex flex-col items-center justify-center -translate-y-3.5 group cursor-pointer"
            title="File Emergency Report Immediately"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-purple-600 border-4 border-slate-950 shadow-xl shadow-red-950/80 flex items-center justify-center text-white active:scale-95 group-hover:scale-105 transition">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-rose-300 mt-1 uppercase tracking-tight">
              Report 911
            </span>
          </button>

          {/* 4. Hotlines */}
          <button
            onClick={openHotlinesModal}
            className="flex flex-col items-center justify-center gap-1 w-full py-1 text-center text-slate-400 hover:text-red-400 transition cursor-pointer"
          >
            <Phone className="w-5 h-5 text-red-400" />
            <span className="text-[10px] leading-none">Hotlines</span>
          </button>

          {/* 5. My Profile */}
          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center gap-1 w-full py-1 text-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] leading-none">Profile</span>
          </button>
        </div>
      )}

      {/* AGENCY COMMAND MODE */}
      {portalMode === 'agency' && (
        <div className="grid grid-cols-6 items-end justify-items-center">
          {/* 1. Command Operations */}
          <button
            onClick={() => setAgencyActiveTab('command')}
            className={`flex flex-col items-center justify-center gap-1 w-full py-1 text-center transition cursor-pointer ${
              agencyActiveTab === 'command' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AgencyIcon className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] leading-none">Command</span>
          </button>

          {/* 2. Reports Queue */}
          <button
            onClick={() => setAgencyActiveTab('reports')}
            className={`flex flex-col items-center justify-center gap-1 w-full py-1 text-center transition cursor-pointer relative ${
              agencyActiveTab === 'reports' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <ListFilter className="w-5 h-5" />
              {activeReportsCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-blue-600 text-white rounded-full font-mono text-[9px] font-bold">
                  {activeReportsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none">Queue</span>
          </button>

          {/* 3. Center Elevated: 🤝 Mutual Aid Coordination */}
          <button
            onClick={() => setAgencyActiveTab('coordination')}
            className="flex flex-col items-center justify-center -translate-y-3.5 group cursor-pointer"
            title="Inter-Agency Mutual Aid Coordination"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 border-4 border-slate-950 shadow-xl shadow-blue-950/80 flex items-center justify-center text-white active:scale-95 group-hover:scale-105 transition relative">
              <Users className="w-6 h-6" />
              {incomingCoordCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                  {incomingCoordCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-black text-indigo-300 mt-1 uppercase tracking-tight">
              Mutual Aid
            </span>
          </button>

          {/* 4. Live GIS Map */}
          <button
            onClick={() => setAgencyActiveTab('map')}
            className={`flex flex-col items-center justify-center gap-1 w-full py-1 text-center transition cursor-pointer ${
              agencyActiveTab === 'map' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] leading-none">GIS Map</span>
          </button>

          {/* 5. Archive */}
          <button
            onClick={() => setAgencyActiveTab('archive')}
            className={`flex flex-col items-center justify-center gap-1 w-full py-1 text-center transition cursor-pointer ${
              agencyActiveTab === 'archive' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-5 h-5" />
            <span className="text-[10px] leading-none">Archive</span>
          </button>

          {/* 6. Department Settings & Profile */}
          <button
            onClick={openAgencyProfileModal}
            className="flex flex-col items-center justify-center gap-1 w-full py-1 text-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Settings className="w-5 h-5 text-blue-400" />
            <span className="text-[10px] leading-none">Settings</span>
          </button>
        </div>
      )}

      {/* LANDING PAGE MODE */}
      {portalMode === 'landing' && (
        <div className="grid grid-cols-5 items-end justify-items-center">
          {/* 1. Home */}
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center gap-1 w-full py-1 text-center text-purple-400 font-bold transition cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] leading-none">Home</span>
          </button>

          {/* 2. Global GIS Map */}
          <button
            onClick={onToggleGlobalMap}
            className={`flex flex-col items-center justify-center gap-1 w-full py-1 text-center transition cursor-pointer ${
              isGlobalMapActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] leading-none">Live Map</span>
          </button>

          {/* 3. Center Elevated: 🚨 Report 911 */}
          <button
            onClick={() => {
              if (firebaseUser) {
                setPortalMode('resident');
              } else {
                openAuthModal('login');
              }
            }}
            className="flex flex-col items-center justify-center -translate-y-3.5 group cursor-pointer"
            title="Report Emergency"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 via-rose-600 to-red-600 border-4 border-slate-950 shadow-xl shadow-purple-950/80 flex items-center justify-center text-white active:scale-95 group-hover:scale-105 transition">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-rose-300 mt-1 uppercase tracking-tight">
              Report 911
            </span>
          </button>

          {/* 4. Hotlines */}
          <button
            onClick={openHotlinesModal}
            className="flex flex-col items-center justify-center gap-1 w-full py-1 text-center text-slate-400 hover:text-red-400 transition cursor-pointer"
          >
            <Phone className="w-5 h-5 text-red-400" />
            <span className="text-[10px] leading-none">Hotlines</span>
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
            className="flex flex-col items-center justify-center gap-1 w-full py-1 text-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            {agencyUser || firebaseUser ? <User className="w-5 h-5 text-emerald-400" /> : <LogIn className="w-5 h-5 text-purple-400" />}
            <span className="text-[10px] leading-none">{agencyUser ? 'Console' : firebaseUser ? 'Portal' : 'Sign In'}</span>
          </button>
        </div>
      )}
    </nav>
  );
};

