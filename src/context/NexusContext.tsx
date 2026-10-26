import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Agency,
  IncidentReport,
  IncidentStatus,
  IncidentTypeId,
  UserProfile,
  Language,
} from '../types';
import { INITIAL_INCIDENT_REPORTS, INCIDENT_TYPES } from '../constants/incidentData';
import { playEmergencyAlertSound, playSuccessChime } from '../services/soundService';

interface IncomingAlertData {
  report: IncidentReport;
  timestamp: string;
}

interface NexusContextType {
  reports: IncidentReport[];
  activeRole: 'resident' | Agency;
  setActiveRole: (role: 'resident' | Agency) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  soundMuted: boolean;
  setSoundMuted: (muted: boolean) => void;
  residentUser: UserProfile;
  updateResidentUser: (updates: Partial<UserProfile>) => void;
  acceptTerms: () => void;
  adminProfiles: Record<Agency, { name: string; title: string; badgeNumber: string }>;
  
  // Real-time notification & flashing indicator
  incomingAlert: IncomingAlertData | null;
  clearIncomingAlert: () => void;
  triggerEmergencySound: () => void;

  // Actions
  submitIncidentReport: (newReport: Omit<IncidentReport, 'id' | 'trackingCode' | 'status' | 'history' | 'assistanceRequests' | 'isUnreadForAgencies' | 'createdAt' | 'updatedAt'>) => IncidentReport;
  updateIncidentStatus: (reportId: string, status: IncidentStatus, adminName: string, agency: Agency, details?: string) => void;
  rejectIncidentReport: (reportId: string, reason: string, adminName: string, agency: Agency) => void;
  reclassifyIncidentReport: (reportId: string, newTypeId: IncidentTypeId, adminName: string, agency: Agency) => void;
  sendAssistanceRequest: (reportId: string, fromAgency: Agency, targetAgencies: Agency[], urgency: 'Routine' | 'Urgent' | 'Critical', note: string, requestedBy: string) => void;
  acknowledgeAssistanceRequest: (reportId: string, requestId: string, agency: Agency, acknowledgedBy: string, actionNote?: string) => void;
  markAgencyReportsAsRead: (agency: Agency) => void;
  simulateIncomingIncident: () => void;
  restoreRejectedReport: (reportId: string, adminName: string, agency: Agency) => void;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

const STORAGE_KEY = 'nexus_emergency_reports_v2';
const RESIDENT_STORAGE_KEY = 'nexus_resident_user_v2';

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load reports from LocalStorage or initialize with seed data
  const [reports, setReports] = useState<IncidentReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_INCIDENT_REPORTS;
  });

  const [activeRole, setActiveRole] = useState<'resident' | Agency>('PNP');
  const [language, setLanguage] = useState<Language>('en');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [incomingAlert, setIncomingAlert] = useState<IncomingAlertData | null>(null);

  const [adminProfiles] = useState<Record<Agency, { name: string; title: string; badgeNumber: string }>>({
    PNP: { name: 'Col. M. Santos', title: 'Chief of Police', badgeNumber: 'PNP-8849-NCR' },
    BFP: { name: 'Capt. E. Ramos', title: 'City Fire Marshal', badgeNumber: 'BFP-3312-DIV4' },
    MDRRMO: { name: 'Dir. A. Reyes', title: 'MDRRMO Operations Head', badgeNumber: 'DRRM-9901-LGU' },
  });

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
      barangay: 'Barangay Poblacion (Center)',
      address: 'Block 4 Lot 19, Sampaguita Street',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      termsAccepted: true,
      termsAcceptedAt: '2026-10-15T10:00:00',
    };
  });

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
    setResidentUser((prev) => ({ ...prev, ...updates }));
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

  // Submit new incident report
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
      verifiedTypeId: undefined,
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
      // Notify all three agencies in the centralized database!
      isUnreadForAgencies: {
        PNP: true,
        BFP: true,
        MDRRMO: true,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setReports((prev) => [report, ...prev]);

    // Trigger visual flashing notification and siren alert across all 3 dashboards!
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
    agency: Agency,
    details?: string
  ) => {
    const now = new Date().toISOString();

    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

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

        return {
          ...rep,
          status: newStatus,
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };
      })
    );

    playSuccessChime(soundMuted);
  };

  // Reject report: Move to Rejected Reports Archive and remove from active dashboard and map
  const rejectIncidentReport = (
    reportId: string,
    reason: string,
    adminName: string,
    agency: Agency
  ) => {
    const now = new Date().toISOString();

    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

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

        return {
          ...rep,
          status: 'Rejected',
          rejection: {
            reason,
            rejectedAt: now,
            rejectedByAdmin: adminName,
            agency,
          },
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };
      })
    );
  };

  // Restore rejected report if needed
  const restoreRejectedReport = (reportId: string, adminName: string, agency: Agency) => {
    const now = new Date().toISOString();
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;
        return {
          ...rep,
          status: 'Pending Verification',
          rejection: undefined,
          updatedAt: now,
          history: [
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              adminName,
              agency,
              action: 'Restored from Rejected Archive',
              details: `Restored to active review pool by ${adminName} (${agency}).`,
              previousStatus: 'Rejected',
              newStatus: 'Pending Verification',
            },
            ...rep.history,
          ],
        };
      })
    );
  };

  // Reclassify incident classification after verification
  const reclassifyIncidentReport = (
    reportId: string,
    newTypeId: IncidentTypeId,
    adminName: string,
    agency: Agency
  ) => {
    const now = new Date().toISOString();
    const typeDef = INCIDENT_TYPES.find((t) => t.id === newTypeId);
    if (!typeDef) return;

    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        const auditEntry = {
          id: `hist-${Date.now()}`,
          timestamp: now,
          adminName,
          agency,
          action: 'Incident Classification Updated',
          details: `Reclassified to "${typeDef.en} (${typeDef.fil})" [Category: ${typeDef.category}] following official verification.`,
        };

        return {
          ...rep,
          verifiedTypeId: newTypeId,
          category: typeDef.category,
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };
      })
    );
  };

  // Inter-Agency Coordination: Request Assistance
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

    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

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

        const targetList = targetAgencies.join(' and ');
        const auditEntry = {
          id: `hist-${Date.now()}`,
          timestamp: now,
          adminName: requestedBy,
          agency: fromAgency,
          action: 'Assistance Requested',
          details: `Requested inter-agency backup from [${targetList}]. Urgency: ${urgency}. Note: "${note}"`,
        };

        // Mark unread for target agencies
        const updatedUnread = { ...rep.isUnreadForAgencies };
        targetAgencies.forEach((a) => {
          updatedUnread[a] = true;
        });

        return {
          ...rep,
          assistanceRequests: [newRequest, ...rep.assistanceRequests],
          isUnreadForAgencies: updatedUnread,
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };
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
          const newAcks = exists
            ? req.acknowledgments
            : [
                ...req.acknowledgments,
                {
                  agency,
                  acknowledgedBy,
                  acknowledgedAt: now,
                  actionNote: actionNote || 'Unit acknowledged and mobilizing support.',
                },
              ];

          const allAcknowledged = req.targetAgencies.every((target) =>
            newAcks.some((a) => a.agency === target)
          );

          return {
            ...req,
            acknowledgments: newAcks,
            status: (allAcknowledged ? 'Acknowledged' : 'Pending') as 'Pending' | 'Acknowledged',
          };
        });

        const auditEntry = {
          id: `hist-${Date.now()}`,
          timestamp: now,
          adminName: acknowledgedBy,
          agency,
          action: 'Assistance Acknowledged',
          details: `${agency} officer acknowledged assistance request for this incident. Note: ${actionNote || 'Acknowledged and coordinating response.'}`,
        };

        return {
          ...rep,
          assistanceRequests: updatedRequests,
          updatedAt: now,
          history: [auditEntry, ...rep.history],
        };
      })
    );

    playSuccessChime(soundMuted);
  };

  // Clear unread indicator for a specific agency
  const markAgencyReportsAsRead = (agency: Agency) => {
    setReports((prev) =>
      prev.map((rep) => ({
        ...rep,
        isUnreadForAgencies: {
          ...rep.isUnreadForAgencies,
          [agency]: false,
        },
      }))
    );
  };

  // Quick simulation tool to test real-time sirens, alerts, and multi-agency view
  const simulateIncomingIncident = () => {
    const sampleTypes: IncidentTypeId[] = [
      'medical_emergency',
      'fire_incident',
      'armed_threat',
      'road_accident',
      'suspected_killing',
    ];
    const sampleAgencies: Agency[] = ['BFP', 'PNP', 'MDRRMO'];
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
        activeRole,
        setActiveRole,
        language,
        setLanguage,
        soundMuted,
        setSoundMuted,
        residentUser,
        updateResidentUser,
        acceptTerms,
        adminProfiles,
        incomingAlert,
        clearIncomingAlert,
        triggerEmergencySound,
        submitIncidentReport,
        updateIncidentStatus,
        rejectIncidentReport,
        reclassifyIncidentReport,
        sendAssistanceRequest,
        acknowledgeAssistanceRequest,
        markAgencyReportsAsRead,
        simulateIncomingIncident,
        restoreRejectedReport,
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
