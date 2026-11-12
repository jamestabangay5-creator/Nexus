import React, { useState, useMemo, useEffect } from 'react';
import { useNexus } from '../../context/NexusContext';
import { Agency, IncidentTypeId, IncidentReport } from '../../types';
import { INCIDENT_TYPES, AGENCY_DETAILS } from '../../constants/incidentData';
import {
  ORIENTAL_MINDORO_MUNICIPALITIES,
  ORIENTAL_MINDORO_BARANGAYS,
  getBarangaysForMunicipality,
  MUNICIPALITY_COORDINATES,
  OrientalMindoroMunicipality,
  PROVINCE_NAME,
} from '../../constants/orientalMindoroData';
import { TRANSLATIONS } from '../../constants/translations';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import { UserProfileModal } from './UserProfileModal';
import {
  ShieldAlert,
  Flame,
  Activity,
  Send,
  Camera,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Building2,
  ChevronRight,
  Info,
  ShieldCheck,
  AlertOctagon,
  Image as ImageIcon,
  Check,
  Map,
  Navigation,
  Search,
  Filter,
  Copy,
  CheckCheck,
  LogIn,
  UserPlus,
  Eye
} from 'lucide-react';
import { IncidentMapView } from '../map/IncidentMapView';
import { ReportDetailModal } from '../admin/ReportDetailModal';

interface ResidentPortalProps {
  selectedReportId?: string | null;
  onSelectReport?: (id: string | null) => void;
}

export const ResidentPortal: React.FC<ResidentPortalProps> = ({
  selectedReportId: propSelectedReportId,
  onSelectReport: propOnSelectReport,
}) => {
  const {
    reports,
    residentUser,
    submitIncidentReport,
    language,
    firebaseUser,
    openAuthModal,
    residentActiveTab,
    setResidentActiveTab,
    reportFormScrollTrigger,
  } = useNexus();

  const t = TRANSLATIONS[language];

  // Modals
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [internalSelectedReportId, setInternalSelectedReportId] = useState<string | null>(null);

  const selectedReportId = propSelectedReportId !== undefined ? propSelectedReportId : internalSelectedReportId;
  const setSelectedReportId = (id: string | null) => {
    if (propOnSelectReport) propOnSelectReport(id);
    setInternalSelectedReportId(id);
  };

  const activeTab = residentActiveTab;
  const setActiveTab = setResidentActiveTab;

  const reportFormRef = React.useRef<HTMLFormElement>(null);

  // Auto-scroll directly to report form when triggered via mobile bottom navigation
  useEffect(() => {
    if (reportFormScrollTrigger > 0) {
      setTimeout(() => {
        reportFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [reportFormScrollTrigger]);

  // Form State with Oriental Mindoro Address Hierarchy
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [selectedIncidentType, setSelectedIncidentType] = useState<IncidentTypeId | ''>('');
  const [dateTime, setDateTime] = useState<string>(() => {
    return new Date().toISOString().slice(0, 16);
  });
  const [selectedMunicipality, setSelectedMunicipality] = useState<OrientalMindoroMunicipality>(
    () => (residentUser.municipality as OrientalMindoroMunicipality) || 'Calapan City'
  );
  const [barangay, setBarangay] = useState<string>(
    () => residentUser.barangay || getBarangaysForMunicipality('Calapan City')[0]
  );
  const [locationDetails, setLocationDetails] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => {
    const muni = (residentUser.municipality as OrientalMindoroMunicipality) || 'Calapan City';
    return MUNICIPALITY_COORDINATES[muni] || { lat: 13.4115, lng: 121.1803 };
  });

  // Sync address defaults with resident profile if updated
  useEffect(() => {
    if (residentUser.municipality) {
      setSelectedMunicipality(residentUser.municipality as OrientalMindoroMunicipality);
    }
    if (residentUser.barangay) {
      setBarangay(residentUser.barangay);
      if (!locationSuccess) {
        setCoords(getCoordinatesForBarangay((residentUser.municipality as OrientalMindoroMunicipality) || 'Calapan City', residentUser.barangay));
      }
    }
  }, [residentUser.municipality, residentUser.barangay]);

  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [submittedReport, setSubmittedReport] = useState<IncidentReport | null>(null);
  const [showAgencyRequiredError, setShowAgencyRequiredError] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tracking Filter & Search State
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingStatusFilter, setTrackingStatusFilter] = useState('ALL');

  // My Reports (Reports filed by resident user) - sorted descending (newest on top)
  const myReports = useMemo(() => {
    return reports
      .filter((r) => r.residentId === residentUser.id || r.residentName === residentUser.name)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, residentUser]);

  const filteredMyReports = useMemo(() => {
    return myReports
      .filter((r) => {
        if (trackingStatusFilter !== 'ALL' && r.status !== trackingStatusFilter) return false;
        if (trackingSearch.trim()) {
          const q = trackingSearch.toLowerCase();
          const matchCode = r.trackingCode.toLowerCase().includes(q);
          const matchDesc = r.description.toLowerCase().includes(q);
          const matchLoc = r.locationDetails.toLowerCase().includes(q);
          if (!matchCode && !matchDesc && !matchLoc) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myReports, trackingStatusFilter, trackingSearch]);

  // Handle Photo preset pick
  const samplePhotoPresets = [
    {
      title: 'Structural / Fire Smoke',
      url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Road / Vehicle Incident',
      url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Water Flood / Creek',
      url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'CCTV / Security Capture',
      url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const getCoordinatesForBarangay = (muni: OrientalMindoroMunicipality, brgyName: string) => {
    const center = MUNICIPALITY_COORDINATES[muni] || { lat: 13.4115, lng: 121.1803 };
    let hash = 0;
    for (let i = 0; i < brgyName.length; i++) {
      hash = (hash << 5) - hash + brgyName.charCodeAt(i);
      hash |= 0;
    }
    const angle = Math.abs(hash % 360) * (Math.PI / 180);
    const dist = 0.003 + (Math.abs(hash % 100) / 100) * 0.012;
    return {
      lat: Number((center.lat + Math.sin(angle) * dist).toFixed(5)),
      lng: Number((center.lng + Math.cos(angle) * dist).toFixed(5)),
    };
  };

  const handleMunicipalityChange = (newMuni: OrientalMindoroMunicipality) => {
    setSelectedMunicipality(newMuni);
    const brgys = getBarangaysForMunicipality(newMuni);
    const firstBrgy = brgys[0] || '';
    setBarangay(firstBrgy);
    if (!locationSuccess) {
      setCoords(getCoordinatesForBarangay(newMuni, firstBrgy));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (typeof uploadEvent.target?.result === 'string') {
          setPhotoUrl(uploadEvent.target.result);
          setPhotoCaption(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetectGPS = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setIsLocating(false);
          setLocationSuccess(true);
          setTimeout(() => setLocationSuccess(false), 3000);
        },
        () => {
          // Fallback simulation centered on selected Oriental Mindoro municipality
          const center = MUNICIPALITY_COORDINATES[selectedMunicipality] || { lat: 13.4115, lng: 121.1803 };
          const offsetLat = center.lat + (Math.random() - 0.5) * 0.008;
          const offsetLng = center.lng + (Math.random() - 0.5) * 0.008;
          setCoords({ lat: offsetLat, lng: offsetLng });
          setIsLocating(false);
          setLocationSuccess(true);
          setTimeout(() => setLocationSuccess(false), 3000);
        },
        { timeout: 4000 }
      );
    } else {
      setIsLocating(false);
      setLocationSuccess(true);
      setTimeout(() => setLocationSuccess(false), 3000);
    }
  };

  const handleCopyTrackingCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAgency) {
      setShowAgencyRequiredError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowAgencyRequiredError(false);

    if (!selectedIncidentType) {
      return;
    }

    // Check Terms acceptance - Requirement 8
    if (!residentUser.termsAccepted) {
      setIsTermsOpen(true);
      return;
    }

    const typeDef = INCIDENT_TYPES.find((t) => t.id === selectedIncidentType)!;

    const newReport = submitIncidentReport({
      residentId: residentUser.id,
      residentName: residentUser.name,
      residentPhone: residentUser.phone,
      selectedAgency,
      initialTypeId: selectedIncidentType,
      category: typeDef.category,
      dateTime,
      province: PROVINCE_NAME,
      municipality: selectedMunicipality,
      barangay,
      locationDetails: locationDetails || `Near ${barangay}, ${selectedMunicipality}`,
      coordinates: coords,
      description,
      photoUrl: photoUrl || undefined,
      photoCaption: photoCaption || undefined,
    });

    setSubmittedReport(newReport);
    setActiveTab('tracking');

    // Reset form fields
    setSelectedAgency(null);
    setSelectedIncidentType('');
    setDescription('');
    setLocationDetails('');
    setPhotoUrl('');
    setPhotoCaption('');
  };

  return (
    <div className="space-y-6">
      {/* Resident Welcome & Upper-Left Profile Card */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Upper-Left Profile Card */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <img
              src={residentUser.avatarUrl}
              alt={residentUser.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-purple-500 shadow-xl"
            />
            <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${firebaseUser ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              <Check className="w-2.5 h-2.5 text-white" />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                firebaseUser
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              }`}>
                {firebaseUser ? 'Firebase Verified Resident' : 'Resident Citizen Portal'}
              </span>
              {residentUser.termsAccepted && (
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="hidden xs:inline">{t.termsAcceptedBadge}</span>
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-xl font-black text-white mt-0.5">
              {residentUser.name}
            </h1>
            <p className="text-xs text-slate-300">
              📍 {residentUser.barangay}, {residentUser.municipality || 'Calapan City'}, Oriental Mindoro · <span className="font-mono text-slate-400">{residentUser.phone}</span>
            </p>
          </div>
        </div>

        {/* Quick Profile & Auth Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end text-xs">
          {!firebaseUser && (
            <button
              onClick={() => openAuthModal('login')}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/60 flex items-center gap-1.5 transition cursor-pointer min-h-[40px]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}

          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-xl text-slate-200 font-semibold transition cursor-pointer min-h-[40px] text-center"
          >
            {t.residentProfile} & Photo
          </button>

          <button
            onClick={() => setIsTermsOpen(true)}
            className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-xl text-slate-300 transition cursor-pointer min-h-[40px] flex items-center justify-center"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Terms</span>
            </span>
          </button>
        </div>
      </div>

      {/* Submission Success Alert Notification Banner */}
      {submittedReport && (
        <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Incident Report Dispatched Successfully!
                </span>
                <span className="font-mono text-xs font-bold text-white bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                  {submittedReport.trackingCode}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                PNP, BFP, and MDRRMO have received your emergency dispatch with real-time location.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => handleCopyTrackingCode(submittedReport.trackingCode)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-emerald-700 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedCode ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={() => setSubmittedReport(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Tabs: File Report vs Track My Reports vs Map View */}
      <div className="overflow-x-auto no-scrollbar border-b border-slate-800 pb-1">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer min-h-[42px] ${
              activeTab === 'report'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm ring-1 ring-purple-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Send className="w-4 h-4 text-purple-400" />
            <span>{t.tabNewReport}</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer min-h-[42px] ${
              activeTab === 'tracking'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm ring-1 ring-blue-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{t.tabMyReports}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950 text-blue-400 font-mono font-bold">
              {myReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer min-h-[42px] ${
              activeTab === 'map'
                ? 'bg-slate-900 border-slate-700 text-white shadow-sm ring-1 ring-emerald-500/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>{t.tabMapHeatmap}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INCIDENT REPORTING FORM */}
      {activeTab === 'report' && (
        <form ref={reportFormRef} onSubmit={handleFormSubmit} className="space-y-6">
          {/* Requirement 10: Three Box Buttons for Agency Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/40">
                    1
                  </span>
                  <span>{t.step1Agency} (Required)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select the primary emergency response agency for your concern.
                </p>
              </div>

              {/* Requirement 10: Centralized visibility note */}
              <span className="text-[11px] text-blue-400 bg-blue-950/70 border border-blue-800/60 px-3 py-1.5 rounded-xl max-w-sm self-start sm:self-auto">
                ℹ️ {t.agencyNotice}
              </span>
            </div>

            {showAgencyRequiredError && !selectedAgency && (
              <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 rounded-xl text-xs flex items-center gap-2 animate-bounce">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Please select one of the three agencies below before continuing.</span>
              </div>
            )}

            {/* Three Box Buttons: PNP, BFP, MDRRMO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1">
              {/* Box 1: PNP */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAgency('PNP');
                  setShowAgencyRequiredError(false);
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative min-h-[160px] ${
                  selectedAgency === 'PNP'
                    ? 'bg-blue-950/90 border-blue-500 shadow-xl shadow-blue-950/80 ring-2 ring-blue-500/50 transform -translate-y-0.5'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="font-mono text-lg sm:text-xl font-black text-white">PNP</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Philippine National Police
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    Crimes, armed threats, assaults, theft, disturbances, and personal security.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-blue-400 font-bold">Hotline: 911</span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase transition ${
                      selectedAgency === 'PNP'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {selectedAgency === 'PNP' ? '✓ Selected' : 'Select PNP'}
                  </span>
                </div>
              </button>

              {/* Box 2: BFP */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAgency('BFP');
                  setShowAgencyRequiredError(false);
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative min-h-[160px] ${
                  selectedAgency === 'BFP'
                    ? 'bg-orange-950/90 border-orange-500 shadow-xl shadow-orange-950/80 ring-2 ring-orange-500/50 transform -translate-y-0.5'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                    <Flame className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="font-mono text-lg sm:text-xl font-black text-white">BFP</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Bureau of Fire Protection
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    Fire alarms, structural blazes, gas leaks, electrical fires, and hazardous rescue.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-orange-400 font-bold">Hotline: 160</span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase transition ${
                      selectedAgency === 'BFP'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {selectedAgency === 'BFP' ? '✓ Selected' : 'Select BFP'}
                  </span>
                </div>
              </button>

              {/* Box 3: MDRRMO */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAgency('MDRRMO');
                  setShowAgencyRequiredError(false);
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative min-h-[160px] ${
                  selectedAgency === 'MDRRMO'
                    ? 'bg-emerald-950/90 border-emerald-500 shadow-xl shadow-emerald-950/80 ring-2 ring-emerald-500/50 transform -translate-y-0.5'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="font-mono text-lg sm:text-xl font-black text-white">MDRRMO</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Disaster Risk Reduction & Management
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    Floods, landslides, severe typhoons, medical traumas, and mass evacuation.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400 font-bold">Hotline: 122</span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase transition ${
                      selectedAgency === 'MDRRMO'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {selectedAgency === 'MDRRMO' ? '✓ Selected' : 'Select MDRRMO'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Incident Details Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-5">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/40">
                  2
                </span>
                <span>{t.step2Details}</span>
              </h3>

              {/* Requirement 11: Note about initial report */}
              <div className="mt-2.5 p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{t.initialReportNotice}</span>
              </div>
            </div>

            {/* Dropdown Options 1 to 24 - Requirement 11 */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                {t.incidentTypeLabel} <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedIncidentType}
                onChange={(e) => setSelectedIncidentType(e.target.value as IncidentTypeId)}
                required
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
              >
                <option value="">{t.selectIncidentPlaceholder}</option>
                {INCIDENT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.number}. {type.en} — {type.fil} [{type.category}]
                  </option>
                ))}
              </select>
            </div>

            {/* Date Time & Oriental Mindoro Administrative Location */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.incidentDateTime} <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Oriental Mindoro Administrative Area Selector */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>Oriental Mindoro Incident Location</span>
                  </span>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-full">
                    Province: Oriental Mindoro (Region IV-B)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Select Municipality / City <span className="text-red-400">*</span></span>
                    </label>
                    <select
                      value={selectedMunicipality}
                      onChange={(e) => handleMunicipalityChange(e.target.value as OrientalMindoroMunicipality)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px] font-semibold"
                    >
                      {ORIENTAL_MINDORO_MUNICIPALITIES.map((muni) => (
                        <option key={muni} value={muni}>
                          {muni}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{t.barangayLabel} ({getBarangaysForMunicipality(selectedMunicipality).length} in {selectedMunicipality}) <span className="text-red-400">*</span></span>
                    </label>
                    <select
                      value={barangay}
                      onChange={(e) => {
                        const newBrgy = e.target.value;
                        setBarangay(newBrgy);
                        if (!locationSuccess) {
                          setCoords(getCoordinatesForBarangay(selectedMunicipality, newBrgy));
                        }
                      }}
                      required
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px] font-semibold"
                    >
                      {getBarangaysForMunicipality(selectedMunicipality).map((brgy, idx) => (
                        <option key={`rp-brgy-${selectedMunicipality}-${brgy}-${idx}`} value={brgy}>
                          {brgy}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specific Landmark / Street */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.specificLocationLabel} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    required
                    placeholder="e.g. Purok 5, across Jollibee, near basketball court..."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
                  />
                </div>

                {/* Live Dispatch Address Banner */}
                <div className="p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-lg text-[11px] text-purple-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">
                    Dispatch Destination: <strong className="text-white">{locationDetails || 'Specific Landmark'}, {barangay}, {selectedMunicipality}, Oriental Mindoro</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Coordinates / Map Pin Picker with GPS Detection */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">
                      GPS Dispatch Coordinates:
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      Latitude: {coords.lat.toFixed(5)}, Longitude: {coords.lng.toFixed(5)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center"
                >
                  <Navigation className={`w-3.5 h-3.5 text-blue-400 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Acquiring GPS...' : locationSuccess ? 'GPS Updated!' : 'Detect My Exact GPS'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Responders use these exact coordinates for real-time dispatch navigation and map plotting.
              </p>
            </div>

            {/* Incident Narrative / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                {t.descriptionLabel} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe what happened, any casualties, weapons, number of suspects or victims involved..."
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-xs placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Photo Evidence (Requirement 11) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.photoEvidenceLabel}</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Upload evidence or pick quick sample
                </span>
              </div>

              {/* Photo preview if present */}
              {photoUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-w-sm">
                  <img
                    src={photoUrl}
                    alt="Uploaded evidence"
                    className="w-full h-44 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setPhotoCaption('');
                    }}
                    className="absolute top-2 right-2 bg-slate-900/95 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-700 shadow"
                  >
                    Remove
                  </button>
                  {photoCaption && (
                    <div className="p-2 text-[10px] text-slate-300 bg-slate-950/90 truncate">
                      {photoCaption}
                    </div>
                  )}
                </div>
              )}

              {/* Upload input + Presets */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition min-h-[44px]">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>Upload from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex-1">
                  <span className="text-slate-400 text-[11px] block mb-1.5">or quick sample presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {samplePhotoPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPhotoUrl(preset.url);
                          setPhotoCaption(preset.title);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-lg text-slate-300 transition cursor-pointer"
                      >
                        {preset.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Terms reminder notice */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>R.A. 10173 Protected Emergency System</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="text-blue-400 hover:underline cursor-pointer text-left sm:text-right"
              >
                Review Terms & Conditions
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-rose-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-red-950/60 transition cursor-pointer min-h-[48px]"
              >
                <Send className="w-4 h-4" />
                <span>{t.submitReportBtn}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: RESIDENT REPORT STATUS TRACKING */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Live Incident Status Tracker (Requirement 13)
              </h3>
              <p className="text-xs text-slate-400">
                Track status updates, verification milestones, and responder communications.
              </p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800 px-3 py-1 rounded-xl self-start sm:self-center">
              {myReports.length} Submitted by You
            </span>
          </div>

          {/* Quick Filter & Search Bar for My Reports */}
          {myReports.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by tracking code or details..."
                  value={trackingSearch}
                  onChange={(e) => setTrackingSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['ALL', 'Pending Verification', 'Accepted', 'Ongoing', 'Resolved'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTrackingStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      trackingStatusFilter === st
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reports List */}
          <div className="space-y-3">
            {myReports.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 sm:p-14 text-center text-slate-500 text-xs">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2 stroke-1" />
                <p className="text-sm font-semibold text-slate-300">
                  No reports filed yet.
                </p>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                  When you submit an emergency or public safety report, real-time progress and verification updates appear here.
                </p>
                <button
                  onClick={() => setActiveTab('report')}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold transition cursor-pointer min-h-[40px]"
                >
                  File First Report
                </button>
              </div>
            ) : filteredMyReports.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                <p>No reports match your search criteria.</p>
              </div>
            ) : (
              filteredMyReports.map((report) => {
                const typeDef = INCIDENT_TYPES.find(
                  (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
                );

                return (
                  <div
                    key={report.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 hover:border-slate-700 transition"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs sm:text-sm font-bold text-blue-400">
                            {report.trackingCode}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            style={{
                              backgroundColor: `${typeDef?.colorHex}22`,
                              color: typeDef?.colorHex,
                            }}
                          >
                            {report.category}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white mt-1">
                          {language === 'fil' ? typeDef?.fil : typeDef?.en}
                        </h4>
                      </div>

                      {/* Status Badge & Inspect Dossier */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            report.status === 'Resolved'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : report.status === 'Ongoing'
                              ? 'bg-orange-950 text-orange-400 border-orange-800'
                              : report.status === 'Accepted'
                              ? 'bg-blue-950 text-blue-400 border-blue-800'
                              : report.status === 'Rejected'
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : 'bg-amber-950 text-amber-400 border-amber-800'
                          }`}
                        >
                          {t[report.status] || report.status}
                        </span>
                        <button
                          onClick={() => setSelectedReportId(report.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Inspect Full Incident Dossier & Audit Log"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Dossier</span>
                        </button>
                      </div>
                    </div>

                    {/* Rejection Notice if rejected */}
                    {report.status === 'Rejected' && report.rejection && (
                      <div className="p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-xl text-xs space-y-1.5 text-rose-200">
                        <div className="flex items-center gap-1.5 font-bold text-rose-400">
                          <AlertOctagon className="w-4 h-4" />
                          <span>Report Rejected by {report.rejection.agency}:</span>
                        </div>
                        <p className="italic pl-5 text-white">"{report.rejection.reason}"</p>
                        <span className="block text-[10px] text-slate-400 pl-5">
                          Reviewed by {report.rejection.rejectedByAdmin} on{' '}
                          {new Date(report.rejection.rejectedAt).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Progress Pipeline - Fully Responsive 2x2 on Mobile, 4-col on Tablet/Desktop */}
                    <div className="bg-slate-950 p-3 sm:p-3.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] mb-2 text-slate-400">
                        <span className="font-semibold text-slate-200">Dispatch Pipeline:</span>
                        <span className="font-mono text-purple-300">Agency: {report.selectedAgency}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-bold">
                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                            report.status !== 'Rejected'
                              ? 'bg-blue-950/80 border-blue-500/60 text-blue-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          <Check className="w-3 h-3 text-blue-400" />
                          <span>1. Submitted</span>
                        </div>

                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                            report.status === 'Accepted' || report.status === 'Ongoing' || report.status === 'Resolved'
                              ? 'bg-blue-950/80 border-blue-500/60 text-blue-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {(report.status === 'Accepted' || report.status === 'Ongoing' || report.status === 'Resolved') && (
                            <Check className="w-3 h-3 text-blue-400" />
                          )}
                          <span>2. Accepted</span>
                        </div>

                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                            report.status === 'Ongoing' || report.status === 'Resolved'
                              ? 'bg-orange-950/80 border-orange-500/60 text-orange-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {(report.status === 'Ongoing' || report.status === 'Resolved') && (
                            <Check className="w-3 h-3 text-orange-400" />
                          )}
                          <span>3. Ongoing</span>
                        </div>

                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                            report.status === 'Resolved'
                              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {report.status === 'Resolved' && (
                            <Check className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>4. Resolved</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 pt-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block">{report.barangay}, {report.municipality || 'Calapan City'}</strong>
                          <span className="text-slate-300">{report.locationDetails}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Submitted on {new Date(report.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COLOR-CODED INCIDENT MAP & HEATMAP */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <IncidentMapView onSelectReport={(id) => setSelectedReportId(id)} />
        </div>
      )}

      {/* Modals */}
      <TermsAndConditionsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Full Dossier Inspector Modal (When standalone) */}
      {!propSelectedReportId && selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          isOpen={!!selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
};
