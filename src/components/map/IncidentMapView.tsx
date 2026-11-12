import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useNexus } from '../../context/NexusContext';
import { IncidentReport, IncidentCategoryColor, IncidentTypeId, Agency } from '../../types';
import { INCIDENT_TYPES, CATEGORY_INFO } from '../../constants/incidentData';
import {
  ORIENTAL_MINDORO_MUNICIPALITIES,
  ORIENTAL_MINDORO_BARANGAYS,
  getBarangaysForMunicipality,
  getAllBarangaysForFilter,
  MUNICIPALITY_COORDINATES,
  OrientalMindoroMunicipality,
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
  Camera
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
  } = useNexus();

  const t = TRANSLATIONS[language];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const markerObjMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Filters state with Oriental Mindoro Municipality & Barangay
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('ALL');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | '24h' | '7d' | '30d'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [includeRejected, setIncludeRejected] = useState<boolean>(false);

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

    return reports.filter((r) => {
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

      // Date filter
      if (dateFilter !== 'ALL') {
        const repTime = new Date(r.createdAt).getTime();
        const diffHours = (now - repTime) / (1000 * 60 * 60);
        if (dateFilter === '24h' && diffHours > 24) return false;
        if (dateFilter === '7d' && diffHours > 24 * 7) return false;
        if (dateFilter === '30d' && diffHours > 24 * 30) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = r.trackingCode.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchMuni = (r.municipality || '').toLowerCase().includes(q);
        const matchBrgy = r.barangay.toLowerCase().includes(q);
        const matchCitizen = r.residentName.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchMuni && !matchBrgy && !matchCitizen) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, includeRejected, selectedCategory, selectedMunicipality, selectedBarangay, selectedStatus, dateFilter, searchQuery]);

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
        center: [13.4115, 121.1803],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Attribution in bottom right with clear branding
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> | Esri Satellite | Nexus 911 GIS')
        .addTo(map);

      // Base tile layer group added first so pins & heatmaps render on top
      const tileGroup = L.layerGroup().addTo(map);
      tileLayerGroupRef.current = tileGroup;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
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
            <span>Inspect Incident Dossier</span>
            <span style="font-size: 13px;">→</span>
          </button>
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

    return () => {
      map.off('move', renderHeatmap);
      map.off('zoom', renderHeatmap);
      map.off('resize', renderHeatmap);
    };
  }, [filteredReports, showHeatmap, heatIntensity]);

  // Center on selected report and open its popup
  const focusOnIncident = (rep: IncidentReport) => {
    setSelectedReportId(rep.id);
    setSilencedReportId(null);
    setActiveSideTab('details');
    if (mapInstanceRef.current) {
      const lat = typeof rep.coordinates?.lat === 'number' ? rep.coordinates.lat : 13.4115;
      const lng = typeof rep.coordinates?.lng === 'number' ? rep.coordinates.lng : 121.1803;
      mapInstanceRef.current.setView([lat, lng], 15, {
        animate: true,
      });

      const marker = markerObjMapRef.current.get(rep.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

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
        onClick={() => setSelectedCategory('ALL')}
        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer shrink-0 ${
          selectedCategory === 'ALL'
            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
        }`}
        title="Show all incident categories"
      >
        All
      </button>

      {/* RED */}
      <button
        type="button"
        onClick={() => setSelectedCategory(selectedCategory === 'RED' ? 'ALL' : 'RED')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'RED'
            ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400'
            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
        }`}
        title="RED: Critical Safety Emergencies (Click to filter)"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <span className="whitespace-nowrap">Critical</span>
      </button>

      {/* ORANGE */}
      <button
        type="button"
        onClick={() => setSelectedCategory(selectedCategory === 'ORANGE' ? 'ALL' : 'ORANGE')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'ORANGE'
            ? 'bg-orange-500 text-white shadow-sm ring-1 ring-orange-400'
            : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
        }`}
        title="ORANGE: Accidents, Rescue & Medical (Click to filter)"
      >
        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
        <span className="whitespace-nowrap">Accidents</span>
      </button>

      {/* YELLOW */}
      <button
        type="button"
        onClick={() => setSelectedCategory(selectedCategory === 'YELLOW' ? 'ALL' : 'YELLOW')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'YELLOW'
            ? 'bg-yellow-500 text-slate-900 font-black shadow-sm ring-1 ring-yellow-400'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
        }`}
        title="YELLOW: Suspected Criminal Activities (Click to filter)"
      >
        <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
        <span className="whitespace-nowrap">Crime</span>
      </button>

      {/* GREEN */}
      <button
        type="button"
        onClick={() => setSelectedCategory(selectedCategory === 'GREEN' ? 'ALL' : 'GREEN')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'GREEN'
            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
        }`}
        title="GREEN: Community & Personal Safety (Click to filter)"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="whitespace-nowrap">Safety</span>
      </button>

      {/* BLUE */}
      <button
        type="button"
        onClick={() => setSelectedCategory(selectedCategory === 'BLUE' ? 'ALL' : 'BLUE')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'BLUE'
            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
            : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
        }`}
        title="BLUE: Public Complaints & Online (Click to filter)"
      >
        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
        <span className="whitespace-nowrap">Online</span>
      </button>

      {/* WHITE */}
      <button
        type="button"
        onClick={() => setSelectedCategory(selectedCategory === 'WHITE' ? 'ALL' : 'WHITE')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition shrink-0 ${
          selectedCategory === 'WHITE'
            ? 'bg-slate-700 text-white font-bold shadow-sm'
            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
        }`}
        title="WHITE: Other / Unclassified Incidents (Click to filter)"
      >
        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
        <span className="whitespace-nowrap">Other</span>
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
                Real-time spatial visualization of public safety incidents across Oriental Mindoro.
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
                mapInstanceRef.current?.setView([13.4115, 121.1803], 12, { animate: true });
                setSelectedMunicipality('ALL');
                setSelectedBarangay('ALL');
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Reset map view to Oriental Mindoro center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Center</span>
            </button>
          </div>
        </div>

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
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">All Categories (6 Colors)</option>
              <option value="RED">RED — Critical Safety</option>
              <option value="ORANGE">ORANGE — Accidents & Emergencies</option>
              <option value="YELLOW">YELLOW — Suspected Criminal</option>
              <option value="GREEN">GREEN — Community Concerns</option>
              <option value="BLUE">BLUE — Online & Complaints</option>
              <option value="WHITE">WHITE — Other</option>
            </select>

            {/* Oriental Mindoro Municipality Filter */}
            <select
              value={selectedMunicipality}
              onChange={(e) => {
                const newMuni = e.target.value;
                setSelectedMunicipality(newMuni);
                setSelectedBarangay('ALL');
                if (newMuni !== 'ALL' && mapInstanceRef.current) {
                  const targetCoord = MUNICIPALITY_COORDINATES[newMuni as OrientalMindoroMunicipality];
                  if (targetCoord) {
                    mapInstanceRef.current.setView([targetCoord.lat, targetCoord.lng], 13, { animate: true });
                  }
                }
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">All Municipalities (Oriental Mindoro)</option>
              {ORIENTAL_MINDORO_MUNICIPALITIES.map((muni) => (
                <option key={muni} value={muni}>
                  {muni}
                </option>
              ))}
            </select>

            {/* Barangay Filter */}
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">
                {selectedMunicipality === 'ALL' ? 'All Barangays' : `All Barangays in ${selectedMunicipality}`}
              </option>
              {getAllBarangaysForFilter(selectedMunicipality).map((brgy, idx) => (
                <option key={`map-brgy-${selectedMunicipality}-${brgy}-${idx}`} value={brgy}>
                  {brgy}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="24h">Past 24 Hours (Daily)</option>
              <option value="7d">Past 7 Days (Weekly)</option>
              <option value="30d">Past 30 Days (Monthly)</option>
            </select>

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
          <span>Dossier & List ({filteredReports.length})</span>
        </button>
      </div>

      {/* Mobile Category Filters: Clean horizontal touch carousel outside map to prevent overlapping */}
      {mobileMapTab === 'map' && renderCategoryPills(true)}

      {/* Main Map View + Side Detail & List Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Interactive Map Container */}
        <div className={`lg:col-span-2 relative bg-slate-100 border border-slate-200/80 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 h-[440px] sm:h-[480px] lg:h-[580px] ${mobileMapTab === 'map' ? 'block' : 'hidden lg:block'}`}>
          <div ref={mapContainerRef} className="w-full h-full" />
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
              <span>Dossier & Details</span>
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
                          title="Open Full Incident Dossier"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Dossier</span>
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

                  {/* Evidence Photo */}
                  {selectedReport.photoUrl && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100">
                      <img
                        src={selectedReport.photoUrl}
                        alt="Incident Evidence"
                        className="w-full h-32 object-cover"
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
                              fallback.className = 'evidence-fallback flex flex-col items-center justify-center p-4 bg-slate-100 text-slate-500 text-xs h-32';
                              fallback.innerHTML = '<span class="font-bold text-slate-700">Evidence Record Captured</span><span class="text-[10px] text-slate-400 mt-1">Verified Digital Image on File</span>';
                              parent.prepend(fallback);
                            }
                          }
                        }}
                      />
                      {selectedReport.photoCaption && (
                        <div className="p-2 text-[10px] text-slate-600 bg-white/90 truncate border-t border-slate-200">
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

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>
                        Resident: <strong className="text-slate-800">{selectedReport.residentName}</strong> ({selectedReport.residentPhone})
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 pt-2 border-t border-slate-200/80 leading-relaxed italic">
                      "{selectedReport.description}"
                    </p>
                  </div>

                  {/* Full Dossier Inspector */}
                  <button
                    onClick={() => handleInspectDossier(selectedReport.id)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Inspect Full Dossier & Audit Log</span>
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
          <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
              <strong className="text-red-700 font-extrabold">RED — Critical Safety Incidents</strong>
            </div>
            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 font-medium">
              <li>Suspected Killing — Pinaghihinalaang pagpatay</li>
              <li>Person Found Unresponsive — Taong walang malay</li>
              <li>Suspected Sexual Assault — Seksiyonwal na pag-atake</li>
              <li>Armed Threat / Attack — Pananakot gamit ang armas</li>
            </ul>
          </div>

          {/* ORANGE */}
          <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
              <strong className="text-orange-700 font-extrabold">ORANGE — Accidents and Emergencies</strong>
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
          <div className="p-4 rounded-2xl bg-yellow-50/80 border border-yellow-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" />
              <strong className="text-yellow-800 font-extrabold">YELLOW — Suspected Criminal Activities</strong>
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
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
              <strong className="text-emerald-700 font-extrabold">GREEN — Community & Personal Safety</strong>
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
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 shadow-sm" />
              <strong className="text-blue-700 font-extrabold">BLUE — Community Complaints & Online</strong>
            </div>
            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 font-medium">
              <li>Noise Complaint — Reklamo sa ingay</li>
              <li>Drunk and Disorderly — Lasing na nanggugulo</li>
              <li>Cyber Harassment — Panliligalig sa internet</li>
              <li>Online Threats — Pagbabanta sa internet</li>
            </ul>
          </div>

          {/* WHITE */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm" />
              <strong className="text-slate-700 font-extrabold">WHITE — Other / Unclassified</strong>
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
