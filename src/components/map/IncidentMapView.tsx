import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useNexus } from '../../context/NexusContext';
import { IncidentReport, IncidentCategoryColor, IncidentTypeId, Agency } from '../../types';
import { INCIDENT_TYPES, CATEGORY_INFO, BARANGAYS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
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
  List
} from 'lucide-react';

interface Props {
  onSelectReport?: (reportId: string) => void;
  standalone?: boolean;
}

export const IncidentMapView: React.FC<Props> = ({ onSelectReport, standalone = false }) => {
  const {
    reports,
    activeRole,
    language,
    reclassifyIncidentReport,
    updateIncidentStatus,
    adminProfiles,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const markerObjMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | '24h' | '7d' | '30d'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [includeRejected, setIncludeRejected] = useState<boolean>(false);

  // Map display controls
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [heatIntensity, setHeatIntensity] = useState<'low' | 'med' | 'high'>('med');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<'details' | 'list'>('details');

  // Reclassification state
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [reclassType, setReclassType] = useState<IncidentTypeId>('road_accident');

  // Filter reports
  const filteredReports = useMemo(() => {
    const now = Date.now();

    return reports.filter((r) => {
      // By default exclude rejected unless explicitly toggled
      if (!includeRejected && r.status === 'Rejected') return false;

      // Category filter
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;

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
        const matchBrgy = r.barangay.toLowerCase().includes(q);
        const matchCitizen = r.residentName.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchBrgy && !matchCitizen) return false;
      }

      return true;
    });
  }, [reports, includeRejected, selectedCategory, selectedBarangay, selectedStatus, dateFilter, searchQuery]);

  const selectedReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [14.6042, 120.985],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Voyager tiles with high legibility and contrast
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Attribution in bottom right
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('&copy; OpenStreetMap &copy; CARTO | Nexus 911 GIS')
        .addTo(map);

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
    };
  }, []);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markerObjMapRef.current.clear();

    if (!showMarkers) return;

    filteredReports.forEach((report) => {
      const typeDef = INCIDENT_TYPES.find(
        (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
      );
      const color = typeDef?.colorHex || '#ef4444';
      const isSelected = report.id === selectedReportId;

      // Color-coded custom marker pin
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125 ${
          isSelected ? 'scale-125 z-50' : 'z-20'
        }" style="width: 34px; height: 34px;">
          <div class="absolute inset-0 rounded-full animate-ping opacity-30" style="background-color: ${color};"></div>
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

      const marker = L.marker([report.coordinates.lat, report.coordinates.lng], {
        icon: customIcon,
        title: `${typeDef?.en} (${report.trackingCode})`,
      });

      // Bind rich popup on click
      const popupContent = document.createElement('div');
      popupContent.className = 'text-xs text-slate-900 p-1 font-sans';
      popupContent.innerHTML = `
        <div style="min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="font-family: monospace; color: #2563eb;">${report.trackingCode}</strong>
            <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background-color: ${color}; color: #020617; text-transform: uppercase;">
              ${report.category}
            </span>
          </div>
          <h4 style="font-weight: bold; margin: 2px 0; color: #0f172a; font-size: 13px;">
            ${language === 'fil' ? typeDef?.fil : typeDef?.en}
          </h4>
          <p style="font-size: 11px; color: #475569; margin: 4px 0;">
            📍 ${report.barangay}
          </p>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
            🕒 ${new Date(report.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Agency: <strong>${report.selectedAgency}</strong>
          </div>
          <button id="btn-select-${report.id}" style="width: 100%; padding: 4px 8px; background-color: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer;">
            View Incident Dossier
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        setSelectedReportId(report.id);
        const btn = document.getElementById(`btn-select-${report.id}`);
        if (btn) {
          btn.onclick = () => {
            setSelectedReportId(report.id);
            setActiveSideTab('details');
          };
        }
      });

      marker.on('click', () => {
        setSelectedReportId(report.id);
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
        const point = map.latLngToContainerPoint([rep.coordinates.lat, rep.coordinates.lng]);

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
    setActiveSideTab('details');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([rep.coordinates.lat, rep.coordinates.lng], 15, {
        animate: true,
      });

      const marker = markerObjMapRef.current.get(rep.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleReclassifySubmit = () => {
    if (!selectedReport) return;
    const currentAgency = activeRole === 'resident' ? 'PNP' : (activeRole as Agency);
    const adminName = adminProfiles[currentAgency]?.name || 'Officer';
    reclassifyIncidentReport(selectedReport.id, reclassType, adminName, currentAgency);
    setIsReclassifying(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner and Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        {/* Title & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <MapPin className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Color-Coded Incident Map & Heatmap
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  GIS Live Layer
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time spatial visualization of public safety incidents across all 10 barangays.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
              <span className="text-emerald-400 font-bold">{filteredReports.length}</span>
              <span className="text-slate-400">Markers Mapped</span>
            </div>

            <button
              onClick={() => {
                mapInstanceRef.current?.setView([14.6042, 120.985], 13, { animate: true });
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Reset map view to center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Center</span>
            </button>
          </div>
        </div>

        {/* Filters Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search code, citizen, details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="ALL">All Categories (6 Colors)</option>
              <option value="RED">RED — Critical Safety</option>
              <option value="ORANGE">ORANGE — Accidents & Emergencies</option>
              <option value="YELLOW">YELLOW — Suspected Criminal</option>
              <option value="GREEN">GREEN — Community Concerns</option>
              <option value="BLUE">BLUE — Online & Complaints</option>
              <option value="WHITE">WHITE — Other</option>
            </select>

            {/* Barangay Filter */}
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="ALL">All Barangays (Lahat ng Barangay)</option>
              {BARANGAYS.map((brgy) => (
                <option key={brgy} value={brgy}>
                  {brgy}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
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
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Accepted">Accepted</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Map Layer Controls */}
          <div className="flex items-center gap-2">
            {/* Heatmap Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition cursor-pointer ${
                showHeatmap
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Heatmap</span>
            </button>

            {showHeatmap && (
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                {(['low', 'med', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setHeatIntensity(lvl)}
                    className={`px-2 py-0.5 text-[10px] rounded-lg font-bold capitalize transition ${
                      heatIntensity === lvl
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
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
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition cursor-pointer ${
                showMarkers
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Markers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map View + Side Detail & List Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Interactive Map Container */}
        <div className="lg:col-span-2 relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[560px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
          <canvas
            ref={heatCanvasRef}
            className="absolute inset-0 pointer-events-none z-10"
          />

          {/* Color Category Reference Pill Bar */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2 rounded-xl shadow-xl max-w-lg">
            <span
              onClick={() => setSelectedCategory(selectedCategory === 'RED' ? 'ALL' : 'RED')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                selectedCategory === 'RED' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> RED: Critical
            </span>

            <span
              onClick={() => setSelectedCategory(selectedCategory === 'ORANGE' ? 'ALL' : 'ORANGE')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                selectedCategory === 'ORANGE' ? 'bg-orange-500 text-white' : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> ORANGE: Accidents
            </span>

            <span
              onClick={() => setSelectedCategory(selectedCategory === 'YELLOW' ? 'ALL' : 'YELLOW')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                selectedCategory === 'YELLOW' ? 'bg-yellow-500 text-black' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> YELLOW: Crime
            </span>

            <span
              onClick={() => setSelectedCategory(selectedCategory === 'GREEN' ? 'ALL' : 'GREEN')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                selectedCategory === 'GREEN' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> GREEN: Safety
            </span>

            <span
              onClick={() => setSelectedCategory(selectedCategory === 'BLUE' ? 'ALL' : 'BLUE')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                selectedCategory === 'BLUE' ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> BLUE: Online/Complaints
            </span>

            <span
              onClick={() => setSelectedCategory(selectedCategory === 'WHITE' ? 'ALL' : 'WHITE')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                selectedCategory === 'WHITE' ? 'bg-slate-200 text-black' : 'bg-slate-200/20 text-slate-200 border border-slate-300/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> WHITE: Other
            </span>
          </div>

          {/* Color Policy Notice (Prompt requirement: Colors represent categories, not automatic urgency) */}
          <div className="absolute bottom-3 left-3 z-20 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-2.5 text-[10px] shadow-xl max-w-sm hidden sm:block">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-0.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Standard Color-Coded Incident Policy</span>
            </div>
            <p className="text-slate-400 leading-tight">
              {t.mapLegendNote}
            </p>
          </div>
        </div>

        {/* Right Col: Side Panel with Details & Fast Incident List Switcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between overflow-hidden max-h-[560px]">
          {/* Subtabs for Side Panel: Incident Details vs Active Markers List */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 mb-3">
            <button
              onClick={() => setActiveSideTab('details')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSideTab === 'details'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Dossier & Details</span>
            </button>

            <button
              onClick={() => setActiveSideTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSideTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
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
                  <div className="border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400">
                        {selectedReport.trackingCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          selectedReport.category === 'RED'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : selectedReport.category === 'ORANGE'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                            : selectedReport.category === 'YELLOW'
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                            : selectedReport.category === 'GREEN'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : selectedReport.category === 'BLUE'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-slate-200/20 text-slate-200 border-slate-300/40'
                        }`}
                      >
                        {selectedReport.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1">
                      {(() => {
                        const def = INCIDENT_TYPES.find(
                          (t) => t.id === (selectedReport.verifiedTypeId || selectedReport.initialTypeId)
                        );
                        return language === 'fil' ? def?.fil : def?.en;
                      })()}
                    </h3>

                    {selectedReport.verifiedTypeId && selectedReport.verifiedTypeId !== selectedReport.initialTypeId && (
                      <span className="text-[10px] text-amber-300 flex items-center gap-1 font-semibold mt-1">
                        <CheckCircle className="w-3 h-3 text-amber-400" />
                        Verified & Reclassified by Administrator
                      </span>
                    )}
                  </div>

                  {/* Status & Receiving Agency */}
                  <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Selected Agency
                      </span>
                      <span className="font-bold text-white">{selectedReport.selectedAgency}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        selectedReport.status === 'Resolved'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : selectedReport.status === 'Ongoing'
                          ? 'bg-orange-950 text-orange-400 border-orange-800'
                          : selectedReport.status === 'Accepted'
                          ? 'bg-blue-950 text-blue-400 border-blue-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      {t[selectedReport.status] || selectedReport.status}
                    </span>
                  </div>

                  {/* Evidence Photo */}
                  {selectedReport.photoUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img
                        src={selectedReport.photoUrl}
                        alt="Evidence"
                        className="w-full h-32 object-cover"
                      />
                      {selectedReport.photoCaption && (
                        <div className="p-1.5 text-[10px] text-slate-400 bg-slate-950/90 truncate">
                          {selectedReport.photoCaption}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Location & Details */}
                  <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">{selectedReport.barangay}</strong>
                        <span className="text-slate-400">{selectedReport.locationDetails}</span>
                        <span className="block font-mono text-[10px] text-slate-500 mt-0.5">
                          GPS: {selectedReport.coordinates.lat.toFixed(4)}, {selectedReport.coordinates.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{new Date(selectedReport.dateTime).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>
                        Resident: <strong className="text-white">{selectedReport.residentName}</strong> ({selectedReport.residentPhone})
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 pt-1 border-t border-slate-800/80 leading-relaxed italic">
                      "{selectedReport.description}"
                    </p>
                  </div>

                  {/* Requirement 5: "Allow administrators to update incident classifications after verification." */}
                  {activeRole !== 'resident' && (
                    <div className="pt-2 border-t border-slate-800">
                      {!isReclassifying ? (
                        <button
                          onClick={() => setIsReclassifying(true)}
                          className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Tag className="w-3.5 h-3.5 text-blue-400" />
                          <span>{t.reclassify}</span>
                        </button>
                      ) : (
                        <div className="space-y-2 p-3 bg-slate-950 border border-blue-500/40 rounded-xl">
                          <label className="block text-[11px] font-bold text-blue-300">
                            Update Verified Classification:
                          </label>
                          <select
                            value={reclassType}
                            onChange={(e) => setReclassType(e.target.value as IncidentTypeId)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500"
                          >
                            {INCIDENT_TYPES.map((type) => (
                              <option key={type.id} value={type.id}>
                                #{type.number} - {type.en} ({type.fil}) [{type.category}]
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={handleReclassifySubmit}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Save Classification
                            </button>
                            <button
                              onClick={() => setIsReclassifying(false)}
                              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Full Dossier Inspector */}
                  {onSelectReport && (
                    <button
                      onClick={() => onSelectReport(selectedReport.id)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/40 transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect Full Dossier & Audit Log</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 text-slate-400">
                  <MapPin className="w-10 h-10 text-slate-600 mb-2 stroke-1" />
                  <p className="text-sm font-semibold text-slate-300">
                    {language === 'fil'
                      ? 'Pumili ng marker sa mapa'
                      : 'Click an incident on the map'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
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
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/70 border-blue-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 mt-1 shadow"
                      style={{ backgroundColor: def?.colorHex }}
                    />
                    <div className="flex-1 truncate">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-blue-400 font-bold">
                          {item.trackingCode}
                        </span>
                        <span className="text-[9px] font-bold uppercase" style={{ color: def?.colorHex }}>
                          {item.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">
                        {language === 'fil' ? def?.fil : def?.en}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.barangay}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No incidents match the active map filters.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Legend Table of the 6 Color Categories */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Official Color-Coded Incident Hierarchy (Nexus Standards)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
          {/* RED */}
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow" />
              <strong className="text-red-400">RED — Critical Safety Incidents</strong>
            </div>
            <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5">
              <li>Suspected Killing — Pinaghihinalaang pagpatay</li>
              <li>Person Found Unresponsive — Taong walang malay</li>
              <li>Suspected Sexual Assault — Seksiyonwal na pag-atake</li>
              <li>Armed Threat / Attack — Pananakot gamit ang armas</li>
            </ul>
          </div>

          {/* ORANGE */}
          <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/30 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 shadow" />
              <strong className="text-orange-400">ORANGE — Accidents and Emergencies</strong>
            </div>
            <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5">
              <li>Road Accident — Aksidente sa kalsada</li>
              <li>Fire Incident — Sunog</li>
              <li>Medical Emergency — Emerhensiyang medikal</li>
              <li>Flooding / Landslide — Baha / Pagguho ng lupa</li>
              <li>Missing Person — Nawawalang tao</li>
            </ul>
          </div>

          {/* YELLOW */}
          <div className="p-3 rounded-xl bg-yellow-950/20 border border-yellow-500/30 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400 shadow" />
              <strong className="text-yellow-400">YELLOW — Suspected Criminal Activities</strong>
            </div>
            <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5">
              <li>Theft / Robbery — Pagnanakaw / Holdup</li>
              <li>Suspected Break-in — Sapilitang pagpasok</li>
              <li>Scam / Fraud — Panloloko / Budol</li>
              <li>Illegal Drug Activity — Droga</li>
              <li>Physical Assault — Pananakit / Bugbog</li>
            </ul>
          </div>

          {/* GREEN */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow" />
              <strong className="text-emerald-400">GREEN — Community & Personal Safety</strong>
            </div>
            <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5">
              <li>Vandalism / Property Damage — Paninira</li>
              <li>Public Disturbance — Kaguluhan sa publiko</li>
              <li>Domestic Violence — Karahasan sa tahanan</li>
              <li>Sexual Harassment — Panliligalig</li>
              <li>Threats / Intimidation — Pananakot</li>
            </ul>
          </div>

          {/* BLUE */}
          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow" />
              <strong className="text-blue-400">BLUE — Community Complaints & Online</strong>
            </div>
            <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5">
              <li>Noise Complaint — Reklamo sa ingay</li>
              <li>Drunk and Disorderly — Lasing na nanggugulo</li>
              <li>Cyber Harassment — Panliligalig sa internet</li>
              <li>Online Threats — Pagbabanta sa internet</li>
            </ul>
          </div>

          {/* WHITE */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-200 shadow" />
              <strong className="text-slate-200">WHITE — Other / Unclassified</strong>
            </div>
            <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5">
              <li>Not Sure / Other — Hindi tiyak / Iba pa</li>
              <li className="text-slate-400 italic">Manual dispatch inspection required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
