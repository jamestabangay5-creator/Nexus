export type Agency = 'PNP' | 'BFP' | 'MDRRMO';

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
  agency: Agency | 'Resident' | 'System';
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
  history: AuditLogEntry[];
  assistanceRequests: AssistanceRequest[];
  isUnreadForAgencies: Record<Agency, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'resident' | 'admin';
  agency?: Agency;
  badgeTitle?: string;
  email: string;
  phone: string;
  barangay: string;
  address: string;
  avatarUrl: string;
  termsAccepted: boolean;
  termsAcceptedAt?: string;
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
