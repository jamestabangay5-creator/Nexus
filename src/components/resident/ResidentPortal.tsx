import React, { useState, useMemo } from 'react';
import { useNexus } from '../../context/NexusContext';
import { Agency, IncidentTypeId, IncidentReport } from '../../types';
import { INCIDENT_TYPES, AGENCY_DETAILS, BARANGAYS } from '../../constants/incidentData';
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
  Map
} from 'lucide-react';
import { IncidentMapView } from '../map/IncidentMapView';

export const ResidentPortal: React.FC = () => {
  const {
    reports,
    residentUser,
    submitIncidentReport,
    language,
  } = useNexus();

  const t = TRANSLATIONS[language];

  // Modals
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'tracking' | 'map'>('report');

  // Form State
  // Requirement 10: "Display three box buttons: PNP, BFP, and MDRRMO. Residents must select an agency before completing an incident report."
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [selectedIncidentType, setSelectedIncidentType] = useState<IncidentTypeId | ''>('');
  const [dateTime, setDateTime] = useState<string>(() => {
    return new Date().toISOString().slice(0, 16);
  });
  const [barangay, setBarangay] = useState<string>(BARANGAYS[0]);
  const [locationDetails, setLocationDetails] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 14.6042, lng: 120.9822 });
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [submittedReport, setSubmittedReport] = useState<IncidentReport | null>(null);
  const [showAgencyRequiredError, setShowAgencyRequiredError] = useState(false);

  // My Reports (Reports filed by resident user)
  const myReports = useMemo(() => {
    return reports.filter((r) => r.residentId === residentUser.id || r.residentName === residentUser.name);
  }, [reports, residentUser]);

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
      url: 'https://images.unsplash.com/photo-1590483736427-4a004410a566?auto=format&fit=crop&w=800&q=80',
    },
  ];

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
      barangay,
      locationDetails: locationDetails || `Near ${barangay}`,
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
      {/* Resident Welcome & Upper-Left Profile Card (Requirement 9) */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Upper-Left Profile Card per Requirement 9 */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={residentUser.avatarUrl}
              alt={residentUser.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500 shadow-xl"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 h-4 w-4 rounded-full border-2 border-slate-950 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
                Verified Resident Account
              </span>
              {residentUser.termsAccepted && (
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {t.termsAcceptedBadge}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white mt-0.5">
              {residentUser.name}
            </h1>
            <p className="text-xs text-slate-400">
              {residentUser.barangay} · {residentUser.phone}
            </p>
          </div>
        </div>

        {/* Quick Profile Actions: Profile, Edit Account, Language, Terms */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end text-xs">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-slate-200 font-semibold transition cursor-pointer"
          >
            {t.residentProfile} & Settings
          </button>

          <button
            onClick={() => setIsTermsOpen(true)}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Terms & Privacy</span>
            </span>
          </button>
        </div>
      </div>

      {/* Tabs: File Report vs Track My Reports */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'report'
              ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Send className="w-4 h-4 text-purple-400" />
          <span>{t.tabNewReport}</span>
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'tracking'
              ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{t.tabMyReports}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-blue-400 font-mono font-bold">
            {myReports.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'map'
              ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Map className="w-4 h-4 text-emerald-400" />
          <span>{t.tabMapHeatmap}</span>
        </button>
      </div>

      {/* TAB 1: INCIDENT REPORTING FORM */}
      {activeTab === 'report' && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Requirement 10: Three Box Buttons for Agency Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
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
              <span className="text-[11px] text-blue-400 bg-blue-950/70 border border-blue-800/60 px-3 py-1.5 rounded-xl max-w-sm">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Box 1: PNP */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAgency('PNP');
                  setShowAgencyRequiredError(false);
                }}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedAgency === 'PNP'
                    ? 'bg-blue-950/80 border-blue-500 shadow-xl shadow-blue-950/80 ring-2 ring-blue-500/40 transform -translate-y-1'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <span className="font-mono text-xl font-black text-white">PNP</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Philippine National Police
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Crimes, armed threats, assaults, theft, disturbances, and personal security.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-blue-400">Hotline: 911</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      selectedAgency === 'PNP'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-slate-500'
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
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedAgency === 'BFP'
                    ? 'bg-orange-950/80 border-orange-500 shadow-xl shadow-orange-950/80 ring-2 ring-orange-500/40 transform -translate-y-1'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                    <Flame className="w-7 h-7" />
                  </div>
                  <span className="font-mono text-xl font-black text-white">BFP</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Bureau of Fire Protection
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Fire alarms, structural blazes, gas leaks, electrical fires, and hazardous rescue.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-orange-400">Hotline: 160</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      selectedAgency === 'BFP'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-900 text-slate-500'
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
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedAgency === 'MDRRMO'
                    ? 'bg-emerald-950/80 border-emerald-500 shadow-xl shadow-emerald-950/80 ring-2 ring-emerald-500/40 transform -translate-y-1'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <Activity className="w-7 h-7" />
                  </div>
                  <span className="font-mono text-xl font-black text-white">MDRRMO</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Disaster Risk Reduction & Management
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Floods, landslides, severe typhoons, medical traumas, and mass evacuation.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400">Hotline: 122</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      selectedAgency === 'MDRRMO'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {selectedAgency === 'MDRRMO' ? '✓ Selected' : 'Select MDRRMO'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Incident Details Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/40">
                  2
                </span>
                <span>{t.step2Details}</span>
              </h3>

              {/* Requirement 11: Note about initial report */}
              <div className="mt-2 p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
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
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">{t.selectIncidentPlaceholder}</option>
                {INCIDENT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.number}. {type.en} — {type.fil} [{type.category}]
                  </option>
                ))}
              </select>
            </div>

            {/* Date Time & Barangay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>{t.barangayLabel} <span className="text-red-400">*</span></span>
                </label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                >
                  {BARANGAYS.map((brgy) => (
                    <option key={brgy} value={brgy}>
                      {brgy}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Specific Landmark / Street */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                {t.specificLocationLabel} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                required
                placeholder="e.g. Purok 5, across Jollibee, near basketball court..."
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs placeholder-slate-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Coordinates / Map Pin Picker */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  GPS Pinpoint Location:
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Your device geolocation is auto-calibrated for Barangay {barangay}. Responders will navigate to these exact coordinates.
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
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-xs placeholder-slate-500 focus:ring-1 focus:ring-purple-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Photo Evidence (Requirement 11) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.photoEvidenceLabel}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Upload file or pick quick sample
                </span>
              </label>

              {/* Photo preview if present */}
              {photoUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-w-sm">
                  <img
                    src={photoUrl}
                    alt="Uploaded evidence"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setPhotoCaption('');
                    }}
                    className="absolute top-2 right-2 bg-slate-900/90 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[10px]"
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
              <div className="flex flex-wrap items-center gap-3">
                <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition">
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  <span>Upload from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <span className="text-xs text-slate-500">or use test evidence:</span>

                <div className="flex flex-wrap gap-1.5">
                  {samplePhotoPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPhotoUrl(preset.url);
                        setPhotoCaption(preset.title);
                      }}
                      className="px-2.5 py-1 text-[11px] bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-lg text-slate-300 transition"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Terms reminder notice */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>R.A. 10173 Protected Emergency System</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="text-blue-400 hover:underline"
              >
                Review Terms & Conditions
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-rose-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-red-950/60 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{t.submitReportBtn}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: RESIDENT REPORT STATUS TRACKING (Requirements 13 & 14) */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Live Incident Status Tracker (Requirement 13)
              </h3>
              <p className="text-xs text-slate-400">
                Track status updates, verification milestones, and responder communications.
              </p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800 px-3 py-1 rounded-lg">
              {myReports.length} Submitted by You
            </span>
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {myReports.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2 stroke-1" />
                <p className="text-sm font-semibold text-slate-300">
                  No reports filed yet.
                </p>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                  When you submit an emergency or public safety report, real-time progress and verification updates appear here.
                </p>
                <button
                  onClick={() => setActiveTab('report')}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
                >
                  File First Report
                </button>
              </div>
            ) : (
              myReports.map((report) => {
                const typeDef = INCIDENT_TYPES.find(
                  (t) => t.id === (report.verifiedTypeId || report.initialTypeId)
                );

                return (
                  <div
                    key={report.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-blue-400">
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
                        <h4 className="text-base font-bold text-white mt-1">
                          {language === 'fil' ? typeDef?.fil : typeDef?.en}
                        </h4>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-center ${
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

                    {/* Progress Pipeline */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] mb-2 text-slate-400">
                        <span className="font-semibold text-slate-200">Dispatch Status Timeline:</span>
                        <span>Agency: {report.selectedAgency}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        <div
                          className={`p-2 rounded-lg font-bold border ${
                            report.status !== 'Rejected'
                              ? 'bg-blue-950/80 border-blue-500/60 text-blue-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          1. Submitted
                        </div>

                        <div
                          className={`p-2 rounded-lg font-bold border ${
                            report.status === 'Accepted' || report.status === 'Ongoing' || report.status === 'Resolved'
                              ? 'bg-blue-950/80 border-blue-500/60 text-blue-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          2. Accepted
                        </div>

                        <div
                          className={`p-2 rounded-lg font-bold border ${
                            report.status === 'Ongoing' || report.status === 'Resolved'
                              ? 'bg-orange-950/80 border-orange-500/60 text-orange-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          3. Ongoing
                        </div>

                        <div
                          className={`p-2 rounded-lg font-bold border ${
                            report.status === 'Resolved'
                              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          4. Resolved
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block">{report.barangay}</strong>
                          <span>{report.locationDetails}</span>
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
          <IncidentMapView />
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
    </div>
  );
};
