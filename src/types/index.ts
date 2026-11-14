export type Agency = 'PNP' | 'BFP' | 'MDRRMO';
export type AgencyScope = 'CENTRAL' | Agency;
export type PortalMode = 'landing' | 'resident' | 'agency';

export interface AgencyUser {
  uid?: string;
  email: string;
  name: string;
  title: string;
  badgeNumber: string;
  agency: AgencyScope;
  role: 'admin' | 'dispatcher';
  isSystemAdmin: boolean;
}

export interface AgencyProfileSettings {
  agency: AgencyScope;
  name: string;
  title: string;
  badgeNumber: string;
  email: string;
  hotline: string;
  descriptionEn: string;
  descriptionFil: string;
  stationAddress?: string;
}

export type IncidentCategoryColor = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE' | 'WHITE';

export type IncidentStatus = 'Pending Verification' | 'Accepted' | 'Ongoing' | 'Resolved' | 'Rejected';

export type IncidentTypeId =
  // RED - Critical Safety Incidents
  | 'suspected_killing'
  | 'person_unresponsive'
  | 'suspected_sexual_assault'
  | 'armed_threat'
  // ORANGE - Accidents and Emergencies
  | 'road_accident'
  | 'fire_incident'
  | 'medical_emergency'
  | 'flooding_landslide'
  | 'missing_person'
  // YELLOW - Suspected Criminal Activities
  | 'theft_robbery'
  | 'suspected_break_in'
  | 'scam_fraud'
  | 'illegal_drug'
  | 'physical_assault'
  // GREEN - Community and Personal Safety Concerns
  | 'vandalism'
  | 'public_disturbance'
  | 'domestic_violence'
  | 'sexual_harassment'
  | 'threats_intimidation'
  // BLUE - Community Complaints and Online Incidents
  | 'noise_complaint'
  | 'drunk_disorderly'
  | 'cyber_harassment'
  | 'online_threats'
  // WHITE - Other
  | 'not_sure_other';

export interface IncidentTypeDefinition {
  id: IncidentTypeId;
  number: number;
  en: string;
  fil: string;
  category: IncidentCategoryColor;
  categoryNameEn: string;
  categoryNameFil: string;
  colorHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  primaryAgency: Agency;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminName: string;
  agency: AgencyScope | 'Resident' | 'System';
  action: string;
  details: string;
  previousStatus?: IncidentStatus;
  newStatus?: IncidentStatus;
}

export interface AssistanceRequest {
  id: string;
  reportId: string;
  fromAgency: Agency;
  targetAgencies: Agency[];
  requestedAt: string;
  requestedBy: string;
  urgency: 'Routine' | 'Urgent' | 'Critical';
  note: string;
  status: 'Pending' | 'Acknowledged';
  acknowledgments: {
    agency: Agency;
    acknowledgedBy: string;
    acknowledgedAt: string;
    actionNote?: string;
  }[];
}

export interface IncidentReport {
  id: string;
  trackingCode: string;
  residentId: string;
  residentName: string;
  residentPhone: string;
  selectedAgency: Agency;
  initialTypeId: IncidentTypeId;
  verifiedTypeId?: IncidentTypeId;
  category: IncidentCategoryColor;
  status: IncidentStatus;
  dateTime: string;
  province?: string;
  municipality?: string;
  barangay: string;
  locationDetails: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  photoUrl?: string;
  photoCaption?: string;
  rejection?: {
    reason: string;
    rejectedAt: string;
    rejectedByAdmin: string;
    agency: Agency;
  };
  isFalseAlarm?: boolean;
  falseAlarmDetails?: {
    flaggedAt: string;
    flaggedBy: string;
    agency: AgencyScope;
    reason: string;
    actionTaken: 'warning_issued' | 'account_deactivated';
    offenseNumber: number;
  };
  resolution?: {
    resolvedAt: string;
    resolvedByAdmin: string;
    agency: AgencyScope;
    notes?: string;
  };
  history: AuditLogEntry[];
  assistanceRequests: AssistanceRequest[];
  isUnreadForAgencies: Record<Agency, boolean>;
  isUnreadForResident?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  role: 'resident' | 'admin';
  agency?: Agency;
  badgeTitle?: string;
  email: string;
  phone: string;
  province?: string;
  municipality?: string;
  barangay: string;
  address: string;
  avatarUrl: string;
  termsAccepted: boolean;
  termsAcceptedAt?: string;
  isVerifiedIdentity?: boolean;
  authProvider?: 'google' | 'password' | 'demo';
  falseAlarmCount?: number;
  warnings?: Array<{
    id: string;
    reportId: string;
    trackingCode: string;
    reason: string;
    issuedAt: string;
    issuedBy: string;
    agency: AgencyScope;
  }>;
  accountStatus?: 'active' | 'warned' | 'deactivated';
  deactivatedAt?: string;
  deactivationReason?: string;
  deactivatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TimeFilterPeriod = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface FilterOptions {
  barangay: string;
  category: string;
  agency: string;
  status: string;
  period: TimeFilterPeriod;
  searchQuery: string;
  verifiedOnly: boolean;
}

export type Language = 'en' | 'fil';

// Specialized Agency Operational Resource Types
export interface PatrolUnit {
  id: string;
  callSign: string;
  division: string;
  sector: string;
  status: 'On Patrol' | 'Dispatched' | 'Standby' | 'Maintenance';
  officerInCharge: string;
  driverName?: string;
  crewMembers?: string;
  contactNumber?: string;
  shift?: string;
  scheduledDispatch?: string;
  vehiclePlate?: string;
}

export interface FireApparatus {
  id: string;
  callSign: string;
  type: 'Pumper Engine' | 'Ladder Truck' | 'Water Tanker' | 'Rescue Truck';
  station: string;
  status: 'In Station' | 'En Route' | 'On Scene' | 'Maintenance' | 'Standby';
  waterLevelPercent: number;
  officerInCharge?: string;
  driverName?: string;
  crewMembers?: string;
  contactNumber?: string;
  shift?: string;
  scheduledDispatch?: string;
  vehiclePlate?: string;
}

export type FireAlarmLevel = '1st Alarm' | '2nd Alarm' | '3rd Alarm' | '4th Alarm' | '5th Alarm' | 'Task Force Alpha' | 'General Alarm';

export interface MedicalUnit {
  id: string;
  callSign: string;
  type: 'Type-1 Ambulance' | 'Rescue Boat' | 'SAR Quick Response';
  base: string;
  status: 'Available' | 'Dispatched' | 'Patient Transit' | 'Hospital Turnover' | 'Maintenance';
  paramedicLead: string;
  driverName?: string;
  crewMembers?: string;
  contactNumber?: string;
  shift?: string;
  scheduledDispatch?: string;
  vehiclePlate?: string;
}

export interface EvacuationCenter {
  id: string;
  name: string;
  municipality: string;
  capacity: number;
  currentOccupants: number;
  status: 'Active' | 'Standby' | 'Full';
  reliefStockStatus: 'Adequate' | 'Replenishment Needed' | 'Critical';
}

export interface SuccessModalData {
  title: string;
  message: string;
  trackingCode?: string;
  agency?: AgencyScope;
  statusBadge?: string;
  actionType?: 'submit' | 'resolve' | 'reject' | 'assistance' | 'status' | 'restore' | 'save' | 'auth' | 'general';
  details?: string;
  autoCloseMs?: number;
}

