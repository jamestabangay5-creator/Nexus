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
  const { activeRole, language, simulateIncomingIncident } = useNexus();
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
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
        isGlobalMapActive={isGlobalMapActive}
        onToggleGlobalMap={() => setIsGlobalMapActive(!isGlobalMapActive)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {isGlobalMapActive ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGlobalMapActive(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to {activeRole === 'resident' ? 'Resident Portal' : `${activeRole} Dashboard`}</span>
                </button>
                <span className="text-slate-600">|</span>
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  All Reported Incidents GIS Map (Live Centralized View)
                </span>
              </div>
            </div>
            <IncidentMapView onSelectReport={(id) => setSelectedReportId(id)} />
          </div>
        ) : activeRole === 'resident' ? (
          <ResidentPortal />
        ) : (
          <AdminDashboard
            key={activeRole}
            agency={activeRole}
            selectedReportId={selectedReportId}
            onSelectReport={(id) => setSelectedReportId(id)}
          />
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

          {/* Quick Hotline reference */}
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
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
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
