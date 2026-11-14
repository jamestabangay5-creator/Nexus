import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  getBarangayFromCoordinates,
} from '../../constants/orientalMindoroData';
import { TRANSLATIONS } from '../../constants/translations';
import { compressEvidenceImage } from '../../utils/imageUtils';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import { UserProfileModal } from './UserProfileModal';
import { RealtimeCameraModal } from './RealtimeCameraModal';
import { IncidentLocationPickerMap } from './IncidentLocationPickerMap';
import { AgencyLogo } from '../common/AgencyLogo';
import { ExportReportsButton } from '../common/ExportReportsButton';
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
  ChevronLeft,
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
  Eye,
  RotateCcw,
  LayoutList,
  LayoutGrid,
  AlertCircle
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
    isOnline,
    openAuthModal,
    residentActiveTab,
    setResidentActiveTab,
    reportFormScrollTrigger,
    triggerSuccessModal,
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
  const [selectedMunicipality, setSelectedMunicipality] = useState<OrientalMindoroMunicipality>('Bongabong');
  const [barangay, setBarangay] = useState<string>(
    () => residentUser.barangay || getBarangayFromCoordinates(12.7508, 121.4864) || 'Poblacion'
  );
  const [locationDetails, setLocationDetails] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => {
    return MUNICIPALITY_COORDINATES['Bongabong'] || { lat: 12.7508, lng: 121.4864 };
  });

  // Sync address defaults with resident profile if updated
  useEffect(() => {
    setSelectedMunicipality('Bongabong');
    if (residentUser.barangay) {
      setBarangay(residentUser.barangay);
      if (!locationSuccess) {
        setCoords(getCoordinatesForBarangay('Bongabong', residentUser.barangay));
      }
    }
  }, [residentUser.barangay]);

  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [compressingEvidence, setCompressingEvidence] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<IncidentReport | null>(null);
  const [showAgencyRequiredError, setShowAgencyRequiredError] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tracking Filter & Search State
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingStatusFilter, setTrackingStatusFilter] = useState('ALL');
  const [trackingCategoryFilter, setTrackingCategoryFilter] = useState('ALL');
  const [trackingAgencyFilter, setTrackingAgencyFilter] = useState('ALL');
  const [trackingDateFilter, setTrackingDateFilter] = useState<'ALL' | '24h' | '7d' | '30d' | 'custom'>('ALL');
  const [trackingCustomStartDate, setTrackingCustomStartDate] = useState('');
  const [trackingCustomEndDate, setTrackingCustomEndDate] = useState('');

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const trackingDateValidationError = useMemo(() => {
    if (trackingDateFilter !== 'custom') return null;
    if (trackingCustomStartDate && trackingCustomStartDate > todayStr) {
      return 'Starting date cannot be in the future. Reports can only be filtered up to today.';
    }
    if (trackingCustomEndDate && trackingCustomEndDate > todayStr) {
      return 'Ending date cannot be in the future. Please select today or an earlier date.';
    }
    if (trackingCustomStartDate && trackingCustomEndDate && trackingCustomStartDate > trackingCustomEndDate) {
      return "Invalid date range: 'From' date cannot be later than 'To' date.";
    }
    return null;
  }, [trackingDateFilter, trackingCustomStartDate, trackingCustomEndDate, todayStr]);
  const [trackingViewMode, setTrackingViewMode] = useState<'cards' | 'table'>('cards');

  // Pagination for Resident Reports
  const [trackingPage, setTrackingPage] = useState(1);
  const [trackingPageSize, setTrackingPageSize] = useState(10);

  // My Reports (Reports filed by resident user) - sorted descending (newest on top)
  const myReports = useMemo(() => {
    return reports
      .filter((r) => r.residentId === residentUser.id || r.residentName === residentUser.name)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, residentUser]);

  // Reset pagination on filter change
  useEffect(() => {
    setTrackingPage(1);
  }, [trackingSearch, trackingStatusFilter, trackingCategoryFilter, trackingAgencyFilter, trackingDateFilter, trackingCustomStartDate, trackingCustomEndDate]);

  const hasActiveTrackingFilters =
    trackingSearch !== '' ||
    trackingStatusFilter !== 'ALL' ||
    trackingCategoryFilter !== 'ALL' ||
    trackingAgencyFilter !== 'ALL' ||
    trackingDateFilter !== 'ALL';

  const resetTrackingFilters = () => {
    setTrackingSearch('');
    setTrackingStatusFilter('ALL');
    setTrackingCategoryFilter('ALL');
    setTrackingAgencyFilter('ALL');
    setTrackingDateFilter('ALL');
    setTrackingCustomStartDate('');
    setTrackingCustomEndDate('');
    setTrackingPage(1);
  };

  const filteredMyReports = useMemo(() => {
    return myReports
      .filter((r) => {
        if (trackingStatusFilter !== 'ALL' && r.status !== trackingStatusFilter) return false;
        if (trackingCategoryFilter !== 'ALL' && r.category !== trackingCategoryFilter) return false;
        if (trackingAgencyFilter !== 'ALL' && r.selectedAgency !== trackingAgencyFilter) return false;

        // Date Filter
        if (trackingDateFilter !== 'ALL') {
          const now = Date.now();
          const repTime = new Date(r.createdAt || r.dateTime).getTime();
          if (trackingDateFilter === '24h' && now - repTime > 24 * 60 * 60 * 1000) return false;
          if (trackingDateFilter === '7d' && now - repTime > 7 * 24 * 60 * 60 * 1000) return false;
          if (trackingDateFilter === '30d' && now - repTime > 30 * 24 * 60 * 60 * 1000) return false;
          if (trackingDateFilter === 'custom' && !trackingDateValidationError) {
            if (trackingCustomStartDate) {
              const start = new Date(trackingCustomStartDate + 'T00:00:00').getTime();
              if (repTime < start) return false;
            }
            if (trackingCustomEndDate) {
              const end = new Date(trackingCustomEndDate + 'T23:59:59.999').getTime();
              if (repTime > end) return false;
            }
          }
        }

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
  }, [myReports, trackingStatusFilter, trackingCategoryFilter, trackingAgencyFilter, trackingDateFilter, trackingCustomStartDate, trackingCustomEndDate, trackingSearch]);

  const totalMyReports = filteredMyReports.length;
  const totalTrackingPages = Math.max(1, Math.ceil(totalMyReports / trackingPageSize));
  const trackingStartIndex = (trackingPage - 1) * trackingPageSize;
  const paginatedMyReports = useMemo(() => {
    return filteredMyReports.slice(trackingStartIndex, trackingStartIndex + trackingPageSize);
  }, [filteredMyReports, trackingStartIndex, trackingPageSize]);

  const getCoordinatesForBarangay = (muni: OrientalMindoroMunicipality, brgyName: string) => {
    const center = MUNICIPALITY_COORDINATES[muni] || { lat: 12.7508, lng: 121.4864 };
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCompressingEvidence(true);
        // Compress evidence image so it doesn't exhaust browser storage quota
        const compressed = await compressEvidenceImage(file);
        setPhotoUrl(compressed);
        setPhotoCaption(file.name);
      } catch (err) {
        console.warn('Evidence compression fallback to standard reader:', err);
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (typeof uploadEvent.target?.result === 'string') {
            setPhotoUrl(uploadEvent.target.result);
            setPhotoCaption(file.name);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setCompressingEvidence(false);
      }
    }
  };

  const handleDetectGPS = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const detectedLat = Number(pos.coords.latitude.toFixed(5));
          const detectedLng = Number(pos.coords.longitude.toFixed(5));
          setCoords({
            lat: detectedLat,
            lng: detectedLng,
          });
          const autoBrgy = getBarangayFromCoordinates(detectedLat, detectedLng);
          setBarangay(autoBrgy);
          setIsLocating(false);
          setLocationSuccess(true);
          setTimeout(() => setLocationSuccess(false), 3000);
        },
        () => {
          // Fallback simulation centered on Bongabong
          const center = MUNICIPALITY_COORDINATES[selectedMunicipality] || { lat: 12.7508, lng: 121.4864 };
          const offsetLat = Number((center.lat + (Math.random() - 0.5) * 0.008).toFixed(5));
          const offsetLng = Number((center.lng + (Math.random() - 0.5) * 0.008).toFixed(5));
          setCoords({ lat: offsetLat, lng: offsetLng });
          const autoBrgy = getBarangayFromCoordinates(offsetLat, offsetLng);
          setBarangay(autoBrgy);
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

  // Automatically attempt device GPS detection upon accessing the reporting form
  const hasAttemptedAutoGpsRef = useRef(false);
  useEffect(() => {
    if (activeTab === 'report' && !hasAttemptedAutoGpsRef.current) {
      hasAttemptedAutoGpsRef.current = true;
      handleDetectGPS();
    }
  }, [activeTab]);

  const handleCopyTrackingCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (residentUser.accountStatus === 'deactivated') {
      alert('Your citizen reporting privileges have been deactivated due to repeated false alarm violations. You cannot file new emergency reports.');
      return;
    }

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
    const autoDescription = `${typeDef.en} (${typeDef.fil}) incident reported at ${locationDetails ? locationDetails + ', ' : ''}Barangay ${barangay}, Bongabong, Oriental Mindoro.`;

    const newReport = submitIncidentReport({
      residentId: residentUser.id,
      residentName: residentUser.name,
      residentPhone: residentUser.phone,
      selectedAgency,
      initialTypeId: selectedIncidentType,
      category: typeDef.category,
      dateTime,
      province: PROVINCE_NAME,
      municipality: 'Bongabong',
      barangay,
      locationDetails: locationDetails || `Barangay ${barangay}, Bongabong`,
      coordinates: coords,
      description: autoDescription,
      photoUrl: photoUrl || undefined,
      photoCaption: photoCaption || undefined,
    });

    setSubmittedReport(newReport);
    setActiveTab('tracking');

    // Trigger visual success modal feedback per user requirement
    triggerSuccessModal({
      title: 'Emergency Report Successfully Submitted!',
      message: `Your incident report ${newReport.trackingCode} has been officially registered and broadcast to ${newReport.selectedAgency}.`,
      trackingCode: newReport.trackingCode,
      agency: newReport.selectedAgency,
      statusBadge: 'Submitted & Dispatched',
      actionType: 'submit',
      details: `Location: ${barangay}, ${selectedMunicipality}. Responders and dispatch administrators have received your report.`
    });

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
      {/* Resident Welcome & Upper-Left Profile Card - Frosted Neo-Aero Glass */}
      <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Upper-Left Profile Card */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="relative shrink-0">
            <img
              src={residentUser.avatarUrl}
              alt={residentUser.name}
              className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl object-cover border-2 border-indigo-200 shadow-md"
            />
            <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${firebaseUser ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              <Check className="w-2.5 h-2.5 text-white" />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className={`text-xs uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${
                firebaseUser
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {firebaseUser ? 'Firebase Verified Resident' : 'Resident Citizen Portal'}
              </span>
              {residentUser.termsAccepted && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden xs:inline">{t.termsAcceptedBadge}</span>
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
              {residentUser.name}
            </h1>
            <p className="text-sm text-slate-600 font-medium mt-0.5">
              📍 {residentUser.barangay}, {residentUser.municipality || 'Calapan City'}, Oriental Mindoro · <span className="font-mono text-slate-700 font-semibold">{residentUser.phone}</span>
            </p>
          </div>
        </div>

        {/* Quick Profile & Auth Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end text-xs sm:text-sm">
          {!firebaseUser && (
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer min-h-[42px]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}

          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/90 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-bold transition shadow-xs cursor-pointer min-h-[42px] text-center"
          >
            {t.residentProfile} & Photo
          </button>

          <button
            onClick={() => setIsTermsOpen(true)}
            className="px-4 py-2.5 bg-white/90 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-bold transition shadow-xs cursor-pointer min-h-[42px] flex items-center justify-center"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Terms</span>
            </span>
          </button>
        </div>
      </div>

      {/* Submission Success Alert Notification Banner */}
      {submittedReport && (
        <div className="bg-emerald-50/95 border border-emerald-200/90 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Incident Report Dispatched Successfully!
                </span>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-xs">
                  {submittedReport.trackingCode}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                PNP, BFP, and MDRRMO have received your emergency dispatch with real-time location.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => handleCopyTrackingCode(submittedReport.trackingCode)}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              {copiedCode ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={() => setSubmittedReport(null)}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Requirement 3: Citizen Account Deactivated / Revoked Notice */}
      {residentUser?.accountStatus === 'deactivated' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-950 via-rose-950 to-red-900 text-white border-2 border-red-500 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-600/90 border border-red-400 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white rounded border border-red-400 shadow-xs">
                Reporting Account Deactivated & Revoked
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                Citizen Reporting Privileges Suspended — Repeated False Alarms
              </h3>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-red-100 font-medium leading-relaxed">
            Your emergency reporting access has been deactivated due to repeated confirmed false alarm violations ({residentUser.falseAlarmCount || 2} confirmed prank / fabricated reports). Submitting false alarms wastes vital emergency resources and is punishable under municipal and national penal laws.
          </p>
          <div className="p-3 bg-red-900/60 rounded-xl border border-red-400/30 text-xs text-red-200">
            <strong>Need to appeal?</strong> Contact the Philippine National Police (PNP) Bongabong Municipal Police Station at <span className="font-mono font-bold text-white">(043) 283-5192 / 0998-598-6086</span> for account review.
          </div>
        </div>
      )}

      {/* Requirement 2: First-Time Offense Official Warning Banner */}
      {residentUser?.accountStatus === 'warned' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/70 text-amber-950 shadow-lg space-y-2.5 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white rounded shadow-xs">
                Official Municipal Warning · 1st Offense
              </span>
              <h4 className="text-sm sm:text-base font-black text-amber-950 mt-0.5">
                False Alarm Violation Notice Logged on Your Account
              </h4>
            </div>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            An incident report previously filed from this account was verified as a false alarm / fabricated report by emergency responders. Submitting prank or fictitious emergency dispatches is strictly prohibited.
          </p>
          <div className="p-2.5 bg-amber-100/80 rounded-xl border border-amber-300 text-xs text-amber-950 font-bold">
            ⚠️ Caution: Any repeated false alarm violation will result in the immediate and permanent deactivation of your citizen reporting account.
          </div>
        </div>
      )}

      {/* Tabs: File Report vs Track My Reports vs Map View */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="glass-card-subtle bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 flex items-center gap-1.5 min-w-max shadow-sm">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === 'report'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-100 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            }`}
          >
            <Send className="w-4 h-4 text-indigo-600" />
            <span>{t.tabNewReport}</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === 'tracking'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-100 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{t.tabMyReports}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200/60 font-mono font-bold">
              {myReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer min-h-[44px] ${
              activeTab === 'map'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-100 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            }`}
          >
            <Map className="w-4 h-4 text-emerald-600" />
            <span>{t.tabMapHeatmap}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INCIDENT REPORTING FORM */}
      {activeTab === 'report' && (
        residentUser?.accountStatus === 'deactivated' ? (
          <div className="glass-card bg-white/95 backdrop-blur-xl border-2 border-red-300 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl max-w-xl mx-auto my-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 mx-auto flex items-center justify-center shadow-md">
              <AlertOctagon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-red-950 uppercase tracking-tight">
              Emergency Reporting Privileges Revoked
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              You cannot file incident reports because your citizen account has been deactivated following repeated confirmed false alarm violations ({residentUser.falseAlarmCount || 2} confirmed false alarms). For life-threatening emergencies, call Bongabong emergency hotlines directly.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('tracking')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
              >
                Inspect My Past Incidents
              </button>
            </div>
          </div>
        ) : (
          <form ref={reportFormRef} onSubmit={handleFormSubmit} className="space-y-6">
            {/* Photo Evidence & Live Camera (Placed on TOP when submitting a report) */}
            <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs">
                    <Camera className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>Photo Evidence & Live Camera</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                        Live
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Capture live photo of the incident or upload an image (Optional)
                    </p>
                  </div>
                </div>
              </div>

              {/* Photo preview if present */}
              {photoUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950/95 max-w-sm shadow-md flex flex-col items-center justify-center">
                  <img
                    src={photoUrl}
                    alt="Captured incident evidence"
                    className="w-full max-h-60 object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setPhotoCaption('');
                    }}
                    className="absolute top-2 right-2 bg-slate-900/90 text-white hover:bg-slate-900 px-2.5 py-1 rounded-lg text-xs font-bold shadow transition cursor-pointer"
                  >
                    Remove
                  </button>
                  {photoCaption && (
                    <div className="w-full p-2 text-xs text-slate-300 bg-slate-900/90 border-t border-slate-800 truncate font-medium">
                      {photoCaption}
                    </div>
                  )}
                </div>
              )}

              {/* Real-Time Live Camera & Upload Controls (Device Camera & Presets Removed) */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Button 1: Real-time Live Camera Viewfinder Modal */}
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 min-h-[46px]"
                >
                  <Camera className="w-4 h-4" />
                  <span>Live Camera Capture</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 font-black uppercase tracking-wider">
                    Live
                  </span>
                </button>

                {/* Button 2: Upload from Gallery / Files */}
                <label className={`flex-1 sm:flex-none px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition min-h-[46px] shadow-xs ${
                  compressingEvidence ? 'opacity-60 pointer-events-none' : ''
                }`}>
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>{compressingEvidence ? 'Optimizing Photo...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={compressingEvidence}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Requirement 10: Three Box Buttons for Agency Selection */}
          <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 flex items-center gap-2.5">
                  <span className="h-7 w-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-200">
                    1
                  </span>
                  <span>{t.step1Agency} (Required)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  Select the primary emergency response agency for your concern.
                </p>
              </div>
            </div>

            {showAgencyRequiredError && !selectedAgency && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex items-center gap-2 animate-bounce shadow-xs">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-bold">Please select one of the three agencies below before continuing.</span>
              </div>
            )}

            {/* Three Box Buttons: PNP, BFP, MDRRMO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
              {/* Box 1: PNP */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAgency('PNP');
                  setShowAgencyRequiredError(false);
                }}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative min-h-[175px] ${
                  selectedAgency === 'PNP'
                    ? 'bg-blue-50/90 border-blue-600 shadow-xl shadow-blue-500/15 ring-2 ring-blue-500/30 transform -translate-y-0.5'
                    : 'bg-white/80 border-slate-200/90 text-slate-700 hover:border-blue-300 hover:bg-white shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 p-1.5 rounded-xl bg-white text-blue-600 border border-blue-200/80 shadow-xs flex items-center justify-center shrink-0">
                    <AgencyLogo agency="PNP" className="w-9 h-9 object-contain" />
                  </div>
                  <span className="font-mono text-xl font-black text-slate-900">PNP</span>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 mb-1">
                    Philippine National Police
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium line-clamp-2">
                    Crimes, armed threats, assaults, theft, disturbances, and personal security.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-mono text-blue-700 font-black">Hotline: 911</span>
                  <span
                    className={`font-black px-3 py-1 rounded-lg text-xs uppercase transition ${
                      selectedAgency === 'PNP'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
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
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative min-h-[175px] ${
                  selectedAgency === 'BFP'
                    ? 'bg-orange-50/90 border-orange-600 shadow-xl shadow-orange-500/15 ring-2 ring-orange-500/30 transform -translate-y-0.5'
                    : 'bg-white/80 border-slate-200/90 text-slate-700 hover:border-orange-300 hover:bg-white shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 p-1.5 rounded-xl bg-white text-orange-600 border border-orange-200/80 shadow-xs flex items-center justify-center shrink-0">
                    <AgencyLogo agency="BFP" className="w-9 h-9 object-contain" />
                  </div>
                  <span className="font-mono text-xl font-black text-slate-900">BFP</span>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 mb-1">
                    Bureau of Fire Protection
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium line-clamp-2">
                    Fire alarms, structural blazes, gas leaks, electrical fires, and hazardous rescue.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-mono text-orange-700 font-black">Hotline: 160</span>
                  <span
                    className={`font-black px-3 py-1 rounded-lg text-xs uppercase transition ${
                      selectedAgency === 'BFP'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
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
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative min-h-[175px] ${
                  selectedAgency === 'MDRRMO'
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-500/30 transform -translate-y-0.5'
                    : 'bg-white/80 border-slate-200/90 text-slate-700 hover:border-emerald-300 hover:bg-white shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 p-1.5 rounded-xl bg-white text-emerald-600 border border-emerald-200/80 shadow-xs flex items-center justify-center shrink-0">
                    <AgencyLogo agency="MDRRMO" className="w-9 h-9 object-contain" />
                  </div>
                  <span className="font-mono text-xl font-black text-slate-900">MDRRMO</span>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 mb-1">
                    Disaster Risk Reduction & Management
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium line-clamp-2">
                    Floods, landslides, severe typhoons, medical traumas, and mass evacuation.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-mono text-emerald-700 font-black">Hotline: 122</span>
                  <span
                    className={`font-black px-3 py-1 rounded-lg text-xs uppercase transition ${
                      selectedAgency === 'MDRRMO'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedAgency === 'MDRRMO' ? '✓ Selected' : 'Select MDRRMO'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Incident Details Section */}
          <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 space-y-5">
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-200">
                  2
                </span>
                <span>{t.step2Details}</span>
              </h3>

              {/* Requirement 11: Note about initial report */}
              <div className="mt-2.5 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs sm:text-sm text-amber-950 font-medium flex items-start gap-2 shadow-xs">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>{t.initialReportNotice}</span>
              </div>
            </div>

            {/* Dropdown Options 1 to 24 - Requirement 11 */}
            <div>
              <label className="block text-sm sm:text-base font-black text-slate-900 mb-2">
                {t.incidentTypeLabel} <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedIncidentType}
                onChange={(e) => setSelectedIncidentType(e.target.value as IncidentTypeId)}
                required
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none min-h-[46px] shadow-xs"
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
                <label className="block text-sm sm:text-base font-black text-slate-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>{t.incidentDateTime} <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-3 text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none min-h-[46px] shadow-xs"
                />
              </div>

              {/* Bongabong Pilot Operational Location Selector */}
              <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Pilot Incident Location (Bongabong, Oriental Mindoro)</span>
                  </span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                    Province: Oriental Mindoro · Pilot Scope
                  </span>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Municipality (Pilot Exclusive)</span>
                  </label>
                  <div className="w-full bg-blue-50/90 border border-blue-200/90 text-blue-900 rounded-xl p-3 text-sm font-black flex items-center justify-between min-h-[46px] shadow-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Bongabong, Oriental Mindoro</span>
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-blue-600 text-white rounded-md">
                      Pilot Area
                    </span>
                  </div>
                </div>

                {/* Specific Landmark / Street */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    {t.specificLocationLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    required
                    placeholder="e.g. Purok 5, across market, near barangay hall, beside school..."
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-3 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none min-h-[46px] shadow-xs font-medium"
                  />
                </div>

                {/* Live Dispatch Address Banner */}
                <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-xl text-xs sm:text-sm text-indigo-950 font-medium flex items-center gap-2 shadow-xs">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
                  <span className="truncate">
                    Dispatch Destination: <strong className="text-slate-900">{locationDetails || 'Specific Landmark'}, {barangay}, Bongabong, Oriental Mindoro</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Coordinates / Map Pin Picker with GPS Detection */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs sm:text-sm space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                      GPS Dispatch Coordinates:
                    </span>
                    <span className="font-mono text-slate-700 font-bold text-xs sm:text-sm">
                      Latitude: {coords.lat.toFixed(5)}, Longitude: {coords.lng.toFixed(5)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer self-start sm:self-center shadow-xs min-h-[40px]"
                >
                  <Navigation className={`w-4 h-4 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Acquiring GPS...' : locationSuccess ? 'GPS Updated!' : 'Detect My Exact GPS'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Responders use these exact coordinates for real-time dispatch navigation and map plotting.
              </p>
            </div>

            {/* Real-time Interactive Location Verification Map */}
            <IncidentLocationPickerMap
              coords={coords}
              onCoordinatesChange={(newCoords) => {
                setCoords(newCoords);
                const autoBrgy = getBarangayFromCoordinates(newCoords.lat, newCoords.lng);
                setBarangay(autoBrgy);
              }}
              barangay={barangay}
              municipality={selectedMunicipality}
              isLocating={isLocating}
              onDetectGPS={handleDetectGPS}
              locationSuccess={locationSuccess}
            />

            {/* Terms reminder notice */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>R.A. 10173 Protected Emergency System</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="text-blue-700 hover:underline cursor-pointer text-left sm:text-right font-bold"
              >
                Review Terms & Conditions
              </button>
            </div>

            {/* Offline Alert Indicator if disconnected */}
            {!isOnline && (
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-amber-950 shadow-2xs">
                <span className="h-3 w-3 rounded-full bg-amber-500 animate-ping shrink-0" />
                <div>
                  <strong className="block font-bold">Offline Emergency Filing Active</strong>
                  <span className="text-xs sm:text-sm text-amber-900 font-medium">
                    Your report will be immediately registered and securely cached on your device. Once connection returns, it automatically transmits to Bongabong emergency response teams.
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4.5 sm:py-5 bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 text-white rounded-2xl text-base sm:text-lg font-black flex items-center justify-center gap-2.5 shadow-xl shadow-rose-500/25 active:scale-[0.99] transition cursor-pointer min-h-[54px]"
              >
                <Send className="w-5 h-5" />
                <span>{isOnline ? t.submitReportBtn : 'Submit Emergency Report Offline'}</span>
              </button>
            </div>
          </div>
        </form>
      ))}

      {/* TAB 2: RESIDENT REPORT STATUS TRACKING */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          {/* Header Banner with Export & View Toggle */}
          <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-30">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Live Incident Status Tracker (Requirement 13)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                Track status updates, verification milestones, and responder communications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <span className="text-xs sm:text-sm font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-xl">
                {myReports.length} Filed
              </span>

              {/* View Mode Toggle: Cards vs Table */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setTrackingViewMode('cards')}
                  title="Card View"
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    trackingViewMode === 'cards'
                      ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingViewMode('table')}
                  title="Accessible Table View"
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    trackingViewMode === 'table'
                      ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              {/* Citizen Incident Export Dossier */}
              <ExportReportsButton
                reports={filteredMyReports}
                agencyScope="RESIDENT"
                officerName={residentUser.name}
                buttonLabel="Download Incident Dossier"
                filtersApplied={{
                  category: trackingCategoryFilter,
                  status: trackingStatusFilter,
                  dateRange: trackingDateFilter,
                  searchQuery: trackingSearch,
                }}
              />
            </div>
          </div>

          {/* Quick Filter & Search Bar for My Reports */}
          {myReports.length > 0 && (
            <div className="glass-card-subtle bg-white/85 border border-white/80 rounded-2xl p-3.5 space-y-3 shadow-xs relative z-20">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tracking code, details, location..."
                    value={trackingSearch}
                    onChange={(e) => setTrackingSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs font-medium min-h-[38px]"
                  />
                  {trackingSearch && (
                    <button
                      onClick={() => setTrackingSearch('')}
                      className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {hasActiveTrackingFilters && (
                  <button
                    onClick={resetTrackingFilters}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[38px] shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Filter Pills and Dropdowns Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Status Dropdown */}
                <select
                  value={trackingStatusFilter}
                  onChange={(e) => setTrackingStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs min-h-[38px] cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>

                {/* Category Dropdown */}
                <select
                  value={trackingCategoryFilter}
                  onChange={(e) => setTrackingCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs min-h-[38px] cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="RED">RED — Critical Safety</option>
                  <option value="ORANGE">ORANGE — Accidents & Emergencies</option>
                  <option value="YELLOW">YELLOW — Suspected Criminal</option>
                  <option value="GREEN">GREEN — Community Concerns</option>
                  <option value="BLUE">BLUE — Online & Complaints</option>
                  <option value="WHITE">WHITE — Other</option>
                </select>

                {/* Agency Dropdown */}
                <select
                  value={trackingAgencyFilter}
                  onChange={(e) => setTrackingAgencyFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs min-h-[38px] cursor-pointer"
                >
                  <option value="ALL">All Responding Agencies</option>
                  <option value="PNP">PNP (Police)</option>
                  <option value="BFP">BFP (Fire)</option>
                  <option value="MDRRMO">MDRRMO (Disaster)</option>
                </select>

                {/* Date Filter Dropdown */}
                <select
                  value={trackingDateFilter}
                  onChange={(e) => setTrackingDateFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs min-h-[38px] cursor-pointer"
                >
                  <option value="ALL">All Time</option>
                  <option value="24h">Past 24 Hours</option>
                  <option value="7d">Past 7 Days</option>
                  <option value="30d">Past 30 Days</option>
                  <option value="custom">Custom Date Range...</option>
                </select>
              </div>

              {/* Custom Date Interval Input Row */}
              {trackingDateFilter === 'custom' && (
                <div className="flex flex-col gap-2 pt-2.5 border-t border-slate-100 bg-slate-50/80 p-2.5 rounded-xl animate-in fade-in">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Select Date Interval:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600">From:</label>
                      <input
                        type="date"
                        value={trackingCustomStartDate}
                        max={todayStr}
                        onChange={(e) => setTrackingCustomStartDate(e.target.value)}
                        className={`bg-white border rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 shadow-2xs ${
                          (trackingCustomStartDate && trackingCustomStartDate > todayStr) ||
                          (trackingCustomStartDate && trackingCustomEndDate && trackingCustomStartDate > trackingCustomEndDate)
                            ? 'border-rose-400 bg-rose-50/50 text-rose-800'
                            : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600">To:</label>
                      <input
                        type="date"
                        value={trackingCustomEndDate}
                        max={todayStr}
                        min={trackingCustomStartDate || undefined}
                        onChange={(e) => setTrackingCustomEndDate(e.target.value)}
                        className={`bg-white border rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 shadow-2xs ${
                          (trackingCustomEndDate && trackingCustomEndDate > todayStr) ||
                          (trackingCustomStartDate && trackingCustomEndDate && trackingCustomStartDate > trackingCustomEndDate)
                            ? 'border-rose-400 bg-rose-50/50 text-rose-800'
                            : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {(trackingCustomStartDate || trackingCustomEndDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingCustomStartDate('');
                          setTrackingCustomEndDate('');
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                      >
                        Clear Dates
                      </button>
                    )}
                  </div>

                  {/* Reactive Date Validation Alert */}
                  {trackingDateValidationError && (
                    <div className="w-full flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{trackingDateValidationError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reports Content Area */}
          <div>
            {myReports.length === 0 ? (
              <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-10 sm:p-14 text-center text-slate-600 text-sm shadow-lg">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-2 stroke-1" />
                <p className="text-base font-bold text-slate-900">
                  No reports filed yet.
                </p>
                <p className="text-slate-600 font-medium mt-1 max-w-sm mx-auto text-xs sm:text-sm">
                  When you submit an emergency or public safety report, real-time progress and verification updates appear here.
                </p>
                <button
                  onClick={() => setActiveTab('report')}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer min-h-[42px] shadow-md shadow-blue-500/20"
                >
                  File First Report
                </button>
              </div>
            ) : filteredMyReports.length === 0 ? (
              <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-8 text-center text-slate-600 text-sm shadow-sm">
                <p className="font-semibold">No reports match your search or filter criteria.</p>
              </div>
            ) : trackingViewMode === 'table' ? (
              /* Accessible Table View (Especially beneficial for elders, tablets, and comprehensive desktop tracking) */
              <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50/90 text-slate-600 uppercase font-black text-xs tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="py-4 px-4 font-black w-36 whitespace-nowrap">Tracking Code</th>
                        <th className="py-4 px-4 font-black min-w-[190px]">Incident Category & Type</th>
                        <th className="py-4 px-4 font-black min-w-[180px]">Location Details</th>
                        <th className="py-4 px-4 font-black w-24 whitespace-nowrap">Agency</th>
                        <th className="py-4 px-4 font-black w-36 whitespace-nowrap">Date & Time</th>
                        <th className="py-4 px-4 font-black w-40 whitespace-nowrap">Status</th>
                        <th className="py-4 px-4 text-right font-black w-36 whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {paginatedMyReports.map((report) => {
                        const typeDef = INCIDENT_TYPES.find(
                          (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
                        );
                        return (
                          <tr
                            key={report.id}
                            className="hover:bg-slate-50/80 transition group cursor-pointer"
                            onClick={() => setSelectedReportId(report.id)}
                          >
                            <td className="py-4 px-4 font-mono font-black text-blue-700 whitespace-nowrap">
                              {report.trackingCode}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-900">
                                {language === 'fil' ? typeDef?.fil : typeDef?.en}
                              </div>
                              <span
                                className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${typeDef?.colorHex || '#64748b'}18`,
                                  color: typeDef?.colorHex || '#475569',
                                  border: `1px solid ${typeDef?.colorHex || '#64748b'}40`,
                                }}
                              >
                                {report.category}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-slate-900 block">
                                {report.barangay}, {report.municipality || 'Calapan City'}
                              </span>
                              <span className="text-slate-500 text-xs line-clamp-1">
                                {report.locationDetails}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-700">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                                {report.selectedAgency}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-600 text-xs whitespace-nowrap">
                              {new Date(report.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 ${
                                  report.status === 'Resolved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : report.status === 'Ongoing'
                                    ? 'bg-orange-50 text-orange-700 border-orange-300'
                                    : report.status === 'Accepted'
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : report.status === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-300'
                                }`}
                              >
                                {report.status === 'Resolved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {report.status === 'Ongoing' && <Clock className="w-3.5 h-3.5 animate-pulse" />}
                                {report.status === 'Pending Verification' && <Clock className="w-3.5 h-3.5" />}
                                <span>{t[report.status] || report.status}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReportId(report.id);
                                }}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Responsive Card View */
              <div className="space-y-3.5">
                {paginatedMyReports.map((report) => {
                  const typeDef = INCIDENT_TYPES.find(
                    (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
                  );

                  return (
                    <div
                      key={report.id}
                      className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 space-y-4 hover:shadow-2xl transition"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs sm:text-sm font-black text-blue-700">
                              {report.trackingCode}
                            </span>
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider"
                              style={{
                                backgroundColor: `${typeDef?.colorHex}18`,
                                color: typeDef?.colorHex,
                                border: `1px solid ${typeDef?.colorHex}40`,
                              }}
                            >
                              {report.category}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                            {language === 'fil' ? typeDef?.fil : typeDef?.en}
                          </h4>
                        </div>

                        {/* Status Badge & Inspect Dossier */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span
                            className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full border ${
                              report.status === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : report.status === 'Ongoing'
                                ? 'bg-orange-50 text-orange-700 border-orange-300'
                                : report.status === 'Accepted'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : report.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            {t[report.status] || report.status}
                          </span>
                          <button
                            onClick={() => setSelectedReportId(report.id)}
                            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs min-h-[40px]"
                            title="Inspect Full Incident Details & Audit Log"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Full Report</span>
                          </button>
                        </div>
                      </div>

                      {/* Rejection Notice if rejected */}
                      {report.status === 'Rejected' && report.rejection && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm space-y-1.5 text-rose-950">
                          <div className="flex items-center gap-2 font-bold text-rose-800">
                            <AlertOctagon className="w-4 h-4 text-rose-600" />
                            <span>Report Rejected by {report.rejection.agency}:</span>
                          </div>
                          <p className="italic pl-6 text-slate-900 font-medium">"{report.rejection.reason}"</p>
                          <span className="block text-xs text-slate-600 pl-6">
                            Reviewed by {report.rejection.rejectedByAdmin} on{' '}
                            {new Date(report.rejection.rejectedAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Progress Pipeline - Fully Responsive 2x2 on Mobile, 4-col on Tablet/Desktop */}
                      <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80">
                        <div className="flex items-center justify-between text-xs mb-2.5 text-slate-600 font-semibold">
                          <span className="font-bold text-slate-800">Dispatch Pipeline:</span>
                          <span className="font-mono text-indigo-700 font-bold">Agency: {report.selectedAgency}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                          <div
                            className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                              report.status !== 'Rejected'
                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>1. Submitted</span>
                          </div>

                          <div
                            className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                              report.status === 'Accepted' || report.status === 'Ongoing' || report.status === 'Resolved'
                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {(report.status === 'Accepted' || report.status === 'Ongoing' || report.status === 'Resolved') && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span>2. Accepted</span>
                          </div>

                          <div
                            className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                              report.status === 'Ongoing' || report.status === 'Resolved'
                                ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {(report.status === 'Ongoing' || report.status === 'Resolved') && (
                              <Check className="w-3.5 h-3.5 text-orange-600" />
                            )}
                            <span>3. Ongoing</span>
                          </div>

                          <div
                            className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                              report.status === 'Resolved'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {report.status === 'Resolved' && (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>4. Resolved</span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600 pt-1 font-medium">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900 block font-bold">{report.barangay}, {report.municipality || 'Calapan City'}</strong>
                            <span className="text-slate-700">{report.locationDetails}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Submitted on {new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Citizen Pagination Controls Bar */}
          {totalMyReports > 0 && (
            <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-slate-900 font-bold">{trackingStartIndex + 1}</strong> to{' '}
                  <strong className="text-slate-900 font-bold">{Math.min(trackingStartIndex + trackingPageSize, totalMyReports)}</strong> of{' '}
                  <strong className="text-slate-900 font-bold">{totalMyReports}</strong> filed reports
                </span>
                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Per page:</span>
                  <select
                    value={trackingPageSize}
                    onChange={(e) => {
                      setTrackingPageSize(Number(e.target.value));
                      setTrackingPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTrackingPage((p) => Math.max(1, p - 1))}
                  disabled={trackingPage === 1}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                    trackingPage === 1
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="text-xs font-bold text-slate-700 px-2">
                  Page {trackingPage} of {totalTrackingPages}
                </span>

                <button
                  onClick={() => setTrackingPage((p) => Math.min(totalTrackingPages, p + 1))}
                  disabled={trackingPage === totalTrackingPages}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                    trackingPage === totalTrackingPages
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
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

      {/* Real-Time Live Camera Capture Modal */}
      <RealtimeCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(dataUrl, caption) => {
          setPhotoUrl(dataUrl);
          if (caption) setPhotoCaption(caption);
        }}
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
