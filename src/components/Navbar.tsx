import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNexus } from '../context/NexusContext';
import { TRANSLATIONS } from '../constants/translations';
import { AGENCY_DETAILS } from '../constants/incidentData';
import { Agency, AgencyScope } from '../types';
import { AgencyLogo } from './common/AgencyLogo';
import { stopPersistentAgencyAlarm } from '../services/soundService';
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
  Settings,
  MapPin
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
    isOnline,
    queuedSyncCount,
    syncOfflineQueue,
    residentUser,
    firebaseUser,
    openAuthModal,
    adminProfiles,
    agencyDetails,
    markAgencyReportsAsRead,
    markResidentNotificationsAsRead,
    markNotificationAsRead,
    readNotifKeys,
    agencyUser,
    isAgencyAuthenticated,
    openAgencyProfileModal,
    agencyLogout,
    citizenLogout,
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

  // Calculate unread count for current view (dynamically updated and cleared via Mark as read)
  const unreadCount = useMemo(() => {
    if (portalMode === 'resident') {
      return reports.filter((r) => {
        const isMyReport = r.residentId === residentUser.id || r.residentName === residentUser.name;
        if (!isMyReport) return false;
        if (r.isUnreadForResident === false) return false;
        const notifKey = `${r.id}_${r.status}`;
        if (readNotifKeys.has(notifKey) || readNotifKeys.has(r.id) || readNotifKeys.has(`${r.id}_resident`)) {
          return false;
        }
        return true;
      }).length;
    }

    // Agency mode
    return reports.filter((r) => {
      const notifKey = `${r.id}_agency_${activeRole}`;
      if (readNotifKeys.has(notifKey) || readNotifKeys.has(`${r.id}_agency_ALL`) || readNotifKeys.has(r.id)) {
        return false;
      }
      if (activeRole === 'CENTRAL') {
        return r.isUnreadForAgencies?.PNP || r.isUnreadForAgencies?.BFP || r.isUnreadForAgencies?.MDRRMO;
      }
      return activeRole !== 'resident' && r.isUnreadForAgencies?.[activeRole as Agency];
    }).length;
  }, [reports, portalMode, activeRole, residentUser, readNotifKeys]);

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
    stopPersistentAgencyAlarm();
    agencyLogout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-white/70 shadow-sm transition-all text-slate-800">
      {/* Upper Status Line */}
      <div className="bg-white/45 border-b border-slate-200/50 px-3 sm:px-4 py-1 text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Inter-Agency Network Status */}
          <div className="flex items-center gap-2 overflow-hidden">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Database className="w-3 h-3 text-emerald-600" />
                <span className="hidden xs:inline">{t.centralizedDatabaseBadge}</span>
                <span className="xs:hidden">Live Cloud</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 font-bold shrink-0">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <Database className="w-3 h-3 text-amber-600" />
                <span className="hidden xs:inline">Offline Resilient Mode · Local Cache Active</span>
                <span className="xs:hidden">Offline Mode</span>
              </span>
            )}

            {queuedSyncCount > 0 && (
              <button
                onClick={syncOfflineQueue}
                className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 hover:bg-amber-200 transition cursor-pointer"
                title={`${queuedSyncCount} offline report/update queued for automatic sync. Click to retry sync now.`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{queuedSyncCount} Pending Sync</span>
              </button>
            )}

            <span className="text-slate-300 hidden md:inline">|</span>
            <span className="text-slate-500 hidden lg:inline truncate">
              {isOnline
                ? 'PNP · BFP · MDRRMO Unified Inter-Agency Link Active'
                : 'Reports & evidence cached on-device · Auto-sync upon reconnection'}
            </span>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Toggle */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-white/90 rounded-lg px-1 sm:px-1.5 py-0.5 border border-slate-200/80 shadow-xs">
              <Globe className="w-3 h-3 text-slate-400 hidden sm:inline" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded font-bold text-[10px] transition cursor-pointer ${
                  language === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                aria-label="English Language"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('fil')}
                className={`px-1.5 py-0.5 rounded font-bold text-[10px] transition cursor-pointer ${
                  language === 'fil' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
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
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition cursor-pointer shadow-xs ${
                  soundMuted
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
                title={soundMuted ? t.soundAlertsMuted : t.soundAlertsOn}
                aria-label={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {soundMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span className="hidden sm:inline">{soundMuted ? 'Muted' : 'Audio On'}</span>
              </button>
              <button
                onClick={triggerEmergencySound}
                className="text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded hover:bg-slate-100 text-[10px] hidden md:inline cursor-pointer transition font-medium"
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
        {/* Left: Branding with Nexus Official Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => setPortalMode('landing')}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Return to NEXUS Main Landing Page"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-slate-950 p-0.5 shadow-md shadow-indigo-100/50 border border-slate-800/80 shrink-0 group-hover:scale-105 transition flex items-center justify-center overflow-hidden">
              <img
                src="/icons/nexus-logo.jpg"
                alt="NEXUS"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 font-mono group-hover:text-blue-600 transition">
                  NEXUS
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full shadow-xs">
                  Bongabong OPS
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block truncate max-w-[200px] md:max-w-[260px] font-medium">
                {t.systemTagline}
              </p>
            </div>
          </div>

          {/* Portal Mode Indicator & Switcher */}
          {portalMode === 'landing' && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-xl ml-2 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Public Information Hub</span>
            </span>
          )}
        </div>

        {/* Right Corner: Auth Status, Profile, Notifications, Mobile Button */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto" ref={notifRef}>
          {/* Citizen / Resident Authentication & Profile Controls */}
          {portalMode !== 'agency' && (
            <div className="hidden sm:flex items-center gap-2">
              {firebaseUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenProfile}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-white/90 hover:bg-white border border-slate-200/80 rounded-xl transition text-left cursor-pointer group shadow-xs"
                    title="Click to manage profile, upload true identity photo, or sign out"
                  >
                    <div className="relative">
                      <img
                        src={residentUser.avatarUrl}
                        alt={residentUser.name}
                        className="w-7 h-7 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="hidden lg:block">
                      <span className="block text-xs font-bold text-slate-800 group-hover:text-blue-600 transition leading-tight truncate max-w-[120px]">
                        {residentUser.name}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-semibold leading-tight">
                        Verified Identity
                      </span>
                    </div>
                  </button>
                  {portalMode === 'landing' && (
                    <button
                      onClick={() => setPortalMode('resident')}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
                      title="Enter Resident Portal"
                    >
                      Resident Portal
                    </button>
                  )}
                  {portalMode === 'resident' && (
                    <button
                      onClick={async () => {
                        await citizenLogout();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition cursor-pointer shadow-xs min-h-[38px]"
                      title="Sign out of your citizen account"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              ) : agencyUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 border border-slate-200/80 rounded-xl text-xs shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 truncate max-w-[110px]">{agencyUser.name}</span>
                  </div>
                  <button
                    onClick={() => setPortalMode('agency')}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    Agency Console
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-slate-200/80 shadow-xs">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-blue-500/20"
                    title="Sign In (Citizen or Agency Officer - System automatically detects role)"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-200 shadow-xs"
                    title="Register verified resident citizen account"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition cursor-pointer shadow-xs min-h-[38px]"
              title="Sign out of Agency Command and return to citizen Resident Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Exit Agency Command</span>
              <span className="sm:hidden">Exit</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 bg-white/90 hover:bg-white border border-slate-200/80 rounded-xl transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shadow-xs"
              title="Recent Dispatches and Updates"
              aria-label="Open Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Mobile backdrop to isolate notification dropdown and prevent background bleed-through */}
            {notificationsOpen && (
              <div
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 sm:hidden"
                onClick={() => setNotificationsOpen(false)}
                aria-hidden="true"
              />
            )}

            {notificationsOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 mt-2 sm:w-[420px] bg-white rounded-3xl shadow-2xl shadow-slate-900/30 p-4 sm:p-5 z-50 border border-slate-200 ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-top-2 text-slate-800">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 shadow-xs">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                        {portalMode === 'resident'
                          ? 'Resident Updates'
                          : `${activeRole} Dispatch Alerts`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (portalMode === 'resident' || activeRole === 'resident') {
                          markResidentNotificationsAsRead();
                        } else {
                          markAgencyReportsAsRead(activeRole);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                    >
                      Mark as read
                    </button>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      title="Close notifications"
                      aria-label="Close notifications"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-84 overflow-y-auto space-y-2 pr-1">
                  {(() => {
                    const scopedNotifications = portalMode === 'resident'
                      ? reports.filter((r) => {
                          return Boolean(
                            (residentUser?.id && r.residentId === residentUser.id) ||
                            (residentUser?.name && r.residentName.toLowerCase() === residentUser.name.toLowerCase()) ||
                            (residentUser?.email && r.residentEmail && r.residentEmail.toLowerCase() === residentUser.email.toLowerCase()) ||
                            (firebaseUser?.uid && (r.residentId === firebaseUser.uid || (r as any).residentUid === firebaseUser.uid))
                          );
                        })
                      : (activeRole === 'CENTRAL'
                          ? reports
                          : reports.filter((r) => r.selectedAgency === activeRole || r.assistanceRequests?.some((req) => req.targetAgencies.includes(activeRole as Agency))));

                    if (scopedNotifications.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-500 space-y-1.5">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">No Recent Updates</p>
                          <p className="text-[11px] text-slate-400">
                            {portalMode === 'resident'
                              ? 'Your filed incident reports and response updates will appear here.'
                              : 'Incoming municipal incident telemetry will appear here.'}
                          </p>
                        </div>
                      );
                    }

                    return scopedNotifications.slice(0, 10).map((rep) => {
                      const isMyReport = rep.residentId === residentUser?.id || rep.residentName === residentUser?.name;
                      const notifKey = portalMode === 'resident' ? `${rep.id}_${rep.status}` : `${rep.id}_agency_${activeRole}`;
                      const isUnread = portalMode === 'resident'
                        ? (rep.isUnreadForResident !== false && !readNotifKeys.has(notifKey) && !readNotifKeys.has(rep.id) && !readNotifKeys.has(`${rep.id}_resident`))
                        : (!readNotifKeys.has(notifKey) && !readNotifKeys.has(`${rep.id}_agency_ALL`) && !readNotifKeys.has(rep.id) && (activeRole === 'CENTRAL' ? (rep.isUnreadForAgencies?.PNP || rep.isUnreadForAgencies?.BFP || rep.isUnreadForAgencies?.MDRRMO) : rep.isUnreadForAgencies?.[activeRole as Agency]));

                      return (
                        <div
                          key={rep.id}
                          onClick={() => {
                            markNotificationAsRead(rep.id);
                            setNotificationsOpen(false);
                            if (portalMode === 'resident') {
                              setActiveRole('resident');
                              setResidentActiveTab('tracking');
                            } else if (firebaseUser && portalMode !== 'agency') {
                              setPortalMode('resident');
                              setActiveRole('resident');
                              setResidentActiveTab('tracking');
                            }
                            onSelectReport?.(rep.id);
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer group shadow-xs space-y-1.5 ${
                            isUnread
                              ? 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200'
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                          }`}
                          title="Click to view full incident details and response timeline"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse shrink-0" title="Unread Update" />
                              )}
                              <span className="font-mono text-xs text-blue-700 font-black group-hover:text-blue-800">
                                {rep.trackingCode}
                              </span>
                              {isMyReport && (
                                <span className="text-[9px] font-black px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-full">
                                  Your Report
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
                                rep.status === 'Resolved'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : rep.status === 'Ongoing'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                                  : rep.status === 'Rejected'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {t[rep.status] || rep.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-700">
                            {rep.description}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 font-medium">
                            <span className="text-slate-700 font-semibold flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-500 inline shrink-0" />
                              <span>{rep.barangay}, {rep.municipality || 'Bongabong'}</span>
                            </span>
                            <span className="font-mono text-slate-500 text-[10px]">
                              {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">
                    Showing recent reports
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      if (portalMode === 'resident') {
                        setActiveRole('resident');
                        setResidentActiveTab('tracking');
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View All Incidents</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 bg-white/90 hover:bg-white border border-slate-200/80 rounded-xl transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shadow-xs"
            title="Toggle Console Switcher & Menu"
            aria-label="Toggle Mobile Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-2xl border-t border-slate-200/90 px-4 py-5 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-3">
          {/* Agency Sub-Consoles (If in agency mode) */}
          {portalMode === 'agency' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  {agencyUser?.isSystemAdmin || agencyUser?.agency === 'CENTRAL' ? 'All Agency Command Consoles:' : 'Authorized Agency Console:'}
                </span>
                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {agencyUser?.email || 'Authorized Official'}
                </span>
              </div>

              {agencyUser?.isSystemAdmin || agencyUser?.agency === 'CENTRAL' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSwitchToAgency('CENTRAL')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      activeRole === 'CENTRAL'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md'
                        : 'bg-white/90 border-slate-200 text-slate-700'
                    }`}
                  >
                    <AgencyLogo agency="CENTRAL" className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="block leading-tight">Centralized (All)</span>
                      <span className="text-[9px] text-slate-400 font-normal block">Master Dispatch</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSwitchToAgency('PNP')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      activeRole === 'PNP'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-white/90 border-slate-200 text-slate-700'
                    }`}
                  >
                    <AgencyLogo agency="PNP" className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="block leading-tight">PNP Police</span>
                      <span className="text-[9px] text-slate-400 font-normal block">Law Enforcement</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSwitchToAgency('BFP')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      activeRole === 'BFP'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-white/90 border-slate-200 text-slate-700'
                    }`}
                  >
                    <AgencyLogo agency="BFP" className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="block leading-tight">BFP Fire</span>
                      <span className="text-[9px] text-slate-400 font-normal block">Fire & Rescue</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSwitchToAgency('MDRRMO')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      activeRole === 'MDRRMO'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-white/90 border-slate-200 text-slate-700'
                    }`}
                  >
                    <AgencyLogo agency="MDRRMO" className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="block leading-tight">MDRRMO</span>
                      <span className="text-[9px] text-slate-400 font-normal block">Disaster/Medical</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/90 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AgencyLogo agency={activeRole as AgencyScope} className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">
                      {AGENCY_DETAILS[activeRole as AgencyScope]?.name} Department Console
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Ops Synced</span>
                </div>
              )}

              {/* Agency Department Profile & Settings on Mobile */}
              <button
                onClick={() => {
                  openAgencyProfileModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer mb-2"
              >
                <Settings className="w-4 h-4 text-blue-600" />
                <span>Department Profile & Settings</span>
              </button>

              {/* Exit Agency Command button on Mobile */}
              <button
                onClick={handleExitAgency}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
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
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In (Citizen or Agency)</span>
              </button>
              <button
                onClick={() => {
                  openAuthModal('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 shadow-xs transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Register Citizen Account</span>
              </button>
            </div>
          )}

          {/* Resident Identity / Auth Actions on Mobile */}
          {portalMode === 'resident' && (
            <div className="space-y-3">
              <div className="p-3 bg-white/90 rounded-xl border border-slate-200 space-y-2">
                {firebaseUser ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={residentUser.avatarUrl}
                        alt={residentUser.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">{residentUser.name}</span>
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Verified Firebase Citizen
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onOpenProfile?.();
                        setMobileMenuOpen(false);
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs text-slate-600 block font-semibold">
                      Sign in to verify your true resident identity:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          openAuthModal('login');
                          setMobileMenuOpen(false);
                        }}
                        className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In</span>
                      </button>
                      <button
                        onClick={() => {
                          openAuthModal('register');
                          setMobileMenuOpen(false);
                        }}
                        className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Register</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout / Return Controls on Mobile Citizen Side */}
              {firebaseUser ? (
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await citizenLogout();
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs min-h-[40px]"
                  title="Logout citizen account and return to main landing page"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setPortalMode('landing');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition cursor-pointer shadow-xs min-h-[40px]"
                >
                  <Home className="w-4 h-4 text-blue-600" />
                  <span>Return to Main Landing Page</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
