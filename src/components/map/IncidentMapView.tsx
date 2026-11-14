import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useNexus } from '../../context/NexusContext';
import { IncidentReport, IncidentCategoryColor, IncidentTypeId, Agency, AgencyScope } from '../../types';
import { INCIDENT_TYPES, CATEGORY_INFO } from '../../constants/incidentData';
import {
  ORIENTAL_MINDORO_MUNICIPALITIES,
  ORIENTAL_MINDORO_BARANGAYS,
  getBarangaysForMunicipality,
  getAllBarangaysForFilter,
  MUNICIPALITY_COORDINATES,
  OrientalMindoroMunicipality,
  BONGABONG_AGENCY_STATIONS,
  calculateDistanceKm,
  calculateEtaMinutes,
  AgencyStationLocation,
} from '../../constants/orientalMindoroData';
import { TRANSLATIONS } from '../../constants/translations';
import { AgencyLogo } from '../common/AgencyLogo';
import {
  Layers,
  Filter,
  Flame,
  Shield,
  Eye,
  CheckCircle,
  Tag,
  MapPin,
  Calendar,
  User,
  Info,
  Maximize2,
  Sliders,
  Clock,
  Phone,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  List,
  Map as MapIcon,
  Satellite,
  Globe,
  Building2,
  Volume2,
  VolumeX,
  X,
  Radio,
  Camera,
  ShieldCheck,
  Lock,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import { startContinuousCriticalAlarm, stopContinuousCriticalAlarm } from '../../services/soundService';
import { ReportDetailModal } from '../admin/ReportDetailModal';

export type MapTileMode = 'osm' | 'satellite' | 'hybrid' | 'dark';

interface Props {
  onSelectReport?: (reportId: string) => void;
  standalone?: boolean;
}

export const IncidentMapView: React.FC<Props> = ({ onSelectReport, standalone = false }) => {
  const {
    reports,
    activeRole,
    language,
    isOnline,
    reclassifyIncidentReport,
    updateIncidentStatus,
    adminProfiles,
    soundMuted,
    portalMode,
    residentUser,
    isAgencyAuthenticated,
    agencyUser,
    firebaseUser,
  } = useNexus();

  const isAgencyViewer =
    portalMode === 'agency' &&
    activeRole !== 'resident' &&
    (isAgencyAuthenticated || agencyUser !== null);

  // Requirement 2: Citizen Heatmap Privacy
  // If viewing as an Agency / System Admin, display all reported incidents across Bongabong.
  // If viewing as a Resident Citizen, restrict display strictly to incidents reported by the currently logged-in citizen.
  const scopedReports = useMemo(() => {
    if (isAgencyViewer) {
      return reports;
    }
    // Resident Citizen View: strictly my reports
    return reports.filter((r) => {
      return Boolean(
        (residentUser?.id && r.residentId === residentUser.id) ||
        (residentUser?.name && r.residentName.toLowerCase() === residentUser.name.toLowerCase()) ||
        (residentUser?.email && r.residentEmail && r.residentEmail.toLowerCase() === residentUser.email.toLowerCase()) ||
        (firebaseUser?.uid && (r.residentId === firebaseUser.uid || (r as any).residentUid === firebaseUser.uid))
      );
    });
  }, [reports, isAgencyViewer, residentUser, firebaseUser]);

  const t = TRANSLATIONS[language];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const stationsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const markerObjMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Real-time Dispatch Route and Distance Info for selected incident
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    etaMinutes: number;
    station: AgencyStationLocation;
    isRoadRoute: boolean;
  } | null>(null);

  // Filters state with Oriental Mindoro Municipality & Barangay
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('Bongabong');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | '24h' | '7d' | '30d' | 'specific' | 'range'>('ALL');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [includeRejected, setIncludeRejected] = useState<boolean>(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const mapDateValidationError = useMemo(() => {
    if (dateFilter === 'specific') {
      if (specificDate && specificDate > todayStr) {
        return 'Date cannot be in the future. Reports can only be mapped up to today.';
      }
    }
    if (dateFilter === 'range') {
      if (startDate && startDate > todayStr) {
        return 'Start date cannot be in the future. Reports can only be mapped up to today.';
      }
      if (endDate && endDate > todayStr) {
        return 'End date cannot be in the future. Please select today or an earlier date.';
      }
      if (startDate && endDate && startDate > endDate) {
        return "Invalid date range: 'From' date cannot be after 'To' date.";
      }
    }
    return null;
  }, [dateFilter, specificDate, startDate, endDate, todayStr]);

  // Map display controls
  const [mapMode, setMapMode] = useState<MapTileMode>('osm');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [heatIntensity, setHeatIntensity] = useState<'low' | 'med' | 'high'>('med');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<'details' | 'list'>('details');
  const [mobileMapTab, setMobileMapTab] = useState<'map' | 'dossier'>('map');

  // Silenced continuous alarm for currently selected critical report
  const [silencedReportId, setSilencedReportId] = useState<string | null>(null);

  // Fallback internal dossier modal state if parent didn't pass onSelectReport
  const [internalDossierReportId, setInternalDossierReportId] = useState<string | null>(null);

  // Auto-fit initial flag
  const hasAutoFittedInitial = useRef(false);

  // Calculate incident counts per color category for UI badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: 0,
      RED: 0,
      ORANGE: 0,
      YELLOW: 0,
      GREEN: 0,
      BLUE: 0,
      WHITE: 0,
    };
    scopedReports.forEach((r) => {
      if (!includeRejected && r.status === 'Rejected') return;
      counts.ALL += 1;
      if (counts[r.category] !== undefined) {
        counts[r.category] += 1;
      } else {
        counts.WHITE += 1;
      }
    });
    return counts;
  }, [scopedReports, includeRejected]);

  const handleInspectDossier = (reportId: string) => {
    setSelectedReportId(reportId);
    setSilencedReportId(null);
    setActiveSideTab('details');
    setMobileMapTab('dossier');
    if (onSelectReport) {
      onSelectReport(reportId);
    } else {
      setInternalDossierReportId(reportId);
    }
  };

  // Capture clicks on any "Inspect Incident Dossier" button (especially in Leaflet popups)
  useEffect(() => {
    const handleGlobalInspectClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('[data-action="inspect-dossier"]') as HTMLElement | null;
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const repId = btn.getAttribute('data-report-id');
        if (repId) {
          handleInspectDossier(repId);
        }
      }
    };

    document.addEventListener('click', handleGlobalInspectClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalInspectClick, true);
    };
  }, [onSelectReport]);

  // Filter reports
  const filteredReports = useMemo(() => {
    const now = Date.now();

    return scopedReports.filter((r) => {
      // By default exclude rejected unless explicitly toggled
      if (!includeRejected && r.status === 'Rejected') return false;

      // Category filter
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;

      // Oriental Mindoro Municipality filter
      if (selectedMunicipality !== 'ALL' && (r.municipality || 'Calapan City') !== selectedMunicipality) return false;

      // Barangay filter
      if (selectedBarangay !== 'ALL' && r.barangay !== selectedBarangay) return false;

      // Status filter
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;

      // Date filter (Requirement 8)
      if (dateFilter !== 'ALL') {
        const repTime = new Date(r.createdAt || r.dateTime).getTime();
        const diffHours = (now - repTime) / (1000 * 60 * 60);
        if (dateFilter === '24h' && diffHours > 24) return false;
        if (dateFilter === '7d' && diffHours > 24 * 7) return false;
        if (dateFilter === '30d' && diffHours > 24 * 30) return false;
        if (dateFilter === 'specific' && specificDate && !mapDateValidationError) {
          const repDate = new Date(r.createdAt || r.dateTime).toISOString().slice(0, 10);
          if (repDate !== specificDate) return false;
        }
        if (dateFilter === 'range' && !mapDateValidationError) {
          if (startDate) {
            const startMs = new Date(startDate + 'T00:00:00').getTime();
            if (repTime < startMs) return false;
          }
          if (endDate) {
            const endMs = new Date(endDate + 'T23:59:59.999').getTime();
            if (repTime > endMs) return false;
          }
        }
      }

      // Search query - Privacy Shield (RA 10173):
      // Only authorized agency dispatchers or the citizen who filed the report can query by citizen name
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = r.trackingCode.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchMuni = (r.municipality || '').toLowerCase().includes(q);
        const matchBrgy = r.barangay.toLowerCase().includes(q);
        const isMyReport = Boolean(
          (residentUser?.id && r.residentId === residentUser.id) ||
          (residentUser?.name && r.residentName.toLowerCase() === residentUser.name.toLowerCase()) ||
          (residentUser?.email && r.residentEmail && r.residentEmail.toLowerCase() === residentUser.email.toLowerCase())
        );
        const matchCitizen = (isAgencyViewer || isMyReport) && r.residentName.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchMuni && !matchBrgy && !matchCitizen) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [scopedReports, includeRejected, selectedCategory, selectedMunicipality, selectedBarangay, selectedStatus, dateFilter, specificDate, startDate, endDate, searchQuery]);

  const selectedReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  // Continuous Critical Notification Sound Alarm for RED Category Reports
  // Sounds continuously when a RED:Critical report is clicked on the map,
  // and automatically stops when the agency clicks another report or deselects.
  useEffect(() => {
    if (
      !selectedReport ||
      selectedReport.category !== 'RED' ||
      selectedReport.status === 'Resolved' ||
      selectedReport.status === 'Rejected' ||
      silencedReportId === selectedReport.id ||
      soundMuted
    ) {
      stopContinuousCriticalAlarm();
      return;
    }

    // Start continuous notification sound
    startContinuousCriticalAlarm(soundMuted);

    return () => {
      stopContinuousCriticalAlarm();
    };
  }, [selectedReportId, selectedReport?.category, selectedReport?.status, silencedReportId, soundMuted]);

  // Stop sound if agency navigates away or component unmounts
  useEffect(() => {
    return () => {
      stopContinuousCriticalAlarm();
    };
  }, []);

  // Initialize Map centered on Oriental Mindoro
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.7508, 121.4864],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Attribution in bottom right with clear branding
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> | Esri Satellite | Bongabong Emergency GIS Operations')
        .addTo(map);

      // Base tile layer group added first so pins & heatmaps render on top
      const tileGroup = L.layerGroup().addTo(map);
      tileLayerGroupRef.current = tileGroup;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      const stationsGroup = L.layerGroup().addTo(map);
      stationsLayerRef.current = stationsGroup;

      const routeGroup = L.layerGroup().addTo(map);
      routeLayerRef.current = routeGroup;

      mapInstanceRef.current = map;
    }

    // Invalidate size to avoid grey tiles
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerGroupRef.current = null;
        markersLayerRef.current = null;
        stationsLayerRef.current = null;
        routeLayerRef.current = null;
      }
    };
  }, []);

  // Update Base Tile Layer on mapMode change (Street OSM vs Satellite vs Hybrid vs Dark)
  useEffect(() => {
    const tileGroup = tileLayerGroupRef.current;
    if (!tileGroup) return;

    tileGroup.clearLayers();

    if (mapMode === 'osm') {
      // OpenStreetMap Standard Tiles (Authentic Open Source Street Map)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(tileGroup);
    } else if (mapMode === 'satellite') {
      // Esri World Imagery (High-Resolution Satellite Imagery)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      }).addTo(tileGroup);
    } else if (mapMode === 'hybrid') {
      // Satellite Base Layer + Road & Place Names Overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
      }).addTo(tileGroup);

      L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Labels &copy; Esri & OpenStreetMap',
      }).addTo(tileGroup);
    } else if (mapMode === 'dark') {
      // CartoDB Dark Matter (Tactical Night Operations Mode)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }).addTo(tileGroup);
    }

    mapInstanceRef.current?.invalidateSize();
  }, [mapMode]);

  // Window resize & mobile tab listener
  useEffect(() => {
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mobileMapTab === 'map') {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }
  }, [mobileMapTab]);

  // Render Official Agency Headquarters Stations on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const stationsGroup = stationsLayerRef.current;
    if (!map || !stationsGroup) return;

    stationsGroup.clearLayers();

    const activeStations = (['PNP', 'BFP', 'MDRRMO'] as AgencyScope[]).map(
      (scope) => BONGABONG_AGENCY_STATIONS[scope]
    );

    activeStations.forEach((station) => {
      const iconHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer" style="width: 52px; height: 62px;">
          <div class="absolute -top-1 w-12 h-12 rounded-2xl animate-ping opacity-25 pointer-events-none" style="background-color: ${station.color};"></div>
          <div class="w-12 h-12 rounded-2xl bg-white p-1 border-2 shadow-2xl flex items-center justify-center transition-transform hover:scale-115 relative z-10" style="border-color: ${station.color};">
            <img src="${station.logo}" class="w-9 h-9 object-contain" alt="${station.name}" />
          </div>
          <div class="absolute -bottom-1 px-1.5 py-0.5 rounded text-[9px] font-black text-white shadow-md uppercase tracking-wider whitespace-nowrap z-20" style="background-color: ${station.color};">
            ${station.shortName}
          </div>
        </div>
      `;

      const stationIcon = L.divIcon({
        className: 'agency-station-marker',
        html: iconHtml,
        iconSize: [52, 62],
        iconAnchor: [26, 52],
        popupAnchor: [0, -50],
      });

      const marker = L.marker([station.lat, station.lng], {
        icon: stationIcon,
        title: `${station.name} (${station.address})`,
        zIndexOffset: 1500,
      }).addTo(stationsGroup);

      marker.bindPopup(`
        <div style="min-width: 250px; padding: 4px; font-family: system-ui, sans-serif; color: #0f172a;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
            <img src="${station.logo}" style="width: 36px; height: 36px; object-fit: contain;" />
            <div>
              <h4 style="font-size: 13px; font-weight: 800; margin: 0; color: #0f172a;">${station.name}</h4>
              <span style="font-size: 10px; font-weight: 700; color: #059669;">🟢 Active 24/7 Response Station</span>
            </div>
          </div>
          <p style="font-size: 11px; color: #475569; margin: 0 0 8px 0; line-height: 1.4;">
            📍 <strong>Address:</strong> ${station.address}
          </p>
          <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 8px; margin-bottom: 6px; font-size: 11px;">
            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Official Hotline:</span>
            <a href="tel:${station.hotline.replace(/[^0-9]/g, '')}" style="font-size: 13px; font-weight: 900; color: #2563eb; text-decoration: none;">
              ${station.hotline}
            </a>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            ✉️ Email: <strong>${station.email}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; padding-top: 4px; border-top: 1px solid #f1f5f9;">
            <span>Chief: <strong style="color: #334155;">${station.officerInCharge}</strong></span>
            <a href="https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 700; text-decoration: underline;">
              View on Google Maps ↗
            </a>
          </div>
        </div>
      `);
    });
  }, []);

  // Real-Time Dispatch Route & Distance Tracking from Agency Station to Selected Incident
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeLayerRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    if (!selectedReport) {
      setRouteInfo(null);
      return;
    }

    const repLat = typeof selectedReport.coordinates?.lat === 'number' ? selectedReport.coordinates.lat : 12.7508;
    const repLng = typeof selectedReport.coordinates?.lng === 'number' ? selectedReport.coordinates.lng : 121.4864;

    // Determine viewing / dispatch agency station
    const agencyKey: AgencyScope =
      isAgencyViewer && activeRole !== 'resident'
        ? (activeRole as AgencyScope)
        : (selectedReport.selectedAgency as AgencyScope) || 'PNP';

    const station =
      BONGABONG_AGENCY_STATIONS[agencyKey] ||
      BONGABONG_AGENCY_STATIONS[selectedReport.selectedAgency] ||
      BONGABONG_AGENCY_STATIONS['PNP'];

    const geomDist = calculateDistanceKm(station.lat, station.lng, repLat, repLng);
    const geomEta = calculateEtaMinutes(geomDist);

    setRouteInfo({
      distanceKm: geomDist,
      etaMinutes: geomEta,
      station,
      isRoadRoute: false,
    });

    const drawRouteOnMap = (pts: [number, number][], distKm: number, etaMins: number) => {
      routeGroup.clearLayers();

      // Outer route shadow
      L.polyline(pts, {
        color: '#0f172a',
        weight: 8,
        opacity: 0.55,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeGroup);

      // Core dispatch route polyline
      L.polyline(pts, {
        color: station.color,
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '6, 8',
      }).addTo(routeGroup);

      // Midpoint badge
      const midIdx = Math.floor(pts.length / 2);
      const midCoord = pts[midIdx] || pts[0];

      const badgeHtml = `
        <div class="px-2.5 py-1 rounded-xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl flex items-center gap-1.5 text-xs font-black whitespace-nowrap cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-105 transition" style="box-shadow: 0 4px 18px rgba(0,0,0,0.45);">
          <span style="color: ${station.color}; font-size: 13px;">🚗</span>
          <span class="text-white">${etaMins} min</span>
          <span class="text-slate-300 font-mono font-bold">(${distKm} km)</span>
        </div>
      `;

      const badgeIcon = L.divIcon({
        className: 'dispatch-route-badge',
        html: badgeHtml,
        iconSize: [110, 30],
        iconAnchor: [55, 15],
      });

      L.marker(midCoord, { icon: badgeIcon, interactive: false, zIndexOffset: 900 }).addTo(routeGroup);
    };

    // Draw initial route immediately
    drawRouteOnMap([[station.lat, station.lng], [repLat, repLng]], geomDist, geomEta);

    // Auto-fit bounds so both station and incident are visible
    map.fitBounds(
      [
        [station.lat, station.lng],
        [repLat, repLng],
      ],
      { padding: [60, 60], maxZoom: 15, animate: true }
    );

    // Asynchronously fetch real road routing from OSRM
    let isCancelled = false;
    const queryOsrm = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const url = `https://router.project-osrm.org/route/v1/driving/${station.lng},${station.lat};${repLng},${repLat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled) return;

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
          const roadDist = Number((route.distance / 1000).toFixed(2));
          const roadEta = Math.max(1, Math.round(route.duration / 60));

          setRouteInfo({
            distanceKm: roadDist,
            etaMinutes: roadEta,
            station,
            isRoadRoute: true,
          });

          drawRouteOnMap(coords, roadDist, roadEta);
        }
      } catch (err) {
        // Fallback already rendered
      }
    };

    queryOsrm();

    return () => {
      isCancelled = true;
    };
  }, [selectedReportId, isAgencyViewer, activeRole]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markerObjMapRef.current.clear();

    if (!showMarkers) return;

    const pinCoordCounts = new Map<string, number>();

    filteredReports.forEach((report) => {
      const typeDef = INCIDENT_TYPES.find(
        (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
      );
      const color = typeDef?.colorHex || '#ef4444';
      const isCriticalRed = report.category === 'RED';
      const isSelected = report.id === selectedReportId;

      // Safe coordinate extraction with fallback to municipal center
      const baseLat = typeof report.coordinates?.lat === 'number' ? report.coordinates.lat : 13.4115;
      const baseLng = typeof report.coordinates?.lng === 'number' ? report.coordinates.lng : 121.1803;

      // Stagger overlapping markers so pins at identical coordinates don't hide each other
      const coordKey = `${baseLat.toFixed(3)}_${baseLng.toFixed(3)}`;
      const countAtLoc = pinCoordCounts.get(coordKey) || 0;
      pinCoordCounts.set(coordKey, countAtLoc + 1);

      let pinLat = baseLat;
      let pinLng = baseLng;
      if (countAtLoc > 0) {
        const angle = countAtLoc * 60 * (Math.PI / 180);
        const radius = 0.00075 * Math.ceil(countAtLoc / 6);
        pinLat += Math.sin(angle) * radius;
        pinLng += Math.cos(angle) * radius;
      }

      // Color-coded custom marker pin with active critical beacon pulse
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125 ${
          isSelected ? 'scale-125 z-50' : 'z-20'
        }" style="width: 34px; height: 34px;">
          <div class="absolute inset-0 rounded-full ${
            isCriticalRed ? 'animate-ping opacity-60' : 'animate-ping opacity-30'
          }" style="background-color: ${color};"></div>
          ${
            isCriticalRed
              ? `<div class="absolute -inset-1 rounded-full animate-pulse border-2 border-red-500 opacity-80 pointer-events-none"></div>`
              : ''
          }
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-2xl border-2 ${
            isSelected ? 'border-white ring-4 ring-red-400' : 'border-slate-900'
          }" style="background-color: ${color};">
            <span class="text-[11px] font-black font-mono text-slate-950">${typeDef?.number || '!'}</span>
          </div>
          <div class="absolute -bottom-1.5 w-2.5 h-2.5 rotate-45 border-r border-b border-slate-900 shadow-md" style="background-color: ${color};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-incident-pin',
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([pinLat, pinLng], {
        icon: customIcon,
        title: `${typeDef?.en} (${report.trackingCode})`,
      });

      // Bind rich popup on click with high-contrast dark styling
      const popupContent = document.createElement('div');
      popupContent.className = 'text-xs p-1 font-sans';
      popupContent.innerHTML = `
        <div style="min-width: 220px; color: #f8fafc; font-family: system-ui, sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-family: monospace; color: #60a5fa; font-size: 11px; letter-spacing: 0.05em;">${report.trackingCode}</strong>
            <span style="font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; background-color: ${color}; color: #020617; text-transform: uppercase;">
              ${report.category}
            </span>
          </div>
          <h4 style="font-weight: 700; margin: 2px 0 4px 0; color: #ffffff; font-size: 13px; line-height: 1.3;">
            ${language === 'fil' ? typeDef?.fil : typeDef?.en}
          </h4>
          ${
            report.category === 'RED'
              ? `<div style="display: flex; align-items: center; gap: 5px; margin: 5px 0; padding: 4px 8px; background-color: rgba(239, 68, 68, 0.25); border: 1px solid rgba(239, 68, 68, 0.6); border-radius: 6px; font-size: 10px; color: #fecaca; font-weight: 800;">
                  🚨 <span>Continuous Critical Alert Active</span>
                </div>`
              : ''
          }
          <p style="font-size: 11px; color: #cbd5e1; margin: 4px 0; display: flex; align-items: center; gap: 4px;">
            <span>📍</span> <span>${report.barangay}, ${report.municipality || 'Calapan City'}</span>
          </p>
          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px; line-height: 1.4;">
            🕒 ${new Date(report.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Agency: <strong style="color: #e2e8f0;">${report.selectedAgency}</strong>
          </div>
          <button
            type="button"
            id="btn-select-${report.id}"
            data-action="inspect-dossier"
            data-report-id="${report.id}"
            style="width: 100%; padding: 7px 12px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: 1px solid #3b82f6; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 10px rgba(37,99,235,0.35); transition: background 0.2s;"
          >
            <span>View Full Report Details</span>
            <span style="font-size: 13px;">→</span>
          </button>
          ${isAgencyViewer ? `
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=${report.coordinates.lat},${report.coordinates.lng}"
              target="_blank"
              rel="noopener noreferrer"
              style="width: 100%; margin-top: 6px; padding: 7px 10px; background: #059669; color: white; border: 1px solid #10b981; border-radius: 8px; font-weight: 800; font-size: 11px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 8px rgba(5,150,105,0.35);"
            >
              <span>🧭 Navigate to Location ↗</span>
            </a>
          ` : ''}
        </div>
      `;

      // Direct listener on popupContent
      popupContent.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('[data-action="inspect-dossier"]');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          handleInspectDossier(report.id);
        }
      });

      marker.bindPopup(popupContent, {
        autoPan: true,
        autoPanPaddingTopLeft: L.point(16, 24),
        autoPanPaddingBottomRight: L.point(16, 65),
        maxWidth: 290,
        minWidth: 220,
        closeButton: true,
      });

      marker.on('popupopen', () => {
        setSelectedReportId(report.id);
        setSilencedReportId(null);
        setActiveSideTab('details');
        const btn = document.getElementById(`btn-select-${report.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleInspectDossier(report.id);
          };
        }
      });

      marker.on('click', () => {
        setSelectedReportId(report.id);
        setSilencedReportId(null);
        setActiveSideTab('details');
      });

      markersGroup.addLayer(marker);
      markerObjMapRef.current.set(report.id, marker);
    });
  }, [filteredReports, showMarkers, selectedReportId, language]);

  // Heatmap rendering using Canvas overlay synced with Leaflet map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const canvas = heatCanvasRef.current;
    if (!map || !canvas) return;

    const renderHeatmap = () => {
      const width = mapContainerRef.current?.clientWidth || 800;
      const height = mapContainerRef.current?.clientHeight || 520;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      if (!showHeatmap) return;

      const radiusMultiplier = heatIntensity === 'high' ? 80 : heatIntensity === 'low' ? 45 : 65;
      const opacityMultiplier = heatIntensity === 'high' ? 0.65 : heatIntensity === 'low' ? 0.25 : 0.45;

      filteredReports.forEach((rep) => {
        const lat = typeof rep.coordinates?.lat === 'number' ? rep.coordinates.lat : 13.4115;
        const lng = typeof rep.coordinates?.lng === 'number' ? rep.coordinates.lng : 121.1803;
        const point = map.latLngToContainerPoint([lat, lng]);

        // Draw radial heat glow
        const radius = radiusMultiplier;
        const grad = ctx.createRadialGradient(
          point.x,
          point.y,
          4,
          point.x,
          point.y,
          radius
        );

        const colorMap: Record<IncidentCategoryColor, string> = {
          RED: `rgba(239, 68, 68, ${opacityMultiplier})`,
          ORANGE: `rgba(249, 115, 22, ${opacityMultiplier * 0.9})`,
          YELLOW: `rgba(234, 179, 8, ${opacityMultiplier * 0.85})`,
          GREEN: `rgba(34, 197, 94, ${opacityMultiplier * 0.85})`,
          BLUE: `rgba(59, 130, 246, ${opacityMultiplier * 0.85})`,
          WHITE: `rgba(241, 245, 249, ${opacityMultiplier * 0.75})`,
        };

        const centerColor = colorMap[rep.category] || `rgba(239, 68, 68, ${opacityMultiplier})`;
        grad.addColorStop(0, centerColor);
        grad.addColorStop(0.5, centerColor.replace(/[\d\.]+\)$/, `${(opacityMultiplier * 0.35).toFixed(2)})`));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    renderHeatmap();

    map.on('move', renderHeatmap);
    map.on('zoom', renderHeatmap);
    map.on('resize', renderHeatmap);
    map.on('moveend', renderHeatmap);
    map.on('zoomend', renderHeatmap);
    map.on('viewreset', renderHeatmap);

    return () => {
      map.off('move', renderHeatmap);
      map.off('zoom', renderHeatmap);
      map.off('resize', renderHeatmap);
      map.off('moveend', renderHeatmap);
      map.off('zoomend', renderHeatmap);
      map.off('viewreset', renderHeatmap);
    };
  }, [filteredReports, showHeatmap, heatIntensity]);

  // Center on selected report and open its popup
  const focusOnIncident = (rep: IncidentReport) => {
    setSelectedReportId(rep.id);
    setSilencedReportId(null);
    setActiveSideTab('details');
    if (mapInstanceRef.current) {
      const lat = typeof rep.coordinates?.lat === 'number' ? rep.coordinates.lat : 13.05;
      const lng = typeof rep.coordinates?.lng === 'number' ? rep.coordinates.lng : 121.3;
      mapInstanceRef.current.setView([lat, lng], 15, {
        animate: true,
      });

      const marker = markerObjMapRef.current.get(rep.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Auto-fit map bounds or flyTo matching reports whenever a category or filter is selected
  const fitMapToReports = (reportsToFit: IncidentReport[], targetCategory?: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Filter to reports with valid numeric coordinates
    const validCoords: [number, number][] = reportsToFit
      .map((r) => {
        const lat = typeof r.coordinates?.lat === 'number' ? r.coordinates.lat : null;
        const lng = typeof r.coordinates?.lng === 'number' ? r.coordinates.lng : null;
        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          return [lat, lng] as [number, number];
        }
        return null;
      })
      .filter((c): c is [number, number] => c !== null);

    if (validCoords.length === 0) {
      // If no matching reports exist, smooth fly to provincial view of Oriental Mindoro
      map.flyTo([13.05, 121.3], 9, { animate: true, duration: 0.8 });
      return;
    }

    if (validCoords.length === 1) {
      // Exactly 1 incident: fly directly to it and automatically open its popup
      const targetReport = reportsToFit[0];
      map.flyTo(validCoords[0], 14, { animate: true, duration: 0.8 });
      setSelectedReportId(targetReport.id);
      setActiveSideTab('details');

      setTimeout(() => {
        const marker = markerObjMapRef.current.get(targetReport.id);
        if (marker) {
          marker.openPopup();
        }
      }, 500);
    } else {
      // Multiple incidents: fit map bounds so all matching reports and their heatmaps are in view
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
        animate: true,
        duration: 0.8,
      });
    }
  };

  // Handler for category selection (from pills, dropdown, or hierarchy cards)
  const handleCategorySelect = (category: string) => {
    const targetCategory = selectedCategory === category && category !== 'ALL' ? 'ALL' : category;
    setSelectedCategory(targetCategory);

    // Compute matching reports for bounds fitting
    const matching = scopedReports.filter((r) => {
      if (!includeRejected && r.status === 'Rejected') return false;
      if (targetCategory !== 'ALL' && r.category !== targetCategory) return false;
      if (selectedMunicipality !== 'ALL' && (r.municipality || 'Calapan City') !== selectedMunicipality) return false;
      if (selectedBarangay !== 'ALL' && r.barangay !== selectedBarangay) return false;
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
      if (dateFilter !== 'ALL') {
        const now = Date.now();
        const repTime = new Date(r.createdAt || r.dateTime).getTime();
        const diffHours = (now - repTime) / (1000 * 60 * 60);
        if (dateFilter === '24h' && diffHours > 24) return false;
        if (dateFilter === '7d' && diffHours > 24 * 7) return false;
        if (dateFilter === '30d' && diffHours > 24 * 30) return false;
        if (dateFilter === 'specific' && specificDate && !mapDateValidationError) {
          const repDate = new Date(r.createdAt || r.dateTime).toISOString().slice(0, 10);
          if (repDate !== specificDate) return false;
        }
        if (dateFilter === 'range' && !mapDateValidationError) {
          if (startDate) {
            const startMs = new Date(startDate + 'T00:00:00').getTime();
            if (repTime < startMs) return false;
          }
          if (endDate) {
            const endMs = new Date(endDate + 'T23:59:59.999').getTime();
            if (repTime > endMs) return false;
          }
        }
      }
      return true;
    });

    fitMapToReports(matching, targetCategory);
  };

  // Initial auto-fit: frame existing active reports if any exist across the province
  useEffect(() => {
    if (!mapInstanceRef.current || scopedReports.length === 0 || hasAutoFittedInitial.current) return;
    const timer = setTimeout(() => {
      if (mapInstanceRef.current && scopedReports.length > 0) {
        fitMapToReports(filteredReports);
        hasAutoFittedInitial.current = true;
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [scopedReports.length]);

  const renderCategoryPills = (isMobile: boolean) => (
    <div
      className={
        isMobile
          ? 'flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-2.5 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xs shrink-0'
          : 'hidden lg:flex absolute top-3 left-3 z-20 flex-wrap items-center gap-1.5 bg-white/90 backdrop-blur-md border border-white/80 p-1.5 rounded-2xl shadow-lg max-w-[calc(100%-4.5rem)]'
      }
    >
      {isMobile && (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
          Filters:
        </span>
      )}

      {/* All Category Pill */}
      <button
        type="button"
        onClick={() => handleCategorySelect('ALL')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer shrink-0 ${
          selectedCategory === 'ALL'
            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
        }`}
        title="Show all incident categories and frame all reports"
      >
        <span>All</span>
        <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'ALL' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
          {categoryCounts.ALL}
        </span>
      </button>

      {/* RED */}
      <button
        type="button"
        onClick={() => handleCategorySelect('RED')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'RED'
            ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400'
            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
        }`}
        title="RED: Critical Safety Emergencies (Click to filter and auto-frame)"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <span className="whitespace-nowrap">Critical</span>
        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === 'RED' ? 'bg-white/25 text-white' : 'bg-red-200 text-red-800'}`}>
          {categoryCounts.RED}
        </span>
      </button>

      {/* ORANGE */}
      <button
        type="button"
        onClick={() => handleCategorySelect('ORANGE')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'ORANGE'
            ? 'bg-orange-500 text-white shadow-sm ring-1 ring-orange-400'
            : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
        }`}
        title="ORANGE: Accidents, Rescue & Medical (Click to filter and auto-frame)"
      >
        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
        <span className="whitespace-nowrap">Accidents</span>
        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === 'ORANGE' ? 'bg-white/25 text-white' : 'bg-orange-200 text-orange-800'}`}>
          {categoryCounts.ORANGE}
        </span>
      </button>

      {/* YELLOW */}
      <button
        type="button"
        onClick={() => handleCategorySelect('YELLOW')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'YELLOW'
            ? 'bg-yellow-500 text-slate-900 font-black shadow-sm ring-1 ring-yellow-400'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
        }`}
        title="YELLOW: Suspected Criminal Activities (Click to filter and auto-frame)"
      >
        <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
        <span className="whitespace-nowrap">Crime</span>
        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${selectedCategory === 'YELLOW' ? 'bg-black/20 text-slate-950' : 'bg-yellow-200 text-yellow-900'}`}>
          {categoryCounts.YELLOW}
        </span>
      </button>

      {/* GREEN */}
      <button
        type="button"
        onClick={() => handleCategorySelect('GREEN')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'GREEN'
            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
        }`}
        title="GREEN: Community & Personal Safety (Click to filter and auto-frame)"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="whitespace-nowrap">Safety</span>
        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === 'GREEN' ? 'bg-white/25 text-white' : 'bg-emerald-200 text-emerald-800'}`}>
          {categoryCounts.GREEN}
        </span>
      </button>

      {/* BLUE */}
      <button
        type="button"
        onClick={() => handleCategorySelect('BLUE')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'BLUE'
            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
            : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
        }`}
        title="BLUE: Public Complaints & Online (Click to filter and auto-frame)"
      >
        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
        <span className="whitespace-nowrap">Online</span>
        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === 'BLUE' ? 'bg-white/25 text-white' : 'bg-blue-200 text-blue-800'}`}>
          {categoryCounts.BLUE}
        </span>
      </button>

      {/* WHITE */}
      <button
        type="button"
        onClick={() => handleCategorySelect('WHITE')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'WHITE'
            ? 'bg-slate-700 text-white font-bold shadow-sm'
            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
        }`}
        title="WHITE: Other / Unclassified Incidents (Click to filter and auto-frame)"
      >
        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
        <span className="whitespace-nowrap">Other</span>
        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === 'WHITE' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-800'}`}>
          {categoryCounts.WHITE}
        </span>
      </button>
    </div>
  );

  return (
    <div className="space-y-5 text-slate-800 font-sans">
      {/* Top Banner and Filter Bar */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 space-y-4">
        {/* Title & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-50 text-red-600 border border-red-200/60 shadow-sm">
              <MapPin className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Color-Coded Incident Map & Heatmap
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
                  {mapMode === 'osm' ? '🗺️ OpenStreetMap' : mapMode === 'satellite' ? '🛰️ Esri Satellite' : mapMode === 'hybrid' ? '🌐 Satellite Hybrid' : '🌙 Dark Ops'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time spatial GIS visualization for the Municipality of Bongabong.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 font-mono">
              <span className="text-blue-700 font-black">{filteredReports.length}</span>
              <span className="text-slate-500 font-medium">Markers Mapped</span>
            </div>

            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedMunicipality('Bongabong');
                setSelectedBarangay('ALL');
                fitMapToReports(scopedReports);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Reset map view and frame all incidents"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Center</span>
            </button>
          </div>
        </div>

        {/* Requirement 2: Citizen Heatmap Privacy Banner */}
        {!isAgencyViewer ? (
          <div className="p-3 bg-blue-50/90 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Citizen Heatmap Privacy:</strong> Displaying strictly your own filed incident reports ({scopedReports.length}) to protect public safety and privacy.
              </span>
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-blue-600 text-white rounded-md shrink-0">
              Personal Heatmap
            </span>
          </div>
        ) : (
          <div className="p-3 bg-purple-50/90 border border-purple-200/80 rounded-2xl flex items-center justify-between text-xs text-purple-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Agency Master Telemetry:</strong> Full access to all municipal incident pins, heatmaps, and response routes across Bongabong ({scopedReports.length} reports).
              </span>
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-purple-600 text-white rounded-md shrink-0">
              Full Agency View
            </span>
          </div>
        )}

        {/* Filters Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search code, citizen, details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">All Categories ({categoryCounts.ALL})</option>
              <option value="RED">RED — Critical Safety ({categoryCounts.RED})</option>
              <option value="ORANGE">ORANGE — Accidents & Emergencies ({categoryCounts.ORANGE})</option>
              <option value="YELLOW">YELLOW — Suspected Criminal ({categoryCounts.YELLOW})</option>
              <option value="GREEN">GREEN — Community Concerns ({categoryCounts.GREEN})</option>
              <option value="BLUE">BLUE — Online & Complaints ({categoryCounts.BLUE})</option>
              <option value="WHITE">WHITE — Other ({categoryCounts.WHITE})</option>
            </select>

            {/* Pilot Municipality Badge (Exclusive Operational Scope - Requirement 3) */}
            <div className="bg-blue-50 border border-blue-200/90 text-blue-900 rounded-xl px-3 py-1.5 text-xs font-black flex items-center gap-1.5 shrink-0 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Bongabong (Pilot Exclusive)</span>
            </div>

            {/* Barangay Filter */}
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold cursor-pointer max-w-[170px] truncate"
            >
              <option value="ALL">All 32 Bongabong Barangays</option>
              {getAllBarangaysForFilter('Bongabong').map((brgy, idx) => (
                <option key={`map-brgy-bongabong-${brgy}-${idx}`} value={brgy}>
                  {brgy}
                </option>
              ))}
            </select>

            {/* Date Filter & Range Pickers (Requirement 8) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold cursor-pointer"
              >
                <option value="ALL">All Dates</option>
                <option value="24h">Past 24 Hours</option>
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
                <option value="specific">Specific Date</option>
                <option value="range">Date Range</option>
              </select>

              {dateFilter === 'specific' && (
                <input
                  type="date"
                  value={specificDate}
                  max={todayStr}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className={`bg-white border text-slate-800 rounded-xl px-2.5 py-1 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/30 focus:outline-none shadow-2xs ${
                    specificDate > todayStr ? 'border-rose-400 bg-rose-50/50 text-rose-800' : 'border-blue-300'
                  }`}
                  title="Filter incidents on this specific calendar date"
                />
              )}

              {dateFilter === 'range' && (
                <div className={`flex items-center gap-1 bg-white border rounded-xl px-2 py-0.5 shadow-2xs text-xs ${
                  (startDate && startDate > todayStr) || (endDate && endDate > todayStr) || (startDate && endDate && startDate > endDate)
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-blue-300'
                }`}>
                  <input
                    type="date"
                    value={startDate}
                    max={todayStr}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="font-mono text-xs text-slate-800 focus:outline-none py-1 bg-transparent"
                    title="From Date"
                  />
                  <span className="text-slate-400 font-bold px-0.5">to</span>
                  <input
                    type="date"
                    value={endDate}
                    max={todayStr}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="font-mono text-xs text-slate-800 focus:outline-none py-1 bg-transparent"
                    title="To Date"
                  />
                </div>
              )}
            </div>

            {/* Reactive Map Date Validation Alert */}
            {mapDateValidationError && (
              <div className="w-full flex items-center gap-2 p-2 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{mapDateValidationError}</span>
              </div>
            )}

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Accepted">Accepted</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Map Layer Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Map Mode Selector */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setMapMode('osm')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  mapMode === 'osm'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="OpenStreetMap Standard Street Map"
              >
                <MapIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Street</span>
              </button>

              <button
                type="button"
                onClick={() => setMapMode('satellite')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  mapMode === 'satellite'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Esri World Imagery Satellite"
              >
                <Satellite className="w-3.5 h-3.5 text-amber-500" />
                <span>Satellite</span>
              </button>

              <button
                type="button"
                onClick={() => setMapMode('hybrid')}
                className={`px-2 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  mapMode === 'hybrid'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Satellite with Streets and Place Labels"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Hybrid</span>
              </button>

              <button
                type="button"
                onClick={() => setMapMode('dark')}
                className={`px-2 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  mapMode === 'dark'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Dark Tactical Mode"
              >
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            {/* Heatmap Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                showHeatmap
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Heatmap</span>
            </button>

            {showHeatmap && (
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                {(['low', 'med', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setHeatIntensity(lvl)}
                    className={`px-2 py-0.5 text-[10px] rounded-lg font-bold capitalize transition ${
                      heatIntensity === lvl
                        ? 'bg-white text-amber-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}

            {/* Markers Toggle */}
            <button
              onClick={() => setShowMarkers(!showMarkers)}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                showMarkers
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Markers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile view switch (Map vs Dossier) on small screens */}
      <div className="flex lg:hidden items-center bg-white/90 border border-slate-200 p-1 rounded-2xl shadow-sm">
        <button
          type="button"
          onClick={() => setMobileMapTab('map')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
            mobileMapTab === 'map' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Interactive Map</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMapTab('dossier')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
            mobileMapTab === 'dossier' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Report Details & List ({filteredReports.length})</span>
        </button>
      </div>

      {/* Mobile Category Filters: Clean horizontal touch carousel outside map to prevent overlapping */}
      {mobileMapTab === 'map' && renderCategoryPills(true)}

      {/* Main Map View + Side Detail & List Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Interactive Map Container - with strict z-0 and isolate */}
        <div className={`lg:col-span-2 relative z-0 isolate bg-slate-100 border border-slate-200/80 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 h-[440px] sm:h-[480px] lg:h-[580px] ${mobileMapTab === 'map' ? 'block' : 'hidden lg:block'}`}>
          <div ref={mapContainerRef} className="w-full h-full z-0 isolate" />
          <canvas
            ref={heatCanvasRef}
            className="absolute inset-0 pointer-events-none z-10"
          />

          {/* Offline Map Mode Indicator */}
          {!isOnline && (
            <div className="absolute top-3 left-3 lg:top-15 lg:left-3 z-20 bg-amber-950/85 backdrop-blur-md text-amber-200 border border-amber-500/50 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>Offline GIS: Coordinate markers & incident dossiers active</span>
            </div>
          )}

          {/* Desktop Floating Category Filter Bar (Only shown on large desktop screens) */}
          {renderCategoryPills(false)}

          {/* On-Map Dispatch Route HUD Banner */}
          {routeInfo && selectedReport && (
            <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 max-w-md pointer-events-auto">
              <div className="p-2.5 sm:p-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: `${routeInfo.station.color}30`, border: `1px solid ${routeInfo.station.color}60` }}
                  >
                    <span className="text-sm">🚗</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-white">
                        Dispatch: {routeInfo.distanceKm} km (~{routeInfo.etaMinutes} mins)
                      </span>
                      {routeInfo.isRoadRoute && (
                        <span className="px-1.5 py-0.2 bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 rounded text-[9px] font-bold">
                          Road Route
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-300 block truncate">
                      {routeInfo.station.shortName} ➔ {selectedReport.locationDetails || selectedReport.barangay}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${routeInfo.station.lat},${routeInfo.station.lng}&destination=${selectedReport.coordinates.lat},${selectedReport.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition shrink-0 cursor-pointer"
                  title="Open in Google Maps Navigation"
                >
                  <Navigation className="w-3.5 h-3.5 fill-white shrink-0" />
                  <span>Navigate to Location ↗</span>
                </a>
              </div>
            </div>
          )}

          {/* Active Category Auto-Frame Badge on Desktop/Tablet Map */}
          {selectedCategory !== 'ALL' && (
            <div className="hidden sm:flex absolute top-14 left-3 z-20 items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-xs font-bold text-slate-800 animate-fadeIn">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    selectedCategory === 'RED' ? '#ef4444' :
                    selectedCategory === 'ORANGE' ? '#f97316' :
                    selectedCategory === 'YELLOW' ? '#eab308' :
                    selectedCategory === 'GREEN' ? '#10b981' :
                    selectedCategory === 'BLUE' ? '#3b82f6' : '#64748b'
                }}
              />
              <span className="font-extrabold text-slate-900">
                Viewing {selectedCategory}: {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'} Auto-Framed
              </span>
              <button
                type="button"
                onClick={() => handleCategorySelect('ALL')}
                className="ml-1 text-blue-600 hover:text-blue-800 underline text-[11px] font-bold cursor-pointer"
              >
                Show All
              </button>
            </div>
          )}

          {/* On-Map Floating Map Layer Switcher */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center bg-white/95 backdrop-blur-md border border-white/80 p-1 rounded-2xl shadow-xl">
            <button
              type="button"
              onClick={() => setMapMode('osm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mapMode === 'osm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="OpenStreetMap Standard"
            >
              <MapIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Street</span>
            </button>

            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Esri World Imagery"
            >
              <Satellite className="w-3.5 h-3.5 text-amber-500" />
              <span>Satellite</span>
            </button>

            <button
              type="button"
              onClick={() => setMapMode('hybrid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mapMode === 'hybrid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Satellite + Streets & Place Names"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden xs:inline">Hybrid</span>
            </button>

            <button
              type="button"
              onClick={() => setMapMode('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mapMode === 'dark'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Tactical Dark Mode"
            >
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden sm:inline">Dark Ops</span>
            </button>
          </div>

          {/* Color Policy Notice */}
          <div className="absolute bottom-16 left-3 z-20 bg-white/95 backdrop-blur-md border border-white/80 rounded-2xl p-3 text-[10px] shadow-xl max-w-sm hidden xl:block text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-amber-700 mb-0.5">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>Standard Color-Coded Incident Policy</span>
            </div>
            <p className="text-slate-500 leading-tight">
              {t.mapLegendNote}
            </p>
          </div>
        </div>

        {/* Right Col: Side Panel with Details & Fast Incident List Switcher */}
        <div className={`glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between overflow-hidden min-h-[460px] max-h-[580px] ${mobileMapTab === 'dossier' ? 'block' : 'hidden lg:block'}`}>
          {/* Subtabs for Side Panel: Incident Details vs Active Markers List */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <button
              onClick={() => setActiveSideTab('details')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSideTab === 'details'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Report Details</span>
            </button>

            <button
              onClick={() => setActiveSideTab('list')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSideTab === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Map Items ({filteredReports.length})</span>
            </button>
          </div>

          {/* Side Tab 1: Detailed Incident Dossier & Verification Reclassify */}
          {activeSideTab === 'details' && (
            <div className="overflow-y-auto pr-1 space-y-4 flex-1">
              {selectedReport ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="border-b border-slate-100 pb-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
                          {selectedReport.trackingCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border uppercase ${
                            selectedReport.category === 'RED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : selectedReport.category === 'ORANGE'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : selectedReport.category === 'YELLOW'
                              ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                              : selectedReport.category === 'GREEN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : selectedReport.category === 'BLUE'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {selectedReport.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleInspectDossier(selectedReport.id)}
                          className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                          title="Open Full Incident Report Details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Full Report</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReportId(null);
                            setSilencedReportId(null);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Close panel & stop alarm sound"
                          aria-label="Close panel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* RED:Critical Continuous Notification Sound Alarm Banner */}
                    {selectedReport.category === 'RED' && selectedReport.status !== 'Resolved' && selectedReport.status !== 'Rejected' && (
                      <div className="p-3 rounded-2xl bg-red-50 border border-red-200 shadow-sm flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="relative flex h-3 w-3 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                          </span>
                          <div className="min-w-0">
                            <span className="text-[11px] font-extrabold text-red-900 block uppercase tracking-wider">
                              🚨 Critical Alarm Active
                            </span>
                            <span className="text-[10px] text-red-700 block truncate">
                              {silencedReportId === selectedReport.id || soundMuted
                                ? 'Alarm audio silenced · Click another report to clear'
                                : 'Continuous notification sound active · Stops when another report is clicked'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSilencedReportId(silencedReportId === selectedReport.id ? null : selectedReport.id)}
                          className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-[10px] font-bold text-white shadow-sm cursor-pointer flex items-center gap-1 shrink-0 transition"
                          title={silencedReportId === selectedReport.id ? 'Re-enable alarm siren' : 'Silence alarm siren'}
                        >
                          {silencedReportId === selectedReport.id || soundMuted ? (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-white" />
                              <span>Unmute</span>
                            </>
                          ) : (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-white" />
                              <span>Silence</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      {(() => {
                        const def = INCIDENT_TYPES.find(
                          (t) => t.id === (selectedReport.verifiedTypeId || selectedReport.initialTypeId)
                        );
                        return language === 'fil' ? def?.fil : def?.en;
                      })()}
                    </h3>

                    {selectedReport.verifiedTypeId && selectedReport.verifiedTypeId !== selectedReport.initialTypeId && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 font-semibold mt-1 w-fit">
                        <CheckCircle className="w-3 h-3 text-amber-600" />
                        Verified & Reclassified by Administrator
                      </span>
                    )}
                  </div>

                  {/* Status & Receiving Agency */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <AgencyLogo agency={selectedReport.selectedAgency} className="w-5 h-5 object-contain" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                          Selected Agency
                        </span>
                        <span className="font-bold text-slate-900">{selectedReport.selectedAgency}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm ${
                        selectedReport.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedReport.status === 'Ongoing'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : selectedReport.status === 'Accepted'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {t[selectedReport.status] || selectedReport.status}
                    </span>
                  </div>

                  {/* Evidence Photo - Fully Fitted & Non-Cropped */}
                  {selectedReport.photoUrl && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-950 flex flex-col items-center justify-center">
                      <img
                        src={selectedReport.photoUrl}
                        alt="Incident Evidence"
                        className="w-full max-h-48 sm:max-h-56 object-contain mx-auto"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallbackUrl = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
                          if (target.src !== fallbackUrl) {
                            target.src = fallbackUrl;
                          } else {
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.evidence-fallback')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'evidence-fallback flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-400 text-xs h-32';
                              fallback.innerHTML = '<span class="font-bold text-slate-200">Evidence Record Captured</span><span class="text-[10px] text-slate-400 mt-1">Verified Digital Image on File</span>';
                              parent.prepend(fallback);
                            }
                          }
                        }}
                      />
                      {selectedReport.photoCaption && (
                        <div className="w-full p-2 text-xs text-slate-300 bg-slate-900/90 truncate border-t border-slate-800">
                          {selectedReport.photoCaption}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Location & Details */}
                  <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block">{selectedReport.barangay}, {selectedReport.municipality || 'Calapan City'}</strong>
                        <span className="text-slate-500">{selectedReport.locationDetails}</span>
                        <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                          GPS: {selectedReport.coordinates.lat.toFixed(4)}, {selectedReport.coordinates.lng.toFixed(4)} · Oriental Mindoro
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{new Date(selectedReport.dateTime).toLocaleString()}</span>
                    </div>

                    {/* Citizen Informant Security Guard (RA 10173 Compliance) */}
                    {(() => {
                      const isOwner = Boolean(
                        (residentUser?.id && selectedReport.residentId === residentUser.id) ||
                        (residentUser?.name && selectedReport.residentName.toLowerCase() === residentUser.name.toLowerCase()) ||
                        (residentUser?.email && selectedReport.residentEmail && selectedReport.residentEmail.toLowerCase() === residentUser.email.toLowerCase())
                      );
                      const canViewReporterDetails = isAgencyViewer || isOwner;

                      if (canViewReporterDetails) {
                        return (
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                            <div className="flex items-center gap-2 text-slate-700 min-w-0">
                              <User className="w-4 h-4 text-purple-600 shrink-0" />
                              <span className="truncate">
                                Resident: <strong className="text-slate-900 font-bold">{selectedReport.residentName}</strong> ({selectedReport.residentPhone})
                              </span>
                            </div>
                            {isOwner && (
                              <span className="text-[10px] bg-purple-100 text-purple-800 font-black px-2 py-0.5 rounded-full border border-purple-200 shrink-0">
                                Your Report
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-start gap-2 bg-slate-100/90 border border-slate-200/90 rounded-xl p-2.5 pt-2 text-xs text-slate-600 mt-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">Reporter Identity Protected</span>
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                RA 10173 Shield
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug">
                              Contact credentials confidential. Restricted to designated municipal emergency authorities and report author.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-xs text-slate-700 pt-2 border-t border-slate-200/80 leading-relaxed italic">
                      "{selectedReport.description}"
                    </p>
                  </div>

                  {/* Emergency Agency Dispatch Distance & Route Tracker (Side Dossier View) */}
                  {isAgencyViewer && routeInfo && (
                    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 text-white p-3.5 rounded-2xl border border-slate-700 shadow-md space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-white/10 p-1"
                            style={{ border: `1.5px solid ${routeInfo.station.color}` }}
                          >
                            <img src={routeInfo.station.logo} alt="" className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-300 block">
                              Emergency Dispatch Distance
                            </span>
                            <span className="text-xs font-bold text-white truncate block">
                              {routeInfo.station.name}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
                          Live Track
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">ROAD DISTANCE</span>
                          <span className="text-base font-black text-amber-400 tracking-tight">
                            {routeInfo.distanceKm} <span className="text-xs font-normal text-slate-300">km</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">EST. RESPONSE</span>
                          <span className="text-base font-black text-emerald-400 tracking-tight">
                            ~{routeInfo.etaMinutes} <span className="text-xs font-normal text-slate-300">mins</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 space-y-1">
                        <div className="flex items-start gap-1.5">
                          <span className="text-slate-400 shrink-0">📍 From:</span>
                          <span className="text-slate-200 line-clamp-1">{routeInfo.station.address}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-slate-400 shrink-0">🎯 To:</span>
                          <span className="text-slate-200 line-clamp-1">{selectedReport.locationDetails || selectedReport.barangay}, Bongabong</span>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${routeInfo.station.lat},${routeInfo.station.lng}&destination=${selectedReport.coordinates.lat},${selectedReport.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition cursor-pointer"
                      >
                        <Navigation className="w-4 h-4 fill-white shrink-0" />
                        <span>Navigate to Location (Google Maps) ↗</span>
                      </a>
                    </div>
                  )}

                  {/* Full Dossier Inspector */}
                  <button
                    onClick={() => handleInspectDossier(selectedReport.id)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Inspect Full Report & Audit Log</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 text-slate-400">
                  <MapPin className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                  <p className="text-sm font-bold text-slate-700">
                    {language === 'fil'
                      ? 'Pumili ng marker sa mapa'
                      : 'Click an incident on the map'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                    Select any color-coded pin or choose from the "Map Items" tab to inspect the incident and reclassify.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Side Tab 2: Fast Click-to-Focus Incidents List */}
          {activeSideTab === 'list' && (
            <div className="overflow-y-auto pr-1 space-y-2 flex-1">
              {filteredReports.map((item) => {
                const def = INCIDENT_TYPES.find(
                  (t) => t.id === (item.verifiedTypeId || item.initialTypeId)
                );
                const isSelected = item.id === selectedReportId;

                return (
                  <button
                    key={item.id}
                    onClick={() => focusOnIncident(item)}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 text-slate-900 shadow-md'
                        : 'bg-slate-50/80 border-slate-200/80 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 mt-1 shadow-sm"
                      style={{ backgroundColor: def?.colorHex }}
                    />
                    <div className="flex-1 truncate">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-blue-700 font-bold">
                          {item.trackingCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.category === 'RED' && item.status !== 'Resolved' && item.status !== 'Rejected' && (
                            <span className="text-[9px] font-black text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 flex items-center gap-1 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                              CRITICAL
                            </span>
                          )}
                          {isSelected && item.category === 'RED' && (
                            <span className="text-[8px] font-black text-red-700 bg-red-100 px-1 py-0.2 rounded border border-red-300">
                              🔊 SIREN
                            </span>
                          )}
                          <span className="text-[9px] font-bold uppercase" style={{ color: def?.colorHex }}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {language === 'fil' ? def?.fil : def?.en}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.barangay}, {item.municipality || 'Calapan City'}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No incidents match the active map filters.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Legend Table of the 6 Color Categories */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Official Color-Coded Incident Hierarchy (Nexus Standards)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 text-xs">
          {/* RED */}
          <div
            onClick={() => {
              handleCategorySelect('RED');
              mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`p-4 rounded-2xl border space-y-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
              selectedCategory === 'RED'
                ? 'bg-red-100/90 border-red-500 ring-2 ring-red-400 shadow-md'
                : 'bg-red-50/80 border-red-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                <strong className="text-red-700 font-extrabold">RED — Critical Safety Incidents</strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                categoryCounts.RED > 0 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600'
              }`}>
                {categoryCounts.RED} Active
              </span>
            </div>
            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 font-medium">
              <li>Suspected Killing — Pinaghihinalaang pagpatay</li>
              <li>Person Found Unresponsive — Taong walang malay</li>
              <li>Suspected Sexual Assault — Seksiyonwal na pag-atake</li>
              <li>Armed Threat / Attack — Pananakot gamit ang armas</li>
            </ul>
          </div>

          {/* ORANGE */}
          <div
            onClick={() => {
              handleCategorySelect('ORANGE');
              mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`p-4 rounded-2xl border space-y-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
              selectedCategory === 'ORANGE'
                ? 'bg-orange-100/90 border-orange-500 ring-2 ring-orange-400 shadow-md'
                : 'bg-orange-50/80 border-orange-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
                <strong className="text-orange-700 font-extrabold">ORANGE — Accidents and Emergencies</strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                categoryCounts.ORANGE > 0 ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
              }`}>
                {categoryCounts.ORANGE} Active
              </span>
            </div>
            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 font-medium">
              <li>Road Accident — Aksidente sa kalsada</li>
              <li>Fire Incident — Sunog</li>
              <li>Medical Emergency — Emerhensiyang medikal</li>
              <li>Flooding / Landslide — Baha / Pagguho ng lupa</li>
              <li>Missing Person — Nawawalang tao</li>
            </ul>
          </div>

          {/* YELLOW */}
          <div
            onClick={() => {
              handleCategorySelect('YELLOW');
              mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`p-4 rounded-2xl border space-y-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
              selectedCategory === 'YELLOW'
                ? 'bg-yellow-100/90 border-yellow-500 ring-2 ring-yellow-400 shadow-md'
                : 'bg-yellow-50/80 border-yellow-200 hover:border-yellow-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" />
                <strong className="text-yellow-800 font-extrabold">YELLOW — Suspected Criminal Activities</strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                categoryCounts.YELLOW > 0 ? 'bg-yellow-500 text-slate-950 font-black' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {categoryCounts.YELLOW} Active
              </span>
            </div>
            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 font-medium">
              <li>Theft / Robbery — Pagnanakaw / Holdup</li>
              <li>Suspected Break-in — Sapilitang pagpasok</li>
              <li>Scam / Fraud — Panloloko / Budol</li>
              <li>Illegal Drug Activity — Droga</li>
              <li>Physical Assault — Pananakit / Bugbog</li>
            </ul>
          </div>

          {/* GREEN */}
          <div
            onClick={() => {
              handleCategorySelect('GREEN');
              mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`p-4 rounded-2xl border space-y-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
              selectedCategory === 'GREEN'
                ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-400 shadow-md'
                : 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                <strong className="text-emerald-700 font-extrabold">GREEN — Community & Personal Safety</strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                categoryCounts.GREEN > 0 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {categoryCounts.GREEN} Active
              </span>
            </div>
            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 font-medium">
              <li>Vandalism / Property Damage — Paninira</li>
              <li>Public Disturbance — Kaguluhan sa publiko</li>
              <li>Domestic Violence — Karahasan sa tahanan</li>
              <li>Sexual Harassment — Panliligalig</li>
              <li>Threats / Intimidation — Pananakot</li>
            </ul>
          </div>

          {/* BLUE */}
          <div
            onClick={() => {
              handleCategorySelect('BLUE');
              mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`p-4 rounded-2xl border space-y-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
              selectedCategory === 'BLUE'
                ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-400 shadow-md'
                : 'bg-blue-50/80 border-blue-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 shadow-sm" />
                <strong className="text-blue-700 font-extrabold">BLUE — Community Complaints & Online</strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                categoryCounts.BLUE > 0 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                {categoryCounts.BLUE} Active
              </span>
            </div>
            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 font-medium">
              <li>Noise Complaint — Reklamo sa ingay</li>
              <li>Drunk and Disorderly — Lasing na nanggugulo</li>
              <li>Cyber Harassment — Panliligalig sa internet</li>
              <li>Online Threats — Pagbabanta sa internet</li>
            </ul>
          </div>

          {/* WHITE */}
          <div
            onClick={() => {
              handleCategorySelect('WHITE');
              mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`p-4 rounded-2xl border space-y-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
              selectedCategory === 'WHITE'
                ? 'bg-slate-200/90 border-slate-500 ring-2 ring-slate-400 shadow-md'
                : 'bg-slate-100 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm" />
                <strong className="text-slate-700 font-extrabold">WHITE — Other / Unclassified</strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                categoryCounts.WHITE > 0 ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {categoryCounts.WHITE} Active
              </span>
            </div>
            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 font-medium">
              <li>Not Sure / Other — Hindi tiyak / Iba pa</li>
              <li className="text-slate-400 italic">Manual dispatch inspection required</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Full Incident Dossier Modal (Fallback if parent doesn't provide outer modal) */}
      {internalDossierReportId && (
        <ReportDetailModal
          reportId={internalDossierReportId}
          isOpen={!!internalDossierReportId}
          onClose={() => setInternalDossierReportId(null)}
        />
      )}
    </div>
  );
};
