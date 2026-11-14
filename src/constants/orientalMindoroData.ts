/**
 * Official Administrative Boundaries for Municipality of Bongabong, Oriental Mindoro
 * Pilot Implementation Scope: Exclusive to the Municipality of Bongabong, Oriental Mindoro
 */

import { AgencyScope } from '../types';

export const PROVINCE_NAME = 'Oriental Mindoro';
export const PILOT_MUNICIPALITY = 'Bongabong';

export const ORIENTAL_MINDORO_MUNICIPALITIES = [
  'Bongabong',
] as const;

export type OrientalMindoroMunicipality = typeof ORIENTAL_MINDORO_MUNICIPALITIES[number];

// Official Municipal Coordinates for Bongabong, Oriental Mindoro for incident response & map centering
export const MUNICIPALITY_COORDINATES: Record<OrientalMindoroMunicipality, { lat: number; lng: number }> = {
  'Bongabong': { lat: 12.7508, lng: 121.4864 },
};

export interface AgencyStationLocation {
  agency: AgencyScope;
  name: string;
  shortName: string;
  fullName: string;
  lat: number;
  lng: number;
  address: string;
  hotline: string;
  email: string;
  color: string;
  borderColor: string;
  logo: string;
  officerInCharge: string;
  dutyChief: string;
}

// Official Actual Coordinates for Emergency Agencies in Bongabong, Oriental Mindoro
export const BONGABONG_AGENCY_STATIONS: Record<AgencyScope, AgencyStationLocation> = {
  PNP: {
    agency: 'PNP',
    name: 'Bongabong Police Station',
    shortName: 'PNP Station',
    fullName: 'Philippine National Police — Bongabong Municipal Police Station',
    lat: 12.748707,
    lng: 121.487856,
    address: 'National Highway, Poblacion, Bongabong, Oriental Mindoro (Near KLM Eureka College & Ebreo Beach)',
    hotline: '(043) 283-5192 / 0998-598-6086',
    email: 'pnp.admin@nexus.gov.ph',
    color: '#2563eb',
    borderColor: '#1d4ed8',
    logo: '/logos/pnp.svg',
    officerInCharge: 'PMAJ. M. Santos',
    dutyChief: 'Bongabong Chief of Police',
  },
  BFP: {
    agency: 'BFP',
    name: 'Bongabong Fire Station',
    shortName: 'BFP Station',
    fullName: 'Bureau of Fire Protection — Bongabong Municipal Fire Station',
    lat: 12.735629,
    lng: 121.473102,
    address: 'Barangay Batangan, Bongabong, Oriental Mindoro (Near Batingan Elementary & Regional Evacuation Center)',
    hotline: '(043) 283-5161 / 0915-602-2122',
    email: 'bfp.admin@nexus.gov.ph',
    color: '#ea580c',
    borderColor: '#c2410c',
    logo: '/logos/bfp.png',
    officerInCharge: 'Capt. E. Ramos',
    dutyChief: 'Bongabong Municipal Fire Marshal',
  },
  MDRRMO: {
    agency: 'MDRRMO',
    name: 'MDRRMO Bongabong Operations Center',
    shortName: 'MDRRMO EOC',
    fullName: 'Municipal Disaster Risk Reduction & Management Office — Bongabong',
    lat: 12.748511,
    lng: 121.489472,
    address: 'Municipal Hall Compound / Aplaya, Bongabong, Oriental Mindoro',
    hotline: '(043) 283-5353 / 0966-476-8806',
    email: 'mdrrmo.admin@nexus.gov.ph',
    color: '#059669',
    borderColor: '#047857',
    logo: '/logos/mdrrmo.jpg',
    officerInCharge: 'Dir. A. Reyes',
    dutyChief: 'MDRRMO Operations Head',
  },
  CENTRAL: {
    agency: 'CENTRAL',
    name: 'Nexus Unified Joint Operations Command',
    shortName: 'Central Command',
    fullName: 'Nexus Joint Emergency Operations Center — Bongabong',
    lat: 12.748511,
    lng: 121.489472,
    address: 'Central Command Center, Municipal Hall Compound, Bongabong, Oriental Mindoro',
    hotline: '911 Central / (043) 283-5353',
    email: 'systemadmin@nexus.gov.ph',
    color: '#7c3aed',
    borderColor: '#6d28d9',
    logo: '/logos/central.png',
    officerInCharge: 'Chief Insp. R. Fernandez',
    dutyChief: 'Centralized Operations Chief',
  },
};

/**
 * Calculates straight line & road network adjusted distance in kilometers between two coordinates
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;
  // Road network tortuosity adjustment (~1.25x in Bongabong municipal road network)
  const roadDistance = straightDistance * 1.25;
  return Number(roadDistance.toFixed(2));
};

/**
 * Calculates estimated response transit time in minutes at average emergency speed
 */
export const calculateEtaMinutes = (distanceKm: number, speedKmH: number = 42): number => {
  const hours = distanceKm / speedKmH;
  const minutes = Math.max(1, Math.round(hours * 60));
  return minutes;
};

// All 32 official barangays of the Municipality of Bongabong, Oriental Mindoro
export const BONGABONG_BARANGAYS = [
  'Anilao',
  'Batangan',
  'Camantigue',
  'Carmundo',
  'Cawayan',
  'Dayhagan',
  'Formon',
  'Hagan',
  'Hagupit',
  'Ipil',
  'Kaligtasan',
  'Labasan',
  'Labonan',
  'Libertad',
  'Lisap',
  'Luna',
  'Malitbog',
  'Mapang',
  'Masaguisi',
  'Mina de Oro',
  'Morente',
  'Orconuma',
  'Poblacion',
  'Polusahi',
  'Sagana',
  'San Isidro',
  'San Jose',
  'San Juan',
  'Santa Cruz',
  'Sigange',
  'Tawas',
  'Villapag-asa',
] as const;

export const ORIENTAL_MINDORO_BARANGAYS: Record<OrientalMindoroMunicipality, string[]> = {
  'Bongabong': [...BONGABONG_BARANGAYS],
};

// Official coordinates for each of the 32 official barangays in Bongabong, Oriental Mindoro
export const BONGABONG_BARANGAY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Anilao': { lat: 12.7750, lng: 121.4720 },
  'Batangan': { lat: 12.7300, lng: 121.4500 },
  'Camantigue': { lat: 12.7400, lng: 121.4480 },
  'Carmundo': { lat: 12.7310, lng: 121.4350 },
  'Cawayan': { lat: 12.7210, lng: 121.4750 },
  'Dayhagan': { lat: 12.7720, lng: 121.4910 },
  'Formon': { lat: 12.7840, lng: 121.4650 },
  'Hagan': { lat: 12.7150, lng: 121.4320 },
  'Hagupit': { lat: 12.7380, lng: 121.4620 },
  'Ipil': { lat: 12.7410, lng: 121.4880 },
  'Kaligtasan': { lat: 12.7610, lng: 121.4680 },
  'Labasan': { lat: 12.7630, lng: 121.4920 },
  'Labonan': { lat: 12.7670, lng: 121.4780 },
  'Libertad': { lat: 12.7480, lng: 121.4410 },
  'Lisap': { lat: 12.6950, lng: 121.3950 },
  'Luna': { lat: 12.7580, lng: 121.4560 },
  'Malitbog': { lat: 12.7513, lng: 121.4885 },
  'Mapang': { lat: 12.7690, lng: 121.4420 },
  'Masaguisi': { lat: 12.7350, lng: 121.4810 },
  'Mina de Oro': { lat: 12.7440, lng: 121.4690 },
  'Morente': { lat: 12.7080, lng: 121.4150 },
  'Orconuma': { lat: 12.7790, lng: 121.4520 },
  'Poblacion': { lat: 12.7508, lng: 121.4864 },
  'Polusahi': { lat: 12.7280, lng: 121.4190 },
  'Sagana': { lat: 12.7530, lng: 121.4280 },
  'San Isidro': { lat: 12.7620, lng: 121.4380 },
  'San Jose': { lat: 12.7450, lng: 121.4120 },
  'San Juan': { lat: 12.7700, lng: 121.4250 },
  'Santa Cruz': { lat: 12.7860, lng: 121.4390 },
  'Sigange': { lat: 12.7180, lng: 121.3850 },
  'Tawas': { lat: 12.7890, lng: 121.4820 },
  'Villapag-asa': { lat: 12.6850, lng: 121.3650 },
};

/**
 * Automatically determine the closest Bongabong Barangay based on detected GPS coordinates
 */
export const getBarangayFromCoordinates = (lat: number, lng: number): string => {
  let closestBrgy = 'Poblacion';
  let minDistanceSq = Infinity;

  for (const [brgy, pt] of Object.entries(BONGABONG_BARANGAY_COORDINATES)) {
    const dLat = pt.lat - lat;
    const dLng = (pt.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const distSq = dLat * dLat + dLng * dLng;

    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestBrgy = brgy;
    }
  }

  return closestBrgy;
};

/**
 * Returns the list of barangays for Bongabong.
 */
export const getBarangaysForMunicipality = (_municipality?: string): string[] => {
  return [...BONGABONG_BARANGAYS];
};

/**
 * Deduplicated, sorted list of all 32 barangays in Bongabong, Oriental Mindoro
 */
export const ALL_UNIQUE_ORIENTAL_MINDORO_BARANGAYS: string[] = [...BONGABONG_BARANGAYS].sort((a, b) =>
  a.localeCompare(b)
);

/**
 * Helper to get barangays for filter dropdowns.
 */
export const getAllBarangaysForFilter = (_selectedMunicipality?: string): string[] => {
  return ALL_UNIQUE_ORIENTAL_MINDORO_BARANGAYS;
};

/**
 * Default fallback list of barangays (Bongabong)
 */
export const DEFAULT_ORIENTAL_MINDORO_BARANGAYS = [...BONGABONG_BARANGAYS];
