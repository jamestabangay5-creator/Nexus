import React, { useState } from 'react';
import { NexusProvider, useNexus } from './context/NexusContext';
import { Navbar } from './components/Navbar';
import { EmergencyAlertBanner } from './components/EmergencyAlertBanner';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ResidentPortal } from './components/resident/ResidentPortal';
import { UserProfileModal } from './components/resident/UserProfileModal';
import { TermsAndConditionsModal } from './components/resident/TermsAndConditionsModal';
import { ReportDetailModal } from './components/admin/ReportDetailModal';
import { IncidentMapView } from './components/map/IncidentMapView';
import { ResidentAuthModal } from './components/auth/ResidentAuthModal';
import { AgencyProfileModal } from './components/admin/AgencyProfileModal';
import { LandingPage } from './components/landing/LandingPage';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { QuickHotlinesModal } from './components/resident/QuickHotlinesModal';
import { ActionSuccessModal } from './components/common/ActionSuccessModal';
import { AGENCY_DETAILS } from './constants/incidentData';
import { AgencyLogo } from './components/common/AgencyLogo';
import { TRANSLATIONS } from './constants/translations';
import {
  ShieldAlert,
  Flame,
  Activity,
  Phone,
  Database,
  Lock,
  Sparkles,
  MapPin,
  ArrowLeft
} from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeRole,
    portalMode,
    setPortalMode,
    language,
    simulateIncomingIncident,
    isAuthModalOpen,
    closeAuthModal,
    openAuthModal,
    authModalInitialMode,
    isAgencyProfileModalOpen,
    closeAgencyProfileModal,
    openAgencyProfileModal,
    firebaseUser,
    agencyUser,
    isAgencyAuthenticated,
  } = useNexus();
  const t = TRANSLATIONS[language];

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isGlobalMapActive, setIsGlobalMapActive] = useState(false);

  return (
    <div className="min-h-screen nexus-ambient-bg text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white relative">
      {/* Subtle Ambient Luminous Background Orbs (matching UI reference) */}
      <div className="fixed top-0 left-1/4 -z-10 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 -z-10 w-[30rem] h-[30rem] bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 right-10 -z-10 w-80 h-80 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Emergency Siren & Flashing Alert Banner */}
      <EmergencyAlertBanner onSelectReport={(id) => setSelectedReportId(id)} />

      {/* Main Top Navigation & Console Switcher */}
      <Navbar
        onOpenProfile={() => {
          if (portalMode === 'agency') {
            openAgencyProfileModal();
          } else {
            setIsProfileModalOpen(true);
          }
        }}
        onOpenTerms={() => setIsTermsModalOpen(true)}
        isGlobalMapActive={isGlobalMapActive}
        onToggleGlobalMap={() => setIsGlobalMapActive(!isGlobalMapActive)}
        onSelectReport={(id) => {
          setIsGlobalMapActive(false);
          setSelectedReportId(id);
        }}
      />

      {/* Main Content Area with Bottom Clearance for Mobile Navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-24 sm:pb-28 md:pb-8">
        {isGlobalMapActive ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-card p-3 rounded-2xl gap-2.5">
              <button
                onClick={() => setIsGlobalMapActive(false)}
                className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer self-start sm:self-auto min-h-[38px] shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Return to {portalMode === 'resident' ? 'Resident Portal' : portalMode === 'landing' ? 'Main Landing Page' : `${activeRole} Dashboard`}
                </span>
              </button>
              <span className="text-xs text-slate-700 font-semibold flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">Centralized GIS Live Map Layer</span>
              </span>
            </div>
            <IncidentMapView onSelectReport={(id) => setSelectedReportId(id)} />
          </div>
        ) : portalMode === 'landing' ? (
          <LandingPage
            onEnterResidentPortal={() => {
              if (firebaseUser) {
                setPortalMode('resident');
              } else {
                openAuthModal('login');
              }
            }}
            onOpenAgencyAuth={() => openAuthModal('login')}
            onOpenGlobalMap={() => setIsGlobalMapActive(true)}
            onSelectReport={(id) => setSelectedReportId(id)}
          />
        ) : portalMode === 'resident' ? (
          firebaseUser ? (
            <ResidentPortal
              selectedReportId={selectedReportId}
              onSelectReport={(id) => setSelectedReportId(id)}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 p-8 glass-shell rounded-3xl text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Citizen Authentication Required</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Resident Portal requires a verified citizen account. Please sign in or register to submit emergency reports and track live responders in Oriental Mindoro.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Sign In with Google or Email
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-sm"
                >
                  Register Citizen Account
                </button>
                <button
                  onClick={() => setPortalMode('landing')}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs transition cursor-pointer font-medium"
                >
                  Return to Landing Page
                </button>
              </div>
            </div>
          )
        ) : (
          isAgencyAuthenticated || agencyUser ? (
            <AdminDashboard
              key={activeRole}
              agency={activeRole === 'resident' ? 'CENTRAL' : activeRole}
              selectedReportId={selectedReportId}
              onSelectReport={(id) => setSelectedReportId(id)}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 p-8 glass-shell rounded-3xl text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shadow-sm">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Authorized Responders Only</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centralized Agency Command is restricted to verified dispatch officers (systemadmin@nexus.gov.ph, PNP, BFP, MDRRMO).
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Agency Officer Sign In
                </button>
                <button
                  onClick={() => setPortalMode('landing')}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs transition cursor-pointer font-medium"
                >
                  Return to Landing Page
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Emergency System Footer (Frosted Glass UI) */}
      <footer className="mt-auto border-t border-white/60 bg-white/70 backdrop-blur-xl py-6 text-xs text-slate-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-slate-800 tracking-tight">NEXUS DISPATCH</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Unified Public Safety Incident Registry
            </span>
          </div>

          {/* Quick Hotline & Separated Agency Link */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60 shadow-xs">
              <AgencyLogo agency="PNP" className="w-3.5 h-3.5 object-contain" />
              PNP: 911
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 shadow-xs">
              <AgencyLogo agency="BFP" className="w-3.5 h-3.5 object-contain" />
              BFP: 160
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 shadow-xs">
              <AgencyLogo agency="MDRRMO" className="w-3.5 h-3.5 object-contain" />
              MDRRMO: 122
            </span>
            {portalMode !== 'resident' && (
              <>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Official Agency Dispatch Login"
                >
                  <Lock className="w-3 h-3 text-blue-600" />
                  <span>Official Agency Sign In</span>
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenAuth={openAuthModal}
      />

      <ResidentAuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalInitialMode}
      />

      <AgencyProfileModal
        isOpen={isAgencyProfileModalOpen}
        onClose={closeAgencyProfileModal}
      />

      <TermsAndConditionsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          isOpen={!!selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}

      {/* 1-Tap Mobile Hotlines Sheet */}
      <QuickHotlinesModal />

      {/* Global Action Success / Feedback Modal */}
      <ActionSuccessModal />

      {/* Fixed Ergonomic Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenProfile={() => {
          if (portalMode === 'agency') {
            openAgencyProfileModal();
          } else {
            setIsProfileModalOpen(true);
          }
        }}
        onToggleGlobalMap={() => setIsGlobalMapActive(!isGlobalMapActive)}
        isGlobalMapActive={isGlobalMapActive}
      />
    </div>
  );
};

export default function App() {
  return (
    <NexusProvider>
      <AppContent />
    </NexusProvider>
  );
}
