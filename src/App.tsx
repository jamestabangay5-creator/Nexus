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
import { AGENCY_DETAILS } from './constants/incidentData';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Emergency Siren & Flashing Alert Banner (Requirement 4) */}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-2xl gap-2.5">
              <button
                onClick={() => setIsGlobalMapActive(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer self-start sm:self-auto min-h-[38px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  Return to {portalMode === 'resident' ? 'Resident Portal' : portalMode === 'landing' ? 'Main Landing Page' : `${activeRole} Dashboard`}
                </span>
              </button>
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
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
            <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Citizen Authentication Required</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Resident Portal requires a verified citizen account. Please sign in or register to submit emergency reports and track live responders in Oriental Mindoro.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                >
                  Sign In with Google or Email
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  Register Citizen Account
                </button>
                <button
                  onClick={() => setPortalMode('landing')}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
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
            <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-blue-900/50 rounded-3xl text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Authorized Responders Only</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized Agency Command is restricted to verified dispatch officers (systemadmin@nexus.gov.ph, PNP, BFP, MDRRMO).
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                >
                  Agency Officer Sign In
                </button>
                <button
                  onClick={() => setPortalMode('landing')}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
                >
                  Return to Landing Page
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Emergency System Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-slate-400">NEXUS DISPATCH</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              Unified Public Safety Incident Registry
            </span>
          </div>

          {/* Quick Hotline & Separated Agency Link */}
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-blue-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              PNP: 911
            </span>
            <span className="flex items-center gap-1 text-orange-400">
              <Flame className="w-3.5 h-3.5" />
              BFP: 160
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              MDRRMO: 122
            </span>
            {portalMode !== 'resident' && (
              <>
                <span className="text-slate-700 hidden sm:inline">|</span>
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Official Agency Dispatch Login"
                >
                  <Lock className="w-3 h-3 text-blue-400" />
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
