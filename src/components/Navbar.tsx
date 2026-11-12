import React, { useState, useEffect, useRef } from 'react';
import { useNexus } from '../context/NexusContext';
import { TRANSLATIONS } from '../constants/translations';
import { AGENCY_DETAILS } from '../constants/incidentData';
import { Agency, AgencyScope } from '../types';
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
  Database,
  Map,
  Menu,
  X,
  ShieldCheck,
  LogIn,
  UserPlus,
  Shield,
  ChevronRight,
  LogOut,
  Lock,
  Home,
  Settings
} from 'lucide-react';

interface NavbarProps {
  onOpenProfile?: () => void;
  onOpenTerms?: () => void;
  isGlobalMapActive?: boolean;
  onToggleGlobalMap?: () => void;
  onSelectReport?: (reportId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenProfile,
  onOpenTerms,
  isGlobalMapActive = false,
  onToggleGlobalMap,
  onSelectReport,
}) => {
  const {
    activeRole,
    setActiveRole,
    portalMode,
    setPortalMode,
    language,
    setLanguage,
    soundMuted,
    setSoundMuted,
    triggerEmergencySound,
    simulateIncomingIncident,
    reports,
    residentUser,
    firebaseUser,
    openAuthModal,
    adminProfiles,
    agencyDetails,
    markAgencyReportsAsRead,
    agencyUser,
    isAgencyAuthenticated,
    openAgencyProfileModal,
    agencyLogout,
    setResidentActiveTab,
  } = useNexus();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  // Calculate unread count for current view
  const unreadCount =
    portalMode === 'resident'
      ? reports.filter((r) => r.residentId === residentUser.id && r.status !== 'Pending Verification').length
      : activeRole === 'CENTRAL'
      ? reports.filter((r) => r.isUnreadForAgencies.PNP || r.isUnreadForAgencies.BFP || r.isUnreadForAgencies.MDRRMO).length
      : reports.filter((r) => activeRole !== 'resident' && r.isUnreadForAgencies[activeRole as Agency]).length;

  const handleSwitchToResident = () => {
    setPortalMode('resident');
    setActiveRole('resident');
    setMobileMenuOpen(false);
  };

  const handleSwitchToAgency = (scope: AgencyScope = 'CENTRAL') => {
    setPortalMode('agency');
    setActiveRole(scope);
    markAgencyReportsAsRead(scope);
    setMobileMenuOpen(false);
  };

  const handleExitAgency = () => {
    agencyLogout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-all">
      {/* Upper Status Line */}
      <div className="bg-slate-950/85 border-b border-slate-800/60 px-3 sm:px-4 py-1 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Inter-Agency Network Status */}
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Database className="w-3 h-3" />
              <span className="hidden xs:inline">{t.centralizedDatabaseBadge}</span>
              <span className="xs:hidden">Live 911 Cloud</span>
            </span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-400 hidden lg:inline truncate">
              PNP · BFP · MDRRMO Unified Inter-Agency Link Active
            </span>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Toggle */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800/80 rounded px-1 sm:px-1.5 py-0.5 border border-slate-700">
              <Globe className="w-3 h-3 text-slate-400 hidden sm:inline" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded font-bold text-[10px] transition cursor-pointer ${
                  language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="English Language"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('fil')}
                className={`px-1.5 py-0.5 rounded font-bold text-[10px] transition cursor-pointer ${
                  language === 'fil' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Filipino Language"
              >
                FIL
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="hidden xs:flex items-center gap-1">
              <button
                onClick={() => setSoundMuted(!soundMuted)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium border transition cursor-pointer ${
                  soundMuted
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                }`}
                title={soundMuted ? t.soundAlertsMuted : t.soundAlertsOn}
                aria-label={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {soundMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span className="hidden sm:inline">{soundMuted ? 'Muted' : 'Audio On'}</span>
              </button>
              <button
                onClick={triggerEmergencySound}
                className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 text-[10px] hidden md:inline cursor-pointer"
                title="Test emergency siren sound"
              >
                {t.testSound}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        {/* Left: Branding & Core Portal Mode Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => setPortalMode('landing')}
            className="flex items-center gap-2 cursor-pointer group"
            title="Return to NEXUS 911 Main Landing Page"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 p-0.5 shadow-lg shadow-red-950/60 shrink-0 group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white font-mono group-hover:text-red-400 transition">
                  NEXUS
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                  911 Dispatch
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block truncate max-w-[200px] md:max-w-[260px]">
                {t.systemTagline}
              </p>
            </div>
          </div>

          {/* Portal Mode Indicator & Switcher */}
          {portalMode === 'landing' && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300/90 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg ml-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Public Information Hub</span>
            </span>
          )}
        </div>

        {/* Right Corner: Auth Status, Profile, GIS Map, Notifications, Mobile Button */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto" ref={notifRef}>
          {/* GIS Map View Toggle (Only shown on public landing page) */}
          {onToggleGlobalMap && portalMode === 'landing' && (
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
              <span className="hidden xl:inline">Incident Map & Heatmap</span>
              <span className="xl:hidden">GIS Map</span>
            </button>
          )}

          {/* Citizen / Resident Authentication & Profile Controls */}
          {portalMode !== 'agency' && (
            <div className="hidden sm:flex items-center gap-2">
              {firebaseUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenProfile}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-xl transition text-left cursor-pointer group"
                    title="Click to manage profile, upload true identity photo, or sign out"
                  >
                    <div className="relative">
                      <img
                        src={residentUser.avatarUrl}
                        alt={residentUser.name}
                        className="w-7 h-7 rounded-full object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                    </div>
                    <div className="hidden lg:block">
                      <span className="block text-xs font-bold text-white group-hover:text-emerald-400 transition leading-tight truncate max-w-[120px]">
                        {residentUser.name}
                      </span>
                      <span className="block text-[10px] text-emerald-400 font-semibold leading-tight">
                        Verified Identity
                      </span>
                    </div>
                  </button>
                  {portalMode === 'landing' && (
                    <button
                      onClick={() => setPortalMode('resident')}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                      title="Enter Resident Portal"
                    >
                      Resident Portal
                    </button>
                  )}
                </div>
              ) : agencyUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white truncate max-w-[110px]">{agencyUser.name}</span>
                  </div>
                  <button
                    onClick={() => setPortalMode('agency')}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                  >
                    Agency Console
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
                    title="Sign In (Citizen or Agency Officer - System automatically detects role)"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Register verified resident citizen account"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden md:inline">Register (Citizen)</span>
                    <span className="md:hidden">Register</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Exit Agency Command button (When in Agency mode) */}
          {portalMode === 'agency' && (
            <button
              onClick={handleExitAgency}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm min-h-[38px]"
              title="Sign out of Agency Command and return to citizen Resident Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Exit Agency Command</span>
              <span className="sm:hidden">Exit</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Recent Dispatches and Updates"
              aria-label="Open Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-slate-900 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 mt-1 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {portalMode === 'resident'
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
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                  >
                    Mark as read
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/60">
                  {reports.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No recent dispatches</p>
                  ) : (
                    reports.slice(0, 8).map((rep) => {
                      const isMyReport = rep.residentId === residentUser.id || rep.residentName === residentUser.name;
                      return (
                        <div
                          key={rep.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            if (portalMode === 'resident') {
                              setResidentActiveTab('tracking');
                            } else if (firebaseUser && portalMode !== 'agency') {
                              setPortalMode('resident');
                              setResidentActiveTab('tracking');
                            }
                            onSelectReport?.(rep.id);
                          }}
                          className="pt-2 first:pt-0 p-2 rounded-xl hover:bg-slate-800/90 active:bg-slate-700/80 transition cursor-pointer group border border-transparent hover:border-slate-700/70"
                          title="Click to view full incident details and response timeline"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-blue-400 font-bold group-hover:text-blue-300">
                                {rep.trackingCode}
                              </span>
                              {isMyReport && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-950/80 text-purple-300 border border-purple-800/60 rounded">
                                  Your Report
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
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
                          <p className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1 group-hover:text-white">
                            {rep.description}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                            <span className="text-slate-400 group-hover:text-slate-300">{rep.barangay}</span>
                            <span className="font-mono text-slate-500">{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Toggle Console Switcher & Menu"
            aria-label="Toggle Mobile Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-red-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/98 border-t border-slate-800 px-4 py-4 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-3">
          {/* Agency Sub-Consoles (If in agency mode) */}
          {portalMode === 'agency' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  {agencyUser?.isSystemAdmin || agencyUser?.agency === 'CENTRAL' ? 'All Agency Command Consoles:' : 'Authorized Agency Console:'}
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
                  {agencyUser?.email || 'Authorized Official'}
                </span>
              </div>

              {agencyUser?.isSystemAdmin || agencyUser?.agency === 'CENTRAL' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSwitchToAgency('CENTRAL')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      activeRole === 'CENTRAL'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-purple-300 shrink-0" />
                    <div>
                      <span className="block leading-tight">Centralized (All)</span>
                      <span className="text-[9px] text-slate-300 font-normal block">Master Dispatch</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSwitchToAgency('PNP')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      activeRole === 'PNP'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-blue-300 shrink-0" />
                    <div>
                      <span className="block leading-tight">PNP Police</span>
                      <span className="text-[9px] text-slate-300 font-normal block">Law Enforcement</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSwitchToAgency('BFP')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      activeRole === 'BFP'
                        ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-orange-300 shrink-0" />
                    <div>
                      <span className="block leading-tight">BFP Fire</span>
                      <span className="text-[9px] text-slate-300 font-normal block">Fire & Rescue</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSwitchToAgency('MDRRMO')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      activeRole === 'MDRRMO'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-emerald-300 shrink-0" />
                    <div>
                      <span className="block leading-tight">MDRRMO</span>
                      <span className="text-[9px] text-slate-300 font-normal block">Disaster/Medical</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeRole === 'PNP' && <ShieldAlert className="w-4 h-4 text-blue-400" />}
                    {activeRole === 'BFP' && <Flame className="w-4 h-4 text-orange-400" />}
                    {activeRole === 'MDRRMO' && <Activity className="w-4 h-4 text-emerald-400" />}
                    <span className="text-xs font-bold text-white">
                      {AGENCY_DETAILS[activeRole as AgencyScope]?.name} Department Console
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">911 Synced</span>
                </div>
              )}

              {/* Agency Department Profile & Settings on Mobile */}
              <button
                onClick={() => {
                  openAgencyProfileModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer mb-2"
              >
                <Settings className="w-4 h-4 text-blue-400" />
                <span>Department Profile & Settings</span>
              </button>

              {/* Exit Agency Command button on Mobile */}
              <button
                onClick={handleExitAgency}
                className="w-full py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Exit Agency Command & Return Home</span>
              </button>
            </div>
          )}

          {/* Landing Mode Navigation on Mobile */}
          {portalMode === 'landing' && !firebaseUser && !agencyUser && (
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => {
                  openAuthModal('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In (Citizen or Agency)</span>
              </button>
              <button
                onClick={() => {
                  openAuthModal('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span>Register Citizen Account</span>
              </button>
            </div>
          )}

          {/* Resident Identity / Auth Actions on Mobile */}
          {portalMode === 'resident' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                {firebaseUser ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={residentUser.avatarUrl}
                        alt={residentUser.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-white text-xs block">{residentUser.name}</span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Verified Firebase Citizen
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onOpenProfile?.();
                        setMobileMenuOpen(false);
                      }}
                      className="px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg"
                    >
                      Edit Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs text-slate-300 block font-semibold">
                      Sign in to verify your true resident identity:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          openAuthModal('login');
                          setMobileMenuOpen(false);
                        }}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In</span>
                      </button>
                      <button
                        onClick={() => {
                          openAuthModal('register');
                          setMobileMenuOpen(false);
                        }}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                        <span>Register</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Return to Main Landing Page on Mobile */}
              <button
                onClick={() => {
                  setPortalMode('landing');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <Home className="w-4 h-4 text-red-400" />
                <span>Return to Main Landing Page</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
