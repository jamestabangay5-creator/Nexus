import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Agency,
  AgencyScope,
  AgencyUser,
  PortalMode,
  IncidentReport,
  IncidentStatus,
  IncidentTypeId,
  UserProfile,
  Language,
  PatrolUnit,
  FireApparatus,
  FireAlarmLevel,
  MedicalUnit,
  EvacuationCenter,
  AgencyProfileSettings,
  SuccessModalData,
} from '../types';
import {
  INITIAL_INCIDENT_REPORTS,
  INCIDENT_TYPES,
  INITIAL_PATROL_UNITS,
  INITIAL_FIRE_APPARATUS,
  INITIAL_MEDICAL_UNITS,
  INITIAL_EVACUATION_CENTERS,
  OFFICIAL_AGENCY_ACCOUNTS,
  AGENCY_DETAILS,
} from '../constants/incidentData';
import { playEmergencyAlertSound, playSuccessChime, updateContinuousAlarmMute } from '../services/soundService';
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  sanitizeForFirestore,
  type FirebaseUser
} from '../lib/firebase';
import {
  persistUserAvatar,
  retrieveUserAvatar,
  enqueueOfflineAction,
  getOfflineQueue,
  removeOfflineAction,
  cacheReportsOffline,
  getCachedReportsOffline
} from '../services/offlineStorage';

interface IncomingAlertData {
  report: IncidentReport;
  timestamp: string;
}

interface NexusContextType {
  reports: IncidentReport[];
  activeRole: 'resident' | AgencyScope;
  setActiveRole: (role: 'resident' | AgencyScope) => void;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  soundMuted: boolean;
  setSoundMuted: (muted: boolean) => void;
  
  // Resident Profile & Firebase Auth
  firebaseUser: FirebaseUser | null;
  residentUser: UserProfile;
  setResidentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateResidentUser: (updates: Partial<UserProfile>) => void;
  acceptTerms: () => void;
  adminProfiles: Record<AgencyScope, { name: string; title: string; badgeNumber: string; email?: string; hotline?: string; description?: string }>;
  agencyDetails: typeof AGENCY_DETAILS;

  // Single Unified Auth Modal State (Citizen Register + Unified Sign In)
  isAuthModalOpen: boolean;
  authModalInitialMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;

  // Agency Session & Settings Modal State
  agencyUser: AgencyUser | null;
  isAgencyAuthenticated: boolean;
  isAgencyAuthModalOpen: boolean;
  openAgencyAuthModal: () => void;
  closeAgencyAuthModal: () => void;
  isAgencyProfileModalOpen: boolean;
  openAgencyProfileModal: () => void;
  closeAgencyProfileModal: () => void;
  updateAgencyProfile: (agency: AgencyScope, updates: Partial<{
    name: string;
    title: string;
    badgeNumber: string;
    email: string;
    hotline: string;
    descriptionEn: string;
    descriptionFil: string;
    stationAddress?: string;
  }>) => Promise<void>;
  agencyLogin: (user: AgencyUser) => void;
  agencyLogout: () => void;

  // Mobile Navigation & View State Synchronization
  residentActiveTab: 'report' | 'tracking' | 'map';
  setResidentActiveTab: (tab: 'report' | 'tracking' | 'map') => void;
  agencyActiveTab: 'command' | 'reports' | 'map' | 'analytics' | 'coordination' | 'archive';
  setAgencyActiveTab: (tab: 'command' | 'reports' | 'map' | 'analytics' | 'coordination' | 'archive') => void;
  reportFormScrollTrigger: number;
  triggerScrollToReportForm: () => void;
  isHotlinesModalOpen: boolean;
  openHotlinesModal: () => void;
  closeHotlinesModal: () => void;
  
  // Real-time notification & flashing indicator
  incomingAlert: IncomingAlertData | null;
  clearIncomingAlert: () => void;
  triggerEmergencySound: () => void;

  // Global Action Success / Feedback Modal
  successModal: SuccessModalData | null;
  triggerSuccessModal: (data: SuccessModalData) => void;
  closeSuccessModal: () => void;

  // Agency-specific Operational State & Dispatch Resources (Customizable & Editable)
  patrolUnits: PatrolUnit[];
  updatePatrolStatus: (unitId: string, status: PatrolUnit['status']) => void;
  savePatrolUnit: (unit: PatrolUnit) => void;
  deletePatrolUnit: (unitId: string) => void;
  fireApparatus: FireApparatus[];
  updateApparatusStatus: (apparatusId: string, status: FireApparatus['status'], waterLevelPercent?: number) => void;
  saveFireApparatus: (apparatus: FireApparatus) => void;
  deleteFireApparatus: (apparatusId: string) => void;
  fireAlarmLevel: FireAlarmLevel;
  setFireAlarmLevel: (level: FireAlarmLevel) => void;
  medicalUnits: MedicalUnit[];
  updateMedicalStatus: (unitId: string, status: MedicalUnit['status']) => void;
  saveMedicalUnit: (unit: MedicalUnit) => void;
  deleteMedicalUnit: (unitId: string) => void;
  evacuationCenters: EvacuationCenter[];
  updateEvacuationOccupancy: (centerId: string, occupants: number, status?: EvacuationCenter['status']) => void;

  // Offline & Online Network State
  isOnline: boolean;
  queuedSyncCount: number;
  syncOfflineQueue: () => Promise<void>;

  // Actions
  submitIncidentReport: (newReport: Omit<IncidentReport, 'id' | 'trackingCode' | 'status' | 'history' | 'assistanceRequests' | 'isUnreadForAgencies' | 'createdAt' | 'updatedAt'>) => IncidentReport;
  updateIncidentStatus: (reportId: string, status: IncidentStatus, adminName: string, agency: AgencyScope, details?: string) => void;
  rejectIncidentReport: (reportId: string, reason: string, adminName: string, agency: AgencyScope) => void;
  reclassifyIncidentReport: (reportId: string, newTypeId: IncidentTypeId, adminName: string, agency: AgencyScope) => void;
  sendAssistanceRequest: (reportId: string, fromAgency: Agency, targetAgencies: Agency[], urgency: 'Routine' | 'Urgent' | 'Critical', note: string, requestedBy: string) => void;
  acknowledgeAssistanceRequest: (reportId: string, requestId: string, agency: Agency, acknowledgedBy: string, actionNote?: string) => void;
  markAgencyReportsAsRead: (agency: AgencyScope) => void;
  simulateIncomingIncident: () => void;
  restoreRejectedReport: (reportId: string, adminName: string, agency: AgencyScope) => void;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

const STORAGE_KEY = 'nexus_emergency_reports_v3';
const RESIDENT_STORAGE_KEY = 'nexus_resident_user_v2';
const AGENCY_STORAGE_KEY = 'nexus_agency_user_v2';

const MOCK_SEED_IDS = new Set(['rep-001', 'rep-002', 'rep-003', 'rep-004', 'rep-005', 'rep-006', 'rep-007', 'rep-008']);

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load reports from LocalStorage - clean 0-report slate for production deployment
  const [reports, setReports] = useState<IncidentReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('nexus_emergency_reports_v2');
      if (saved) {
        const parsed: IncidentReport[] = JSON.parse(saved);
        // Purge any lingering mockup incidents
        const realReports = parsed.filter(
          (r) => !MOCK_SEED_IDS.has(r.id) && !r.id.startsWith('rep-00')
        );
        realReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(realReports)); } catch {}
        return realReports;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Helper to verify if an email represents an official department dispatcher
  const isEmailOfficialAgency = (emailStr?: string): boolean => {
    if (!emailStr) return false;
    const clean = emailStr.toLowerCase().trim();
    return (
      clean === OFFICIAL_AGENCY_ACCOUNTS.CENTRAL.email.toLowerCase() ||
      clean === OFFICIAL_AGENCY_ACCOUNTS.PNP.email.toLowerCase() ||
      clean === OFFICIAL_AGENCY_ACCOUNTS.BFP.email.toLowerCase() ||
      clean === OFFICIAL_AGENCY_ACCOUNTS.MDRRMO.email.toLowerCase() ||
      clean.startsWith('pnp.') ||
      clean.startsWith('pnp_') ||
      clean.startsWith('police.') ||
      clean.endsWith('@pnp.gov.ph') ||
      clean.startsWith('bfp.') ||
      clean.startsWith('bfp_') ||
      clean.startsWith('fire.') ||
      clean.endsWith('@bfp.gov.ph') ||
      clean.startsWith('mdrrmo.') ||
      clean.startsWith('mdrrmo_') ||
      clean.startsWith('pdrrmo.') ||
      clean.startsWith('rescue.') ||
      clean.endsWith('@mdrrmo.gov.ph') ||
      clean.startsWith('central.admin@') ||
      clean.startsWith('sysadmin@') ||
      clean.startsWith('systemadmin@')
    );
  };

  // Agency Session & Auth State (Strictly for Official Responders)
  const [agencyUser, setAgencyUser] = useState<AgencyUser | null>(() => {
    try {
      const saved = localStorage.getItem(AGENCY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.agency && isEmailOfficialAgency(parsed?.email)) {
          return parsed;
        }
        localStorage.removeItem(AGENCY_STORAGE_KEY);
      }
    } catch {}
    return null;
  });

  const [isAgencyAuthenticated, setIsAgencyAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AGENCY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.agency && isEmailOfficialAgency(parsed?.email)) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  const [isAgencyAuthModalOpen, setIsAgencyAuthModalOpen] = useState(false);

  // Role & Portal separation
  const [activeRole, setActiveRole] = useState<'resident' | AgencyScope>(() => {
    try {
      const savedAgency = localStorage.getItem(AGENCY_STORAGE_KEY);
      if (savedAgency) {
        const parsed = JSON.parse(savedAgency);
        if (parsed?.agency && isEmailOfficialAgency(parsed?.email)) {
          return parsed.agency;
        }
      }
    } catch {}
    return 'resident';
  });

  const [portalMode, setPortalMode] = useState<PortalMode>(() => {
    try {
      const savedMode = localStorage.getItem('nexus_portal_mode') as PortalMode;
      if (savedMode === 'resident' || savedMode === 'agency' || savedMode === 'landing') {
        const savedAgency = localStorage.getItem(AGENCY_STORAGE_KEY);
        if (savedMode === 'agency' && savedAgency) {
          const parsed = JSON.parse(savedAgency);
          if (parsed?.agency && isEmailOfficialAgency(parsed?.email)) {
            return 'agency';
          }
        }
        if (savedMode === 'resident') {
          return 'resident';
        }
      }
      const savedAgency = localStorage.getItem(AGENCY_STORAGE_KEY);
      if (savedAgency) {
        const parsed = JSON.parse(savedAgency);
        if (parsed?.agency && isEmailOfficialAgency(parsed?.email)) {
          return 'agency';
        }
      }
    } catch {}
    return 'landing';
  });

  const [language, setLanguage] = useState<Language>('en');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [incomingAlert, setIncomingAlert] = useState<IncomingAlertData | null>(null);

  const handleSetSoundMuted = (muted: boolean) => {
    setSoundMuted(muted);
    updateContinuousAlarmMute(muted);
  };

  const [isAgencyProfileModalOpen, setIsAgencyProfileModalOpen] = useState(false);
  const openAgencyProfileModal = () => setIsAgencyProfileModalOpen(true);
  const closeAgencyProfileModal = () => setIsAgencyProfileModalOpen(false);

  // Mobile Tab & Scroll Synchronization
  const [residentActiveTab, setResidentActiveTab] = useState<'report' | 'tracking' | 'map'>('report');
  const [agencyActiveTab, setAgencyActiveTab] = useState<'command' | 'reports' | 'map' | 'analytics' | 'coordination' | 'archive'>('command');
  const [reportFormScrollTrigger, setReportFormScrollTrigger] = useState<number>(0);
  const triggerScrollToReportForm = () => {
    setResidentActiveTab('report');
    setReportFormScrollTrigger((prev) => prev + 1);
  };
  const [isHotlinesModalOpen, setIsHotlinesModalOpen] = useState(false);
  const openHotlinesModal = () => setIsHotlinesModalOpen(true);
  const closeHotlinesModal = () => setIsHotlinesModalOpen(false);

  // Single unified login modal trigger
  const openAgencyAuthModal = () => {
    openAuthModal('login');
  };

  const closeAgencyAuthModal = () => {
    setIsAgencyAuthModalOpen(false);
    setIsAuthModalOpen(false);
  };

  // Global Action Success / Feedback Modal State
  const [successModal, setSuccessModal] = useState<SuccessModalData | null>(null);

  const triggerSuccessModal = (data: SuccessModalData) => {
    setSuccessModal(data);
    playSuccessChime(soundMuted);
  };

  const closeSuccessModal = () => {
    setSuccessModal(null);
  };

  const [agencyDetails, setAgencyDetails] = useState<typeof AGENCY_DETAILS>(() => {
    try {
      const saved = localStorage.getItem('nexus_agency_details_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return AGENCY_DETAILS;
  });

  const [adminProfiles, setAdminProfiles] = useState<Record<AgencyScope, { name: string; title: string; badgeNumber: string; email?: string; hotline?: string; description?: string }>>(() => {
    try {
      const saved = localStorage.getItem('nexus_admin_profiles_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      CENTRAL: {
        name: OFFICIAL_AGENCY_ACCOUNTS.CENTRAL.name,
        title: OFFICIAL_AGENCY_ACCOUNTS.CENTRAL.title,
        badgeNumber: OFFICIAL_AGENCY_ACCOUNTS.CENTRAL.badgeNumber,
        email: OFFICIAL_AGENCY_ACCOUNTS.CENTRAL.email,
        hotline: AGENCY_DETAILS.CENTRAL.hotline,
        description: AGENCY_DETAILS.CENTRAL.descriptionEn,
      },
      PNP: {
        name: OFFICIAL_AGENCY_ACCOUNTS.PNP.name,
        title: OFFICIAL_AGENCY_ACCOUNTS.PNP.title,
        badgeNumber: OFFICIAL_AGENCY_ACCOUNTS.PNP.badgeNumber,
        email: OFFICIAL_AGENCY_ACCOUNTS.PNP.email,
        hotline: AGENCY_DETAILS.PNP.hotline,
        description: AGENCY_DETAILS.PNP.descriptionEn,
      },
      BFP: {
        name: OFFICIAL_AGENCY_ACCOUNTS.BFP.name,
        title: OFFICIAL_AGENCY_ACCOUNTS.BFP.title,
        badgeNumber: OFFICIAL_AGENCY_ACCOUNTS.BFP.badgeNumber,
        email: OFFICIAL_AGENCY_ACCOUNTS.BFP.email,
        hotline: AGENCY_DETAILS.BFP.hotline,
        description: AGENCY_DETAILS.BFP.descriptionEn,
      },
      MDRRMO: {
        name: OFFICIAL_AGENCY_ACCOUNTS.MDRRMO.name,
        title: OFFICIAL_AGENCY_ACCOUNTS.MDRRMO.title,
        badgeNumber: OFFICIAL_AGENCY_ACCOUNTS.MDRRMO.badgeNumber,
        email: OFFICIAL_AGENCY_ACCOUNTS.MDRRMO.email,
        hotline: AGENCY_DETAILS.MDRRMO.hotline,
        description: AGENCY_DETAILS.MDRRMO.descriptionEn,
      },
    };
  });

  const updateAgencyProfile = async (agency: AgencyScope, updates: Partial<{
    name: string;
    title: string;
    badgeNumber: string;
    email: string;
    hotline: string;
    descriptionEn: string;
    descriptionFil: string;
    stationAddress?: string;
  }>) => {
    setAdminProfiles((prev) => {
      const updated = {
        ...prev,
        [agency]: {
          ...prev[agency],
          name: updates.name !== undefined ? updates.name : prev[agency].name,
          title: updates.title !== undefined ? updates.title : prev[agency].title,
          badgeNumber: updates.badgeNumber !== undefined ? updates.badgeNumber : prev[agency].badgeNumber,
          email: updates.email !== undefined ? updates.email : prev[agency].email,
          hotline: updates.hotline !== undefined ? updates.hotline : prev[agency].hotline,
          description: updates.descriptionEn !== undefined ? updates.descriptionEn : prev[agency].description,
        },
      };
      try { localStorage.setItem('nexus_admin_profiles_v1', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setAgencyDetails((prev) => {
      const updated = {
        ...prev,
        [agency]: {
          ...prev[agency],
          hotline: updates.hotline || prev[agency].hotline,
          descriptionEn: updates.descriptionEn || prev[agency].descriptionEn,
          descriptionFil: updates.descriptionFil || prev[agency].descriptionFil,
        },
      };
      try { localStorage.setItem('nexus_agency_details_v1', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (agencyUser && (agencyUser.agency === agency || agencyUser.isSystemAdmin)) {
      const updatedUser: AgencyUser = {
        ...agencyUser,
        name: updates.name || agencyUser.name,
        title: updates.title || agencyUser.title,
        badgeNumber: updates.badgeNumber || agencyUser.badgeNumber,
        email: updates.email || agencyUser.email,
      };
      setAgencyUser(updatedUser);
      try { localStorage.setItem(AGENCY_STORAGE_KEY, JSON.stringify(updatedUser)); } catch {}
    }

    try {
      await setDoc(doc(db, 'agency_settings', agency), sanitizeForFirestore({
        ...updates,
        updatedAt: serverTimestamp(),
      }), { merge: true }).catch(() => null);
    } catch {}
  };

  // Real-time listener for Firestore agency settings sync across clients
  useEffect(() => {
    try {
      const agencies: AgencyScope[] = ['CENTRAL', 'PNP', 'BFP', 'MDRRMO'];
      const unsubs = agencies.map((ag) => {
        return onSnapshot(doc(db, 'agency_settings', ag), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setAdminProfiles((prev) => ({
              ...prev,
              [ag]: {
                ...prev[ag],
                name: data.name || prev[ag].name,
                title: data.title || prev[ag].title,
                badgeNumber: data.badgeNumber || prev[ag].badgeNumber,
                email: data.email || prev[ag].email,
                hotline: data.hotline || prev[ag].hotline,
                description: data.descriptionEn || prev[ag].description,
              },
            }));
            setAgencyDetails((prev) => ({
              ...prev,
              [ag]: {
                ...prev[ag],
                hotline: data.hotline || prev[ag].hotline,
                descriptionEn: data.descriptionEn || prev[ag].descriptionEn,
                descriptionFil: data.descriptionFil || prev[ag].descriptionFil,
              },
            }));
          }
        }, () => {});
      });
      return () => { unsubs.forEach((u) => u()); };
    } catch {}
  }, []);

  const agencyLogin = (user: AgencyUser) => {
    setAgencyUser(user);
    setIsAgencyAuthenticated(true);
    setPortalMode('agency');
    setActiveRole(user.agency || 'CENTRAL');
    try {
      localStorage.setItem(AGENCY_STORAGE_KEY, JSON.stringify(user));
    } catch {}
    setIsAgencyAuthModalOpen(false);
    setIsAuthModalOpen(false);
  };

  const agencyLogout = () => {
    try {
      localStorage.removeItem(AGENCY_STORAGE_KEY);
      localStorage.setItem('nexus_portal_mode', 'landing');
    } catch {}
    setAgencyUser(null);
    setIsAgencyAuthenticated(false);
    setPortalMode('landing');
    setActiveRole('resident');
    auth.signOut().catch(() => null);
  };

  // Safe portal mode switcher
  const handleSetPortalMode = (mode: PortalMode) => {
    if (mode === 'resident' && !firebaseUser && !auth.currentUser && !residentUser?.isVerifiedIdentity) {
      openAuthModal('login');
      return;
    }
    if (mode === 'agency' && !isAgencyAuthenticated && !agencyUser && firebaseUser?.email?.toLowerCase() !== 'systemadmin@nexus.gov.ph') {
      openAuthModal('login');
      return;
    }
    setPortalMode(mode);
    try {
      localStorage.setItem('nexus_portal_mode', mode);
    } catch {}
    if (mode === 'resident' || mode === 'landing') {
      setActiveRole('resident');
    } else if (mode === 'agency' && agencyUser) {
      setActiveRole(agencyUser.agency || 'CENTRAL');
    }
  };

  // Firebase Auth State & Single Unified Auth Modal
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Agency-specific operational resources & fleet tracking
  const [patrolUnits, setPatrolUnits] = useState<PatrolUnit[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_patrol_units_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PATROL_UNITS;
  });

  const [fireApparatus, setFireApparatus] = useState<FireApparatus[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_fire_apparatus_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FIRE_APPARATUS;
  });

  const [fireAlarmLevel, setFireAlarmLevel] = useState<FireAlarmLevel>('1st Alarm');

  const [medicalUnits, setMedicalUnits] = useState<MedicalUnit[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_medical_units_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MEDICAL_UNITS;
  });

  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_evac_centers_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_EVACUATION_CENTERS;
  });

  const updatePatrolStatus = (unitId: string, status: PatrolUnit['status']) => {
    setPatrolUnits((prev) => {
      const next = prev.map((u) => (u.id === unitId ? { ...u, status } : u));
      try { localStorage.setItem('nexus_patrol_units_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const savePatrolUnit = (unit: PatrolUnit) => {
    setPatrolUnits((prev) => {
      const exists = prev.some((u) => u.id === unit.id);
      const next = exists ? prev.map((u) => (u.id === unit.id ? unit : u)) : [...prev, unit];
      try { localStorage.setItem('nexus_patrol_units_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const deletePatrolUnit = (unitId: string) => {
    setPatrolUnits((prev) => {
      const next = prev.filter((u) => u.id !== unitId);
      try { localStorage.setItem('nexus_patrol_units_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const updateApparatusStatus = (apparatusId: string, status: FireApparatus['status'], waterLevelPercent?: number) => {
    setFireApparatus((prev) => {
      const next = prev.map((a) => (a.id === apparatusId ? { ...a, status, waterLevelPercent: waterLevelPercent !== undefined ? waterLevelPercent : a.waterLevelPercent } : a));
      try { localStorage.setItem('nexus_fire_apparatus_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const saveFireApparatus = (apparatus: FireApparatus) => {
    setFireApparatus((prev) => {
      const exists = prev.some((a) => a.id === apparatus.id);
      const next = exists ? prev.map((a) => (a.id === apparatus.id ? apparatus : a)) : [...prev, apparatus];
      try { localStorage.setItem('nexus_fire_apparatus_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const deleteFireApparatus = (apparatusId: string) => {
    setFireApparatus((prev) => {
      const next = prev.filter((a) => a.id !== apparatusId);
      try { localStorage.setItem('nexus_fire_apparatus_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const updateMedicalStatus = (unitId: string, status: MedicalUnit['status']) => {
    setMedicalUnits((prev) => {
      const next = prev.map((m) => (m.id === unitId ? { ...m, status } : m));
      try { localStorage.setItem('nexus_medical_units_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const saveMedicalUnit = (unit: MedicalUnit) => {
    setMedicalUnits((prev) => {
      const exists = prev.some((m) => m.id === unit.id);
      const next = exists ? prev.map((m) => (m.id === unit.id ? unit : m)) : [...prev, unit];
      try { localStorage.setItem('nexus_medical_units_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const deleteMedicalUnit = (unitId: string) => {
    setMedicalUnits((prev) => {
      const next = prev.filter((m) => m.id !== unitId);
      try { localStorage.setItem('nexus_medical_units_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const updateEvacuationOccupancy = (centerId: string, occupants: number, status?: EvacuationCenter['status']) => {
    setEvacuationCenters((prev) => {
      const next = prev.map((c) => (c.id === centerId ? { ...c, currentOccupants: occupants, status: status || (occupants >= c.capacity ? 'Full' : occupants > 0 ? 'Active' : 'Standby') } : c));
      try { localStorage.setItem('nexus_evac_centers_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const [residentUser, setResidentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(RESIDENT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return {
      id: 'res-001',
      name: 'Juan Dela Cruz',
      role: 'resident',
      email: 'juan.delacruz@citizen.gov.ph',
      phone: '0917-555-1204',
      province: 'Oriental Mindoro',
      municipality: 'Calapan City',
      barangay: 'Ibaba East',
      address: 'Purok 3, Rizal Street',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      termsAccepted: true,
      termsAcceptedAt: '2026-10-15T10:00:00',
      isVerifiedIdentity: false,
    };
  });

  // Offline / Online Network State & Resilient Synchronization
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [queuedSyncCount, setQueuedSyncCount] = useState<number>(0);

  // Sync all queued offline reports and status updates with Cloud Firestore
  const syncOfflineQueue = async () => {
    if (!navigator.onLine) return;
    try {
      const queue = await getOfflineQueue();
      setQueuedSyncCount(queue.length);
      if (queue.length === 0) return;

      for (const action of queue) {
        try {
          if (action.type === 'submit_report') {
            const report = action.payload as IncidentReport;
            await setDoc(doc(db, 'reports', report.id), sanitizeForFirestore(report));
            await removeOfflineAction(action.id);
          } else if (action.type === 'update_status' || action.type === 'reject_report') {
            const { reportId, data } = action.payload;
            await updateDoc(doc(db, 'reports', reportId), sanitizeForFirestore(data));
            await removeOfflineAction(action.id);
          }
        } catch (itemErr) {
          console.warn('Queued action sync retry failed, will retry on next connection event:', itemErr);
        }
      }

      const remaining = await getOfflineQueue();
      setQueuedSyncCount(remaining.length);
    } catch (err) {
      console.warn('Offline queue synchronization notice:', err);
    }
  };

  // Restore avatar and reports from permanent IndexedDB offline cache on mount
  useEffect(() => {
    (async () => {
      try {
        const uid = residentUser.uid || residentUser.id;
        const savedAvatar = await retrieveUserAvatar(uid, residentUser.email);
        if (savedAvatar && savedAvatar !== residentUser.avatarUrl) {
          setResidentUser((prev) => ({ ...prev, avatarUrl: savedAvatar }));
        }

        // Restore any offline-cached reports if state is empty
        const cachedReports = await getCachedReportsOffline();
        if (cachedReports.length > 0) {
          setReports((prev) => {
            const map = new Map<string, IncidentReport>();
            prev.forEach((r) => map.set(r.id, r));
            cachedReports
              .filter((r) => !MOCK_SEED_IDS.has(r.id) && !r.id.startsWith('rep-00'))
              .forEach((r) => {
                if (!map.has(r.id)) map.set(r.id, r);
              });
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return merged;
          });
        }
      } catch (err) {
        console.warn('Permanent avatar/cache hydration notice:', err);
      }
    })();
  }, []);

  // Real-time network connectivity listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    syncOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userEmail = user.email?.toLowerCase().trim() || '';

        // Check Firestore user doc first to see if custom role is assigned
        let docData: any = null;
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            docData = docSnap.data();
          }
        } catch {}

        const isExplicitResident = docData?.role === 'resident';

        // Precise official agency account checks
        const isOfficialPnp =
          !isExplicitResident && (
            userEmail === OFFICIAL_AGENCY_ACCOUNTS.PNP.email.toLowerCase() ||
            userEmail.startsWith('pnp.') ||
            userEmail.startsWith('pnp_') ||
            userEmail.startsWith('police.') ||
            userEmail.endsWith('@pnp.gov.ph')
          );

        const isOfficialBfp =
          !isExplicitResident && (
            userEmail === OFFICIAL_AGENCY_ACCOUNTS.BFP.email.toLowerCase() ||
            userEmail.startsWith('bfp.') ||
            userEmail.startsWith('bfp_') ||
            userEmail.startsWith('fire.') ||
            userEmail.endsWith('@bfp.gov.ph')
          );

        const isOfficialMdrrmo =
          !isExplicitResident && (
            userEmail === OFFICIAL_AGENCY_ACCOUNTS.MDRRMO.email.toLowerCase() ||
            userEmail.startsWith('mdrrmo.') ||
            userEmail.startsWith('mdrrmo_') ||
            userEmail.startsWith('pdrrmo.') ||
            userEmail.startsWith('rescue.') ||
            userEmail.endsWith('@mdrrmo.gov.ph')
          );

        const isOfficialCentral =
          !isExplicitResident && (
            userEmail === OFFICIAL_AGENCY_ACCOUNTS.CENTRAL.email.toLowerCase() ||
            userEmail === 'systemadmin@nexus.gov.ph' ||
            userEmail.startsWith('central.admin@') ||
            userEmail.startsWith('sysadmin@') ||
            userEmail.startsWith('systemadmin@')
          );

        const isDocAdmin = !isExplicitResident && (docData?.role === 'admin' || docData?.role === 'agency');
        const docAgency: AgencyScope | undefined = !isExplicitResident ? docData?.agency : undefined;

        const isAgencyAccount = isDocAdmin || !!docAgency || isOfficialPnp || isOfficialBfp || isOfficialMdrrmo || isOfficialCentral;

        // If authenticated as agency officer or administrator, activate corresponding department command
        if (isAgencyAccount) {
          let adminScope: AgencyScope = docAgency || 'CENTRAL';
          if (!docAgency) {
            if (isOfficialPnp) adminScope = 'PNP';
            else if (isOfficialBfp) adminScope = 'BFP';
            else if (isOfficialMdrrmo) adminScope = 'MDRRMO';
            else if (isOfficialCentral) adminScope = 'CENTRAL';
            else adminScope = 'CENTRAL';
          }

          const officialAccount = OFFICIAL_AGENCY_ACCOUNTS[adminScope];
          const newAgencyUser: AgencyUser = {
            uid: user.uid,
            email: user.email!,
            name: docData?.name || user.displayName || adminProfiles[adminScope]?.name || officialAccount.name,
            title: docData?.title || adminProfiles[adminScope]?.title || officialAccount.title,
            badgeNumber: docData?.badgeNumber || adminProfiles[adminScope]?.badgeNumber || officialAccount.badgeNumber,
            agency: adminScope,
            role: 'admin',
            isSystemAdmin: adminScope === 'CENTRAL',
          };
          setAgencyUser(newAgencyUser);
          setIsAgencyAuthenticated(true);
          setPortalMode('agency');
          setActiveRole(adminScope);
          try {
            localStorage.setItem(AGENCY_STORAGE_KEY, JSON.stringify(newAgencyUser));
          } catch {}
          return;
        }

        // Resident citizen authentication handling — Clean up any stale agency sessions
        setAgencyUser(null);
        setIsAgencyAuthenticated(false);
        try {
          localStorage.removeItem(AGENCY_STORAGE_KEY);
        } catch {}

        // Automatically activate Resident Portal Mode immediately upon citizen login
        setPortalMode('resident');
        setActiveRole('resident');
        try {
          localStorage.setItem('nexus_portal_mode', 'resident');
        } catch {}

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          const savedAvatar = await retrieveUserAvatar(user.uid, user.email || '');

          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            const finalAvatar = data.avatarUrl || savedAvatar || user.photoURL || residentUser.avatarUrl;
            setResidentUser((prev) => ({
              ...prev,
              id: user.uid,
              uid: user.uid,
              name: data.name || user.displayName || prev.name,
              email: user.email || data.email || prev.email,
              phone: data.phone || prev.phone,
              province: data.province || 'Oriental Mindoro',
              municipality: data.municipality || 'Calapan City',
              barangay: data.barangay || prev.barangay,
              address: data.address || prev.address,
              avatarUrl: finalAvatar,
              role: 'resident',
              termsAccepted: data.termsAccepted ?? true,
              termsAcceptedAt: data.termsAcceptedAt || new Date().toISOString(),
              isVerifiedIdentity: true,
              authProvider: user.providerData[0]?.providerId === 'google.com' ? 'google' : 'password',
            }));
            if (finalAvatar) {
              persistUserAvatar(user.uid, user.email || '', finalAvatar);
            }
          } else {
            const finalAvatar = savedAvatar || user.photoURL || residentUser.avatarUrl;
            const newProfile: UserProfile = {
              id: user.uid,
              uid: user.uid,
              name: user.displayName || 'Resident Citizen',
              email: user.email || '',
              phone: user.phoneNumber || '0917-000-0000',
              province: 'Oriental Mindoro',
              municipality: 'Calapan City',
              barangay: 'Ibaba East',
              address: 'Poblacion',
              avatarUrl: finalAvatar,
              role: 'resident',
              termsAccepted: true,
              termsAcceptedAt: new Date().toISOString(),
              isVerifiedIdentity: true,
              authProvider: user.providerData[0]?.providerId === 'google.com' ? 'google' : 'password',
            };
            await setDoc(userDocRef, { ...sanitizeForFirestore(newProfile), createdAt: serverTimestamp() }).catch(() => null);
            setResidentUser(newProfile);
            if (finalAvatar) {
              persistUserAvatar(user.uid, user.email || '', finalAvatar);
            }
          }
        } catch (err) {
          console.warn('Firebase user profile retrieval warning:', err);
        }
      } else {
        setFirebaseUser(null);
        setPortalMode((prev) => (prev === 'resident' ? 'landing' : prev));
        try {
          localStorage.setItem('nexus_portal_mode', 'landing');
        } catch {}
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore Realtime Reports
  useEffect(() => {
    try {
      const reportsColRef = collection(db, 'reports');
      const q = query(reportsColRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreReports: IncidentReport[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as IncidentReport;
              // Cleanly purge any legacy mockup demo items from Firestore
              if (MOCK_SEED_IDS.has(data.id) || data.id.startsWith('rep-00')) {
                deleteDoc(docSnap.ref).catch(() => null);
              } else {
                firestoreReports.push(data);
              }
            });
            // Safely merge Firestore reports with offline-first local reports so local state is never wiped
            setReports((prevLocal) => {
              const mergedMap = new Map<string, IncidentReport>();
              // Keep all local real reports (excluding mockup data)
              prevLocal
                .filter((r) => !MOCK_SEED_IDS.has(r.id) && !r.id.startsWith('rep-00'))
                .forEach((r) => mergedMap.set(r.id, r));
              // Merge remote reports, updating if Firestore has newer information
              firestoreReports.forEach((fr) => {
                const local = mergedMap.get(fr.id);
                if (!local) {
                  mergedMap.set(fr.id, fr);
                } else {
                  const localTime = new Date(local.updatedAt || local.createdAt).getTime();
                  const fireTime = new Date(fr.updatedAt || fr.createdAt).getTime();
                  if (fireTime > localTime) {
                    mergedMap.set(fr.id, fr);
                  }
                }
              });
              const mergedList = Array.from(mergedMap.values());
              // Always sort descending: newest report displayed at the top
              mergedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
              } catch {}
              return mergedList;
            });
          }
        },
        (error) => {
          // If Firestore security rules restrict read access, Nexus seamlessly operates in local offline-first mode
          console.info('Nexus Live Sync: Operating in resilient local storage mode (Firestore rules restrict unauthenticated snapshot):', error.message);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore initialization notice:', e);
    }
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed to persist reports', e);
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(RESIDENT_STORAGE_KEY, JSON.stringify(residentUser));
    } catch (e) {
      console.warn('Failed to persist resident user', e);
    }
  }, [residentUser]);

  const updateResidentUser = (updates: Partial<UserProfile>) => {
    setResidentUser((prev) => {
      const next = { ...prev, ...updates };
      if (updates.avatarUrl) {
        persistUserAvatar(next.uid || next.id, next.email, updates.avatarUrl);
      }
      return next;
    });
  };

  const acceptTerms = () => {
    setResidentUser((prev) => ({
      ...prev,
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
    }));
  };

  const triggerEmergencySound = () => {
    playEmergencyAlertSound(soundMuted);
  };

  const clearIncomingAlert = () => {
    setIncomingAlert(null);
  };

  // Submit new incident report (writes to state and Cloud Firestore)
  const submitIncidentReport = (
    newReportData: Omit<IncidentReport, 'id' | 'trackingCode' | 'status' | 'history' | 'assistanceRequests' | 'isUnreadForAgencies' | 'createdAt' | 'updatedAt'>
  ): IncidentReport => {
    const timestamp = new Date().toISOString();
    const trackingCode = `NX-${new Date().getFullYear()}-${String(reports.length + 1).padStart(3, '0')}`;
    const newId = `rep-${Date.now()}`;

    const report: IncidentReport = {
      ...newReportData,
      id: newId,
      trackingCode,
      status: 'Pending Verification',
      history: [
        {
          id: `hist-${Date.now()}-1`,
          timestamp,
          adminName: newReportData.residentName,
          agency: 'Resident',
          action: 'Report Submitted',
          details: `Filed emergency report initially tagged as ${newReportData.initialTypeId} to ${newReportData.selectedAgency}.`,
        },
      ],
      assistanceRequests: [],
      isUnreadForAgencies: {
        PNP: true,
        BFP: true,
        MDRRMO: true,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    if (newReportData.verifiedTypeId) {
      report.verifiedTypeId = newReportData.verifiedTypeId;
    }

    setReports((prev) => {
      const next = [report, ...prev.filter((r) => r.id !== report.id)];
      next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      cacheReportsOffline(next);
      return next;
    });

    // Save to Cloud Firestore or Enqueue for offline sync
    if (!navigator.onLine) {
      enqueueOfflineAction({
        id: `offline-sub-${report.id}`,
        type: 'submit_report',
        payload: report,
      }).then(() => {
        setQueuedSyncCount((prev) => prev + 1);
      });
    } else {
      try {
        const cleanData = sanitizeForFirestore(report);
        setDoc(doc(db, 'reports', report.id), cleanData).catch((err) => {
          console.warn('Network issue writing report to Firestore, queuing for offline sync:', err);
          enqueueOfflineAction({
            id: `offline-sub-${report.id}`,
            type: 'submit_report',
            payload: report,
          }).then(() => {
            setQueuedSyncCount((prev) => prev + 1);
          });
        });
      } catch (err) {
        console.warn('Could not sanitize report for Firestore:', err);
      }
    }

    // Trigger visual flashing notification and siren alert
    setIncomingAlert({
      report,
      timestamp,
    });
    playEmergencyAlertSound(soundMuted);

    return report;
  };

  // Update status (Accept, Ongoing, Resolve)
  const updateIncidentStatus = (
    reportId: string,
    newStatus: IncidentStatus,
    adminName: string,
    agency: AgencyScope,
    details?: string
  ) => {
    const now = new Date().toISOString();

    setReports((prev) => {
      const next = prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        // Authority enforcement: Only the assigned selected agency (or CENTRAL system admin) holds command authority
        if (agency !== 'CENTRAL' && agency !== rep.selectedAgency) {
          console.warn(`[Authority Restriction] Agency "${agency}" is not authorized to update status on report "${rep.trackingCode}" assigned to "${rep.selectedAgency}".`);
          return rep;
        }

        const actionText =
          newStatus === 'Accepted'
            ? 'Report Accepted for Dispatch'
            : newStatus === 'Ongoing'
            ? 'Response Team Deployed (Ongoing)'
            : newStatus === 'Resolved'
            ? 'Incident Resolved and Cleared'
            : `Status changed to ${newStatus}`;

        const auditEntry = {
          id: `hist-${Date.now()}`,
          timestamp: now,
          adminName,
          agency,
          action: actionText,
          details: details || `Status changed from "${rep.status}" to "${newStatus}" by ${agency} admin.`,
          previousStatus: rep.status,
          newStatus,
        };

        const updated = {
          ...rep,
          status: newStatus,
          resolution:
            newStatus === 'Resolved'
              ? {
                  resolvedAt: now,
                  resolvedByAdmin: adminName,
                  agency,
                  notes: details || 'Incident successfully resolved and cleared.',
                }
              : undefined,
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };

        // Write to Firestore or enqueue for offline sync
        if (!navigator.onLine) {
          enqueueOfflineAction({
            id: `offline-stat-${reportId}-${Date.now()}`,
            type: 'update_status',
            payload: {
              reportId,
              data: {
                status: newStatus,
                resolution: updated.resolution || null,
                updatedAt: now,
                history: updated.history,
              },
            },
          }).then(() => setQueuedSyncCount((prev) => prev + 1));
        } else {
          updateDoc(doc(db, 'reports', reportId), {
            status: newStatus,
            resolution: updated.resolution || null,
            updatedAt: now,
            history: updated.history,
          }).catch((err) => {
            console.warn('Network issue updating report in Firestore, queuing for offline sync:', err);
            enqueueOfflineAction({
              id: `offline-stat-${reportId}-${Date.now()}`,
              type: 'update_status',
              payload: {
                reportId,
                data: {
                  status: newStatus,
                  resolution: updated.resolution || null,
                  updatedAt: now,
                  history: updated.history,
                },
              },
            }).then(() => setQueuedSyncCount((prev) => prev + 1));
          });
        }

        return updated;
      });
      next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      cacheReportsOffline(next);
      return next;
    });

    playSuccessChime(soundMuted);
  };

  // Reject report: Move to Rejected Reports Archive
  const rejectIncidentReport = (
    reportId: string,
    reason: string,
    adminName: string,
    agency: AgencyScope
  ) => {
    const now = new Date().toISOString();

    setReports((prev) => {
      const next = prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        // Authority enforcement: Only the assigned selected agency (or CENTRAL system admin) holds command authority
        if (agency !== 'CENTRAL' && agency !== rep.selectedAgency) {
          console.warn(`[Authority Restriction] Agency "${agency}" is not authorized to reject report "${rep.trackingCode}" assigned to "${rep.selectedAgency}".`);
          return rep;
        }

        const auditEntry = {
          id: `hist-${Date.now()}`,
          timestamp: now,
          adminName,
          agency,
          action: 'Report Rejected & Archived',
          details: `Report rejected by ${adminName} (${agency}). Stated reason: ${reason}`,
          previousStatus: rep.status,
          newStatus: 'Rejected' as IncidentStatus,
        };

        const updated = {
          ...rep,
          status: 'Rejected' as IncidentStatus,
          rejection: {
            reason,
            rejectedAt: now,
            rejectedByAdmin: adminName,
            agency: (agency === 'CENTRAL' ? rep.selectedAgency : agency) as Agency,
          },
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };

        // Write to Firestore or enqueue for offline sync
        if (!navigator.onLine) {
          enqueueOfflineAction({
            id: `offline-rej-${reportId}-${Date.now()}`,
            type: 'reject_report',
            payload: {
              reportId,
              data: {
                status: 'Rejected',
                rejection: updated.rejection,
                updatedAt: now,
                history: updated.history,
              },
            },
          }).then(() => setQueuedSyncCount((prev) => prev + 1));
        } else {
          updateDoc(doc(db, 'reports', reportId), {
            status: 'Rejected',
            rejection: updated.rejection,
            updatedAt: now,
            history: updated.history,
          }).catch((err) => {
            console.warn('Network issue updating rejected report in Firestore, queuing for offline sync:', err);
            enqueueOfflineAction({
              id: `offline-rej-${reportId}-${Date.now()}`,
              type: 'reject_report',
              payload: {
                reportId,
                data: {
                  status: 'Rejected',
                  rejection: updated.rejection,
                  updatedAt: now,
                  history: updated.history,
                },
              },
            }).then(() => setQueuedSyncCount((prev) => prev + 1));
          });
        }

        return updated;
      });
      next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      cacheReportsOffline(next);
      return next;
    });
  };

  // Restore rejected report
  const restoreRejectedReport = (
    reportId: string,
    adminName: string,
    agency: AgencyScope
  ) => {
    const now = new Date().toISOString();

    setReports((prev) => {
      const next = prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        // Authority enforcement: Only the assigned selected agency (or CENTRAL system admin) holds command authority
        if (agency !== 'CENTRAL' && agency !== rep.selectedAgency) {
          console.warn(`[Authority Restriction] Agency "${agency}" is not authorized to restore report "${rep.trackingCode}" assigned to "${rep.selectedAgency}".`);
          return rep;
        }

        const auditEntry = {
          id: `hist-${Date.now()}`,
          timestamp: now,
          adminName,
          agency,
          action: 'Report Restored from Archive',
          details: `Report un-rejected and restored to Pending Verification by ${adminName} (${agency}).`,
          previousStatus: 'Rejected' as IncidentStatus,
          newStatus: 'Pending Verification' as IncidentStatus,
        };

        const updated = {
          ...rep,
          status: 'Pending Verification' as IncidentStatus,
          rejection: undefined,
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };

        updateDoc(doc(db, 'reports', reportId), {
          status: 'Pending Verification',
          rejection: null,
          updatedAt: now,
          history: updated.history,
        }).catch((err) => console.warn('Could not restore report in Firestore:', err));

        return updated;
      });
      next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Reclassify incident report
  const reclassifyIncidentReport = (
    reportId: string,
    newTypeId: IncidentTypeId,
    adminName: string,
    agency: AgencyScope
  ) => {
    const now = new Date().toISOString();
    const newTypeDef = INCIDENT_TYPES.find((t) => t.id === newTypeId);

    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        const oldTypeId = rep.verifiedTypeId || rep.initialTypeId;
        const oldTypeDef = INCIDENT_TYPES.find((t) => t.id === oldTypeId);

        const auditEntry = {
          id: `hist-${Date.now()}`,
          timestamp: now,
          adminName,
          agency,
          action: 'Classification Verified & Updated',
          details: `Reclassified from ${oldTypeDef?.en || oldTypeId} to ${newTypeDef?.en || newTypeId} (${newTypeDef?.category}) by ${adminName} (${agency}).`,
        };

        const updated = {
          ...rep,
          verifiedTypeId: newTypeId,
          category: newTypeDef?.category || rep.category,
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };

        updateDoc(doc(db, 'reports', reportId), {
          verifiedTypeId: newTypeId,
          category: newTypeDef?.category || rep.category,
          updatedAt: now,
          history: updated.history,
        }).catch((err) => console.warn('Could not reclassify report in Firestore:', err));

        return updated;
      })
    );

    playSuccessChime(soundMuted);
  };

  // Send Inter-Agency Assistance Request
  const sendAssistanceRequest = (
    reportId: string,
    fromAgency: Agency,
    targetAgencies: Agency[],
    urgency: 'Routine' | 'Urgent' | 'Critical',
    note: string,
    requestedBy: string
  ) => {
    const now = new Date().toISOString();
    const requestId = `req-${Date.now()}`;

    const newRequest = {
      id: requestId,
      reportId,
      fromAgency,
      targetAgencies,
      requestedAt: now,
      requestedBy,
      urgency,
      note,
      status: 'Pending' as const,
      acknowledgments: [],
    };

    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        // Authority enforcement: Only the assigned selected agency can request mutual aid for an incident
        if (fromAgency !== rep.selectedAgency) {
          console.warn(`[Authority Restriction] Agency "${fromAgency}" is not authorized to request assistance for report "${rep.trackingCode}" assigned to "${rep.selectedAgency}".`);
          return rep;
        }

        const auditEntry = {
          id: `hist-${Date.now()}`,
          timestamp: now,
          adminName: requestedBy,
          agency: fromAgency,
          action: `Assistance Requested (${urgency})`,
          details: `${fromAgency} requested multi-agency response assistance from ${targetAgencies.join(
            ', '
          )}. Note: "${note}"`,
        };

        const unreadUpdates = { ...rep.isUnreadForAgencies };
        targetAgencies.forEach((ag) => {
          unreadUpdates[ag] = true;
        });

        const updated = {
          ...rep,
          assistanceRequests: [newRequest, ...rep.assistanceRequests],
          isUnreadForAgencies: unreadUpdates,
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };

        updateDoc(doc(db, 'reports', reportId), {
          assistanceRequests: updated.assistanceRequests,
          isUnreadForAgencies: updated.isUnreadForAgencies,
          updatedAt: now,
          history: updated.history,
        }).catch((err) => console.warn('Could not update assistance in Firestore:', err));

        return updated;
      })
    );

    playEmergencyAlertSound(soundMuted);
  };

  // Acknowledge Assistance Request
  const acknowledgeAssistanceRequest = (
    reportId: string,
    requestId: string,
    agency: Agency,
    acknowledgedBy: string,
    actionNote?: string
  ) => {
    const now = new Date().toISOString();

    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        const updatedRequests = rep.assistanceRequests.map((req) => {
          if (req.id !== requestId) return req;

          const exists = req.acknowledgments.some((a) => a.agency === agency);
          if (exists) return req;

          const newAcks = [
            ...req.acknowledgments,
            {
              agency,
              acknowledgedBy,
              acknowledgedAt: now,
              actionNote,
            },
          ];

          const allAcknowledged = req.targetAgencies.every((target) =>
            newAcks.some((a) => a.agency === target)
          );

          return {
            ...req,
            status: allAcknowledged ? ('Acknowledged' as const) : ('Pending' as const),
            acknowledgments: newAcks,
          };
        });

        const auditEntry = {
          id: `hist-${Date.now()}`,
          timestamp: now,
          adminName: acknowledgedBy,
          agency,
          action: 'Assistance Request Acknowledged',
          details: `${agency} response unit dispatched and coordinated with incident commander.${
            actionNote ? ` Note: "${actionNote}"` : ''
          }`,
        };

        const updated = {
          ...rep,
          assistanceRequests: updatedRequests,
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };

        updateDoc(doc(db, 'reports', reportId), {
          assistanceRequests: updatedRequests,
          updatedAt: now,
          history: updated.history,
        }).catch((err) => console.warn('Could not update ack in Firestore:', err));

        return updated;
      })
    );

    playSuccessChime(soundMuted);
  };

  const markAgencyReportsAsRead = (agency: AgencyScope) => {
    setReports((prev) =>
      prev.map((rep) => {
        if (agency === 'CENTRAL') {
          return {
            ...rep,
            isUnreadForAgencies: {
              PNP: false,
              BFP: false,
              MDRRMO: false,
            },
          };
        }
        if (!rep.isUnreadForAgencies[agency as Agency]) return rep;
        return {
          ...rep,
          isUnreadForAgencies: {
            ...rep.isUnreadForAgencies,
            [agency as Agency]: false,
          },
        };
      })
    );
  };

  // Simulated emergency report for testing and demonstration
  const simulateIncomingIncident = () => {
    const sampleTypes: IncidentTypeId[] = [
      'fire_incident',
      'road_accident',
      'theft_robbery',
      'medical_emergency',
      'flooding_landslide',
      'armed_threat',
    ];
    const sampleAgencies: Agency[] = ['PNP', 'BFP', 'MDRRMO'];
    const sampleBarangays = [
      'Barangay Poblacion (Center)',
      'Barangay San Isidro',
      'Barangay Santa Cruz',
      'Barangay Riverside',
    ];

    const randomType = sampleTypes[Math.floor(Math.random() * sampleTypes.length)];
    const typeDef = INCIDENT_TYPES.find((t) => t.id === randomType)!;
    const randomAgency = sampleAgencies[Math.floor(Math.random() * sampleAgencies.length)];
    const randomBarangay = sampleBarangays[Math.floor(Math.random() * sampleBarangays.length)];

    const coords = {
      lat: 14.59 + (Math.random() - 0.5) * 0.04,
      lng: 120.98 + (Math.random() - 0.5) * 0.04,
    };

    submitIncidentReport({
      residentId: 'res-sim',
      residentName: 'Test Citizen Alert',
      residentPhone: '0917-888-0000',
      selectedAgency: randomAgency,
      initialTypeId: randomType,
      category: typeDef.category,
      dateTime: new Date().toISOString().slice(0, 16),
      barangay: randomBarangay,
      locationDetails: `Emergency near Commercial Plaza, ${randomBarangay}`,
      coordinates: coords,
      description: `[URGENT SIMULATED ALERT] Live 911 broadcast for ${typeDef.en} (${typeDef.fil}). Citizens requesting immediate unit dispatch.`,
      photoUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80',
      photoCaption: 'Automated dispatch satellite / citizen capture',
    });
  };

  return (
    <NexusContext.Provider
      value={{
        reports,
        isOnline,
        queuedSyncCount,
        syncOfflineQueue,
        activeRole,
        setActiveRole,
        portalMode,
        setPortalMode: handleSetPortalMode,
        language,
        setLanguage,
        soundMuted,
        setSoundMuted: handleSetSoundMuted,
        firebaseUser,
        residentUser,
        setResidentUser,
        updateResidentUser,
        acceptTerms,
        adminProfiles,
        agencyDetails,
        isAuthModalOpen,
        authModalInitialMode,
        openAuthModal,
        closeAuthModal,
        agencyUser,
        isAgencyAuthenticated,
        isAgencyAuthModalOpen,
        openAgencyAuthModal,
        closeAgencyAuthModal,
        isAgencyProfileModalOpen,
        openAgencyProfileModal,
        closeAgencyProfileModal,
        updateAgencyProfile,
        agencyLogin,
        agencyLogout,
        residentActiveTab,
        setResidentActiveTab,
        agencyActiveTab,
        setAgencyActiveTab,
        reportFormScrollTrigger,
        triggerScrollToReportForm,
        isHotlinesModalOpen,
        openHotlinesModal,
        closeHotlinesModal,
        incomingAlert,
        clearIncomingAlert,
        triggerEmergencySound,
        successModal,
        triggerSuccessModal,
        closeSuccessModal,
        submitIncidentReport,
        updateIncidentStatus,
        rejectIncidentReport,
        reclassifyIncidentReport,
        sendAssistanceRequest,
        acknowledgeAssistanceRequest,
        markAgencyReportsAsRead,
        simulateIncomingIncident,
        restoreRejectedReport,
        patrolUnits,
        updatePatrolStatus,
        savePatrolUnit,
        deletePatrolUnit,
        fireApparatus,
        updateApparatusStatus,
        saveFireApparatus,
        deleteFireApparatus,
        fireAlarmLevel,
        setFireAlarmLevel,
        medicalUnits,
        updateMedicalStatus,
        saveMedicalUnit,
        deleteMedicalUnit,
        evacuationCenters,
        updateEvacuationOccupancy,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
};

export function useNexus() {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
}
