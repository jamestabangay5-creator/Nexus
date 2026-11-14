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
