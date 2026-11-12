import React, { useState } from 'react';
import { Agency, AgencyScope } from '../../types';
import { ShieldAlert, Flame, Activity, Radio } from 'lucide-react';

export const AGENCY_LOGOS: Record<AgencyScope, string> = {
  PNP: '/logos/pnp.svg',
  BFP: '/logos/bfp.png',
  MDRRMO: '/logos/mdrrmo.svg',
  CENTRAL: '/logos/central.png',
};

export const AGENCY_SEAL_ALT: Record<AgencyScope, string> = {
  PNP: 'Official Philippine National Police (PNP) Seal',
  BFP: 'Official Bureau of Fire Protection (BFP) Seal',
  MDRRMO: 'Official Disaster Risk Reduction & Management (MDRRMO/OCD) Seal',
  CENTRAL: 'Official Emergency 911 / DILG Central Command Seal',
};

interface AgencyLogoProps {
  agency?: AgencyScope | Agency | string | null;
  className?: string;
  alt?: string;
  fallbackIconClassName?: string;
  animate?: boolean;
}

export const AgencyLogo: React.FC<AgencyLogoProps> = ({
  agency = 'CENTRAL',
  className = 'w-6 h-6',
  alt,
  fallbackIconClassName,
  animate = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const normalizedKey = (agency ? String(agency).toUpperCase() : 'CENTRAL') as AgencyScope;
  const logoSrc = AGENCY_LOGOS[normalizedKey];

  if (!logoSrc || hasError) {
    const iconClass = fallbackIconClassName || className;
    if (normalizedKey === 'PNP') {
      return <ShieldAlert className={`${iconClass} text-blue-600 ${animate ? 'animate-pulse' : ''}`} />;
    }
    if (normalizedKey === 'BFP') {
      return <Flame className={`${iconClass} text-orange-600 ${animate ? 'animate-pulse' : ''}`} />;
    }
    if (normalizedKey === 'MDRRMO') {
      return <Activity className={`${iconClass} text-emerald-600 ${animate ? 'animate-pulse' : ''}`} />;
    }
    return <Radio className={`${iconClass} text-purple-600 ${animate ? 'animate-pulse' : ''}`} />;
  }

  return (
    <img
      src={logoSrc}
      alt={alt || AGENCY_SEAL_ALT[normalizedKey] || `${normalizedKey} Seal`}
      onError={() => setHasError(true)}
      className={`${className} object-contain shrink-0`}
      loading="eager"
      decoding="async"
    />
  );
};

