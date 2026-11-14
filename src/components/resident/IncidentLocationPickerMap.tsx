import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Layers,
  Crosshair,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface IncidentLocationPickerMapProps {
  coords: { lat: number; lng: number };
  onCoordinatesChange: (newCoords: { lat: number; lng: number }) => void;
  barangay?: string;
  municipality?: string;
  isLocating?: boolean;
  onDetectGPS?: () => void;
  locationSuccess?: boolean;
}

export const IncidentLocationPickerMap: React.FC<IncidentLocationPickerMapProps> = ({
  coords,
  onCoordinatesChange,
  barangay = 'Bongabong',
  municipality = 'Bongabong',
  isLocating = false,
  onDetectGPS,
  locationSuccess = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const [hasUserMovedPin, setHasUserMovedPin] = useState(false);

  // Custom high-visibility emergency dispatch marker icon
  const createPickerPinIcon = () => {
    return L.divIcon({
      className: 'location-picker-pin',
      html: `
        <div class="relative flex items-center justify-center" style="width: 44px; height: 50px;">
          <!-- GPS Radar Pulse Rings -->
          <div class="absolute bottom-1 w-10 h-10 rounded-full bg-blue-500/35 animate-ping pointer-events-none"></div>
          <div class="absolute bottom-1 w-5 h-5 rounded-full bg-blue-600/40 animate-pulse pointer-events-none"></div>

          <!-- Pin marker container -->
          <div class="relative z-10 flex flex-col items-center filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.4)] cursor-grab active:cursor-grabbing">
            <!-- Round Badge -->
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 border-2 border-white flex items-center justify-center text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3" fill="#ffffff" />
              </svg>
            </div>
            <!-- Pin Pointer Needle Tip -->
            <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-indigo-700 -mt-0.5"></div>
            <!-- Contact shadow -->
            <div class="w-3 h-1.5 bg-slate-900/60 rounded-full blur-[0.6px] mt-0.5"></div>
          </div>
        </div>
      `,
      iconSize: [44, 50],
      iconAnchor: [22, 48],
      popupAnchor: [0, -46],
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on current coords with neighborhood level zoom
    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // Zoom controls at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Attribution
    L.control.attribution({ position: 'bottomright' })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OSM</a> | Bongabong Emergency GIS')
      .addTo(map);

    // Initial Street Layer
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = streetLayer;

    // Draggable Pin Marker
    const marker = L.marker([coords.lat, coords.lng], {
      draggable: true,
      icon: createPickerPinIcon(),
      title: 'Emergency Dispatch Location (Drag or click map to move)',
    }).addTo(map);

    // Accuracy Circle
    const circle = L.circle([coords.lat, coords.lng], {
      radius: 30,
      color: '#3b82f6',
      fillColor: '#60a5fa',
      fillOpacity: 0.18,
      weight: 1.5,
      dashArray: '4, 4',
    }).addTo(map);

    // Bind popup with helpful instructions
    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 2px;">
        <strong style="color: #1e3a8a; display: block; margin-bottom: 2px;">📍 Verified Dispatch Location</strong>
        <span style="color: #475569;">Drag this pin or tap anywhere on the map to pinpoint your exact spot.</span>
      </div>
    `);

    // Handle marker dragend
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const newLat = Number(pos.lat.toFixed(5));
      const newLng = Number(pos.lng.toFixed(5));
      circle.setLatLng(pos);
      setHasUserMovedPin(true);
      onCoordinatesChange({ lat: newLat, lng: newLng });
    });

    // Handle map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = Number(e.latlng.lat.toFixed(5));
      const newLng = Number(e.latlng.lng.toFixed(5));
      marker.setLatLng([newLat, newLng]);
      circle.setLatLng([newLat, newLng]);
      setHasUserMovedPin(true);
      onCoordinatesChange({ lat: newLat, lng: newLng });
    });

    markerRef.current = marker;
    circleRef.current = circle;
    mapInstanceRef.current = map;

    // Invalidate size to guarantee smooth tile loading
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer on mapMode change (Street OSM vs Esri Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapMode === 'street') {
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
        }
      ).addTo(map);
    }
  }, [mapMode]);

  // Sync marker and pan map when coordinates prop changes from outside (e.g. GPS detected or barangay selected)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    const curPos = markerRef.current.getLatLng();
    const diffLat = Math.abs(curPos.lat - coords.lat);
    const diffLng = Math.abs(curPos.lng - coords.lng);

    // Only update if difference is meaningful (avoids feedback loops during drag)
    if (diffLat > 0.00003 || diffLng > 0.00003) {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
      if (circleRef.current) {
        circleRef.current.setLatLng([coords.lat, coords.lng]);
      }
      mapInstanceRef.current.flyTo(
        [coords.lat, coords.lng],
        Math.max(mapInstanceRef.current.getZoom(), 16),
        { animate: true, duration: 0.8 }
      );
    }
  }, [coords.lat, coords.lng]);

  const handleCenterOnPin = () => {
    if (mapInstanceRef.current && markerRef.current) {
      const pos = markerRef.current.getLatLng();
      mapInstanceRef.current.flyTo(pos, 17, { animate: true });
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition">
      {/* Map Header Bar */}
      <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              Incident Verification Map
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              Bongabong, Oriental Mindoro · Auto-Marked via GPS
            </span>
          </div>
        </div>

        {/* Status Pill & Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Status Badge */}
          {locationSuccess ? (
            <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>GPS Device Synced</span>
            </span>
          ) : hasUserMovedPin ? (
            <span className="px-2.5 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Pinpoint Verified</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
              <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auto-Marked Pin</span>
            </span>
          )}

          {/* Map Layer Mode Toggle */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setMapMode('street')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                mapMode === 'street'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-72 sm:h-80 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Controls Overlay on Map */}
        <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
          {/* Quick Recenter on Pin */}
          <button
            type="button"
            onClick={handleCenterOnPin}
            className="px-2.5 py-1.5 bg-white/95 backdrop-blur hover:bg-white text-slate-800 rounded-xl text-xs font-bold border border-slate-200/80 shadow-md flex items-center gap-1.5 cursor-pointer hover:border-slate-300 transition"
            title="Center map on pin"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Center on Pin</span>
          </button>

          {/* Quick Re-detect GPS button on map */}
          {onDetectGPS && (
            <button
              type="button"
              onClick={onDetectGPS}
              disabled={isLocating}
              className="px-2.5 py-1.5 bg-white/95 backdrop-blur hover:bg-white text-slate-800 rounded-xl text-xs font-bold border border-slate-200/80 shadow-md flex items-center gap-1.5 cursor-pointer hover:border-slate-300 transition disabled:opacity-60"
              title="Detect device GPS location"
            >
              <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isLocating ? 'Locating...' : 'GPS Device'}
              </span>
            </button>
          )}
        </div>

        {/* Bottom Banner with Pin Instructions */}
        <div className="absolute bottom-2 left-2 right-14 sm:right-auto z-[400] pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur text-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-[11px] font-medium flex items-center gap-2 max-w-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
            <span className="truncate">
              <strong>Drag pin</strong> or <strong>tap map</strong> to verify exact location.
            </span>
          </div>
        </div>
      </div>

      {/* Map Verification Footer Summary */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="font-bold text-slate-900">Current Pinpoint:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
          <span className="text-slate-500 font-medium">
            ({barangay}, {municipality})
          </span>
        </div>

        <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Coordinates sync in real time with emergency responders.</span>
        </div>
      </div>
    </div>
  );
};
