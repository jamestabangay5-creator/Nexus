/**
 * Official Administrative Boundaries for Municipality of Bongabong, Oriental Mindoro
 * Pilot Implementation Scope: Exclusive to the Municipality of Bongabong, Oriental Mindoro
 */

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
