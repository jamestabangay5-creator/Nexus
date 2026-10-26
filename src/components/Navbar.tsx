import React, { useState } from 'react';
import { useNexus } from '../context/NexusContext';
import { TRANSLATIONS } from '../constants/translations';
import { AGENCY_DETAILS } from '../constants/incidentData';
import { Agency } from '../types';
import {
  ShieldAlert,
  Flame,
  Activity,
  User,
  Volume2,
  VolumeX,
  Radio,
  Globe,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Map
} from 'lucide-react';

interface NavbarProps {
  onOpenProfile?: () => void;
  onOpenTerms?: () => void;
  isGlobalMapActive?: boolean;
  onToggleGlobalMap?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenProfile,
  onOpenTerms,
  isGlobalMapActive = false,
  onToggleGlobalMap,
}) => {
  const {
    activeRole,
    setActiveRole,
    language,
    setLanguage,
    soundMuted,
    setSoundMuted,
    triggerEmergencySound,
    simulateIncomingIncident,
    reports,
    residentUser,
    markAgencyReportsAsRead,
  } = useNexus();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const t = TRANSLATIONS[language];

  // Calculate unread count for current view
  const unreadCount =
    activeRole === 'resident'
      ? reports.filter((r) => r.residentId === residentUser.id && r.status !== 'Pending Verification').length
      : reports.filter((r) => r.isUnreadForAgencies[activeRole as Agency]).length;

  const handleRoleChange = (role: 'resident' | Agency) => {
    setActiveRole(role);
    if (role !== 'resident') {
      markAgencyReportsAsRead(role);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Upper Status Line */}
      <div className="bg-slate-950/80 border-b border-slate-800/60 px-4 py-1 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Database className="w-3 h-3" />
              {t.centralizedDatabaseBadge}
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              PNP · BFP · MDRRMO Unified Inter-Agency Link Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick simulation helper */}
            <button
              onClick={simulateIncomingIncident}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/40 px-2 py-0.5 rounded transition"
              title="Triggers a live emergency dispatch with siren and flashing indicator across all dashboards"
            >
              <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
              <span>{t.simulateReport}</span>
            </button>

            {/* Language Toggle */}
            <div className="flex items-center gap-1 bg-slate-800/80 rounded px-1.5 py-0.5 border border-slate-700">
              <Globe className="w-3 h-3 text-slate-400" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.2 rounded font-semibold text-[10px] transition ${
                  language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('fil')}
                className={`px-1.5 py-0.2 rounded font-semibold text-[10px] transition ${
                  language === 'fil' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                FIL
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundMuted(!soundMuted)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                  soundMuted
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                }`}
                title={soundMuted ? t.soundAlertsMuted : t.soundAlertsOn}
              >
                {soundMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span className="hidden md:inline">{soundMuted ? 'Muted' : 'Audio On'}</span>
              </button>
              <button
                onClick={triggerEmergencySound}
                className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 text-[10px]"
                title="Test emergency siren sound"
              >
                {t.testSound}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Branding & Resident Profile Preview */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 p-0.5 shadow-lg shadow-red-950/60">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-red-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                  NEXUS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                  911 Dispatch
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[280px]">
                {t.systemTagline}
              </p>
            </div>
          </div>

          {/* Resident Profile Button in upper-left per requirement 9 */}
          {activeRole === 'resident' && onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-lg transition ml-2 group text-left cursor-pointer"
              title="Click to view/edit user profile, language settings, and logout"
            >
              <img
                src={residentUser.avatarUrl}
                alt={residentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-emerald-500 shadow-sm"
              />
              <div className="hidden sm:block">
                <span className="block text-xs font-semibold text-white group-hover:text-emerald-400 transition leading-tight">
                  {residentUser.name}
                </span>
                <span className="block text-[10px] text-slate-400 leading-tight">
                  {residentUser.barangay.replace('Barangay ', 'Brgy. ')}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Center / Right: Agency & Resident Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center text-xs text-slate-400 font-medium mr-1">
            <span>{t.roleSelector}:</span>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            {/* PNP Tab */}
            <button
              onClick={() => handleRoleChange('PNP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'PNP'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-300" />
              <span>PNP</span>
              {reports.filter((r) => r.isUnreadForAgencies.PNP).length > 0 && (
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping ml-0.5" />
              )}
            </button>

            {/* BFP Tab */}
            <button
              onClick={() => handleRoleChange('BFP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'BFP'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-300" />
              <span>BFP</span>
              {reports.filter((r) => r.isUnreadForAgencies.BFP).length > 0 && (
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping ml-0.5" />
              )}
            </button>

            {/* MDRRMO Tab */}
            <button
              onClick={() => handleRoleChange('MDRRMO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'MDRRMO'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
              <span>MDRRMO</span>
              {reports.filter((r) => r.isUnreadForAgencies.MDRRMO).length > 0 && (
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping ml-0.5" />
              )}
            </button>

            {/* Resident Portal Tab */}
            <button
              onClick={() => handleRoleChange('resident')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'resident' && !isGlobalMapActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <User className="w-3.5 h-3.5 text-purple-300" />
              <span>{t.roleResident}</span>
            </button>
          </div>

          {/* Direct Map View Toggle */}
          {onToggleGlobalMap && (
            <button
              onClick={onToggleGlobalMap}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isGlobalMapActive
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/60'
                  : 'bg-slate-950 border-slate-700 text-emerald-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Open Unified Color-Coded Incident Map & Heatmap"
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Incident Map & Heatmap</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition cursor-pointer"
              title="Recent Dispatches and Updates"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-slate-900 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {activeRole === 'resident'
                        ? 'Resident Updates'
                        : `${activeRole} Dispatch Alerts`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (activeRole !== 'resident') {
                        markAgencyReportsAsRead(activeRole);
                      }
                      setNotificationsOpen(false);
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Mark as read
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
                  {reports.slice(0, 6).map((rep) => (
                    <div key={rep.id} className="pt-2 first:pt-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] text-blue-400 font-bold">
                          {rep.trackingCode}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            rep.status === 'Resolved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : rep.status === 'Ongoing'
                              ? 'bg-orange-950 text-orange-400 border border-orange-800'
                              : rep.status === 'Rejected'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {t[rep.status] || rep.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-1">
                        {rep.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{rep.barangay}</span>
                        <span>{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
