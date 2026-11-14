import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { TRANSLATIONS } from '../../constants/translations';
import { AGENCY_DETAILS } from '../../constants/incidentData';
import { ORIENTAL_MINDORO_MUNICIPALITIES, MUNICIPALITY_COORDINATES } from '../../constants/orientalMindoroData';
import { AgencyLogo } from '../common/AgencyLogo';
import {
  ShieldAlert,
  Flame,
  Activity,
  Radio,
  MapPin,
  Map,
  ShieldCheck,
  Clock,
  Sparkles,
  Phone,
  ArrowRight,
  UserCheck,
  Bell,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  ExternalLink,
  Users,
  Compass,
  Zap,
  Building2,
  LogIn,
  UserPlus
} from 'lucide-react';

interface LandingPageProps {
  onEnterResidentPortal: () => void;
  onOpenAgencyAuth: () => void;
  onOpenGlobalMap: () => void;
  onSelectReport?: (id: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterResidentPortal,
  onOpenAgencyAuth,
  onOpenGlobalMap,
}) => {
  const {
    reports,
    language,
    simulateIncomingIncident,
    firebaseUser,
    agencyUser,
    openAuthModal,
    setPortalMode,
    agencyDetails,
    adminProfiles,
  } = useNexus();
  const t = TRANSLATIONS[language];

  // Active step in interactive "How it works"
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);
  // Collapsible FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  // Selected municipality filter for showcase
  const [selectedMuni, setSelectedMuni] = useState<string>('Calapan City');

  const totalReports = reports.length;
  const activeReportsCount = reports.filter(
    (r) => r.status === 'Accepted' || r.status === 'Ongoing'
  ).length;
  const resolvedReportsCount = reports.filter((r) => r.status === 'Resolved').length;

  const workflowSteps = [
    {
      step: '01',
      titleEn: 'Citizen Emergency Reporting',
      titleFil: 'Pag-uulat ng Insidente ng Mamamayan',
      descEn:
        'A resident flags an emergency with category, exact Oriental Mindoro municipality & barangay, GPS pin, detailed description, and uploaded camera photo evidence.',
      descFil:
        'Mabilis na inuulat ng residente ang emergency kasama ang kategorya, lokasyon sa Oriental Mindoro, GPS pin, at totoong litrato.',
      badge: 'Step 1: Ingestion',
      icon: AlertTriangle,
      color: 'from-purple-600 to-indigo-600',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      features: ['Photo & Camera Evidence', 'GPS Geolocation & Barangay Selector', 'Verified Resident Identity'],
    },
    {
      step: '02',
      titleEn: 'Real-Time Cloud Triage & Color Coding',
      titleFil: 'Triage sa Cloud at Pag-uuri ng Kulay',
      descEn:
        'The report synchronizes instantly to Google Cloud Firestore. The system automatically tags it by urgency: RED (Critical Safety), BLUE (Police), ORANGE (Fire), and GREEN (Medical & Rescue).',
      descFil:
        'Agad na sinisink sa Google Cloud Firestore. May dynamic color-coding: Pula para sa kritikal, Asul sa Pulis, Kahel sa Bumbero, at Berde sa Medikal.',
      badge: 'Step 2: Analysis',
      icon: Cpu,
      color: 'from-amber-600 to-red-600',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      features: ['Automated Color Classification', 'Urgency Triage (Critical/High/Med)', 'Firestore Real-time Listeners'],
    },
    {
      step: '03',
      titleEn: 'Simultaneous Multi-Agency Broadcast',
      titleFil: 'Sabay-sabay na Alerto sa Lahat ng Ahensya',
      descEn:
        'Sirens and real-time visual alerts flash simultaneously across the Central Command, PNP Police, BFP Fire, and MDRRMO Rescue dispatch consoles without departmental silos.',
      descFil:
        'Pumupukaw ng siren at visual alarm sa lahat ng console nang sabay-sabay para walang pagkaantala o pagtatakip ng impormasyon.',
      badge: 'Step 3: Inter-Agency Link',
      icon: Radio,
      color: 'from-blue-600 to-cyan-600',
      tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      features: ['Audio Siren & Flashing Alert', 'Centralized Agency Dashboard', 'Cross-Agency Interoperability'],
    },
    {
      step: '04',
      titleEn: 'Rapid Dispatch & Live Citizen Tracking',
      titleFil: 'Mabilis na Pagtugon at Pagsubaybay ng Residente',
      descEn:
        'Commanders verify and dispatch patrol vehicles, fire engines, or medical teams. The reporting resident observes live timeline status changes until the case is officially resolved.',
      descFil:
        'Nagpapadala ang ahensya ng mga yunit at sinusubaybayan ng mamamayan ang bawat hakbang hanggang matagumpay na maresolba.',
      badge: 'Step 4: Resolution',
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-600',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      features: ['Real-time Status Timeline', 'Official Response Notes & Units', 'Immutable Audit Activity Logs'],
    },
  ];

  const faqs = [
    {
      qEn: 'What is NEXUS and what problem does it solve?',
      qFil: 'Ano ang NEXUS at ano ang layunin nito?',
      aEn:
        'NEXUS is a unified multi-agency emergency incident management and operations platform pilot-tested for the Municipality of Bongabong, Oriental Mindoro. Historically, citizens had to call separate numbers for Police (PNP), Fire (BFP), and Medical/Disaster (MDRRMO), causing delay and miscommunication. NEXUS consolidates emergency reporting into a single cloud ecosystem with real-time GIS mapping, synchronized alerts, and automated multi-agency response.',
      aFil:
        'Ang NEXUS ay isang pinag-isang sistema ng pamamahala sa emergency para sa Bayan ng Bongabong, Oriental Mindoro. Pinagsasama nito ang Pulisya (PNP), Bumbero (BFP), at Disaster/Medikal (MDRRMO) sa iisang plataporma upang mabilis na maaksyunan ang bawat sakuna.',
    },
    {
      qEn: 'Who can use the Resident Citizen Portal?',
      qFil: 'Sino ang maaaring gumamit ng Resident Citizen Portal?',
      aEn:
        'Any resident, visitor, or worker within the 32 barangays of Bongabong, Oriental Mindoro can access the portal to report emergencies, view safety bulletins, and track their filed reports. Residents can sign in with Google or Email and complete their verified profile with photo upload to eliminate prank reports and ensure swift responder recognition.',
      aFil:
        'Lahat ng residente sa 32 barangay ng Bongabong ay maaaring mag-ulat ng emergency, mag-upload ng litrato, at subaybayan ang pagtugon ng mga ahensya gamit ang kanilang verified account.',
    },
    {
      qEn: 'How does Centralized Agency Command work?',
      qFil: 'Paano gumagana ang Centralized Agency Command?',
      aEn:
        'Agency dispatchers and commanders log in via official credentials (e.g. systemadmin@nexus.gov.ph). The Centralized Command view displays all incoming incidents across police, fire, and disaster scopes simultaneously. Agency tabs (Central, PNP, BFP, MDRRMO) allow filtered operational views, dispatching responder units, issuing inter-agency assistance requests, and reclassifying incident priorities.',
      aFil:
        'Ang mga opisyal na responder ay may access sa Centralized Dashboard kung saan sabay-sabay nilang nakikita ang lahat ng insidente sa pulisya, bumbero, at rescue, at mabilis na nakakapagpadala ng mga tauhan.',
    },
    {
      qEn: 'Is Leaflet GIS Map accurate for Bongabong?',
      qFil: 'Wasto ba ang Leaflet GIS Map para sa Bongabong?',
      aEn:
        'Yes. NEXUS integrates Leaflet OpenStreetMap with custom coordinates for all 32 barangays in the Municipality of Bongabong, Oriental Mindoro. It supports street and satellite view layers, live density heatmaps, and interactive marker clustering.',
      aFil:
        'Oo. May kumpletong coordinates ang sistema para sa lahat ng 32 barangay ng Bongabong, may street at satellite layer, at live heatmap ng mga insidente.',
    },
    {
      qEn: 'What are the official emergency hotlines in Bongabong?',
      qFil: 'Ano ang mga opisyal na emergency hotlines sa Bongabong?',
      aEn:
        'PNP Bongabong Police Station: 0998-598-5918 / (043) 283-5190 | BFP Bongabong Fire Station: 0917-814-3119 | MDRRMO Bongabong Emergency Rescue: 0915-288-8880 / (043) 283-5334 | Philippine Red Cross: 143.',
      aFil:
        'PNP Bongabong: 0998-598-5918 / (043) 283-5190 | BFP Bongabong: 0917-814-3119 | MDRRMO Bongabong: 0915-288-8880 / (043) 283-5334 | Red Cross: 143.',
    },
  ];

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-500">
      {/* Hero Section (Frosted Glassmorphism UI) */}
      <section className="relative overflow-hidden rounded-3xl glass-shell p-6 sm:p-10 lg:p-14 shadow-2xl border border-white/80">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -z-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -left-20 -z-10 w-72 h-72 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Government / Regional Infrastructure Badge with Official Logo */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-xs">
            <img
              src="/icons/nexus-logo.jpg"
              alt="NEXUS"
              className="w-4 h-4 object-cover rounded-full drop-shadow-xs"
            />
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-slate-700">
              Municipality of Bongabong · Emergency Response & Public Safety Operations
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Unified Multi-Agency <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 bg-clip-text text-transparent">
              Emergency Response & Public Safety Operations
            </span>
          </h1>

          {/* Subtitle / System Purpose */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            {language === 'fil'
              ? 'Ang NEXUS ay ang sentralisadong tulay sa pagitan ng mamamayan ng Bongabong at ng Pambansang Pulisya (PNP), Bumbero (BFP), at Tanggapan ng Sakuna at Medikal (MDRRMO) para sa mabilis at ligtas na pagtugon.'
              : 'NEXUS is the centralized public safety link bridging citizens across the Municipality of Bongabong with the Philippine National Police (PNP), Bureau of Fire Protection (BFP), and Disaster Management (MDRRMO) for synchronized, zero-delay emergency response.'}
          </p>

          {/* Call to Actions (Hero CTAs) - Strictly Gated Behind Genuine Authentication */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {firebaseUser ? (
              <button
                onClick={onEnterResidentPortal}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-blue-500/25 transition hover:scale-[1.02] cursor-pointer"
              >
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <span>
                  {language === 'fil' ? 'Buksan ang Resident Portal' : 'Open Resident Portal'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : agencyUser ? (
              <button
                onClick={() => setPortalMode('agency')}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-blue-500/25 transition hover:scale-[1.02] cursor-pointer"
              >
                <Radio className="w-5 h-5 text-blue-200" />
                <span>
                  {language === 'fil' ? 'Buksan ang Agency Command' : 'Open Agency Command'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-blue-500/25 transition hover:scale-[1.02] cursor-pointer"
                  title="Sign in with verified Google or Email citizen account"
                >
                  <LogIn className="w-5 h-5 text-blue-200" />
                  <span>
                    {language === 'fil' ? 'Mag-sign in para Mag-ulat' : 'Sign In to File Report'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => openAuthModal('register')}
                  className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-2xl font-semibold text-sm sm:text-base flex items-center gap-2 border border-slate-200 shadow-sm transition hover:scale-[1.02] cursor-pointer"
                  title="Register new verified resident account"
                >
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>
                    {language === 'fil' ? 'Magparehistro ng Account' : 'Register Citizen Account'}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Real-Time Live Metrics Ribbon (Modeled after UI Reference Metric Cards) */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-left">
            {/* Metric 1 */}
            <div className="p-4 rounded-2xl glass-card metric-card">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'fil' ? 'Aktibong Pagtugon' : 'Active Cases'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{activeReportsCount}</span>
                <span className="text-[10px] text-amber-700 font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                  live on-scene
                </span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-4 rounded-2xl glass-card metric-card">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-xs">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'fil' ? 'Kabuuang Tala' : 'Total Logs'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{totalReports}</span>
                <span className="text-[10px] text-indigo-700 font-semibold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                  registry
                </span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-4 rounded-2xl glass-card metric-card">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'fil' ? 'Nasolusyunan' : 'Resolved'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{resolvedReportsCount}</span>
                <span className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  closed out
                </span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="p-4 rounded-2xl glass-card metric-card">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'fil' ? 'Sakop na Bayan' : 'LGUs Covered'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">15</span>
                <span className="text-[10px] text-blue-700 font-semibold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                  426 barangays
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 4-Step: How NEXUS 911 Works */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Operational Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {language === 'fil' ? 'Paano Gumagana ang NEXUS' : 'How the NEXUS System Works'}
          </h2>
          <p className="text-sm text-slate-600 font-normal">
            {language === 'fil'
              ? 'Isang tuloy-tuloy na 4-yugtong daloy mula sa pag-uulat ng mamamayan hanggang sa mabilis na pagdating ng pulis, bumbero, o rescue.'
              : 'A seamless 4-stage pipeline from citizen emergency report to multi-agency dispatched resolution.'}
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {workflowSteps.map((stepItem, idx) => {
            const Icon = stepItem.icon;
            const isActive = activeWorkflowStep === idx;
            return (
              <button
                key={stepItem.step}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'glass-card border-blue-500 shadow-lg shadow-blue-500/10'
                    : 'glass-card-subtle border-white/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-400">{stepItem.step}</span>
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stepItem.color} text-white shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {language === 'fil' ? stepItem.titleFil : stepItem.titleEn}
                </h3>
                <span className="text-[11px] text-slate-500 block mt-1 line-clamp-1 font-medium">
                  {stepItem.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Feature Showcase Card */}
        {(() => {
          const activeStep = workflowSteps[activeWorkflowStep];
          const Icon = activeStep.icon;
          return (
            <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/90 relative overflow-hidden shadow-xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-black text-blue-600">{activeStep.step}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border shadow-xs ${activeStep.tagColor}`}>
                      {activeStep.badge}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {language === 'fil' ? activeStep.titleFil : activeStep.titleEn}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {language === 'fil' ? activeStep.descFil : activeStep.descEn}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {activeStep.features.map((feat, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{feat}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2.5 text-xs text-slate-600 bg-white/80 px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
                  <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-medium">
                    {language === 'fil'
                      ? 'Nangangailangan ng verified citizen account o opisyal na agency credentials.'
                      : 'Requires verified citizen account or authorized agency credentials.'}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* The 3 Pillars of Emergency Response in Oriental Mindoro */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            <span>Responding Pillars</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {language === 'fil' ? 'Mga Ahensyang Tagatugon' : 'Unified Responding Agencies'}
          </h2>
          <p className="text-sm text-slate-600 font-normal">
            {language === 'fil'
              ? 'Naka-synchronize ang bawat ahensya sa ilalim ng iisang sentralisadong dispatch command.'
              : 'Every agency operates in synchronization through Centralized Dispatch Command with dedicated hotlines.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* PNP Card */}
          <div className="p-6 rounded-3xl glass-card border border-blue-100 hover:border-blue-300 transition shadow-lg space-y-4 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-white rounded-2xl border border-blue-200/80 flex items-center justify-center shadow-xs p-1.5 shrink-0">
                <AgencyLogo agency="PNP" className="w-9 h-9 object-contain" />
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold shadow-xs">
                HOTLINE: 911 / 117
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Philippine National Police (PNP)</h3>
              <p className="text-xs text-blue-600 font-bold mt-0.5">
                {language === 'fil' ? 'Pambansang Pulisya ng Pilipinas' : 'Law Enforcement & Peace'}
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {language === 'fil'
                ? 'Pangangalaga sa kapayapaan, pag-iwas at pagpigil sa krimen, armed threat response, at vehicular collision investigation.'
                : 'Crime prevention, peace and order, public safety, armed threat suppression, vehicular collision investigation, and community patrol.'}
            </p>
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-800 block">Incident Jurisdiction:</span>
              <span>Armed Assault · Theft & Burglary · Disturbances · Traffic</span>
            </div>
          </div>

          {/* BFP Card */}
          <div className="p-6 rounded-3xl glass-card border border-amber-100 hover:border-amber-300 transition shadow-lg space-y-4 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-white rounded-2xl border border-amber-200/80 flex items-center justify-center shadow-xs p-1.5 shrink-0">
                <AgencyLogo agency="BFP" className="w-9 h-9 object-contain" />
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold shadow-xs">
                HOTLINE: 160
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Bureau of Fire Protection (BFP)</h3>
              <p className="text-xs text-amber-600 font-bold mt-0.5">
                {language === 'fil' ? 'Kawanihan ng Pagtatanggol sa Sunog' : 'Fire & Rescue Operations'}
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {language === 'fil'
                ? 'Pag-apula ng sunog, chemical hazard management, structural search and rescue, at fire safety enforcement sa mga gusali.'
                : 'Fire suppression, chemical & hazmat containment, vehicular extrication, urban structural search & rescue, and fire safety code audits.'}
            </p>
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-800 block">Incident Jurisdiction:</span>
              <span>Structural Fire · Wildfire · Chemical Leak · Trapped Rescue</span>
            </div>
          </div>

          {/* MDRRMO Card */}
          <div className="p-6 rounded-3xl glass-card border border-emerald-100 hover:border-emerald-300 transition shadow-lg space-y-4 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-white rounded-2xl border border-emerald-200/80 flex items-center justify-center shadow-xs p-1.5 shrink-0">
                <AgencyLogo agency="MDRRMO" className="w-9 h-9 object-contain" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shadow-xs">
                HOTLINE: 122
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">MDRRMO Disaster & Medical</h3>
              <p className="text-xs text-emerald-600 font-bold mt-0.5">
                {language === 'fil' ? 'Pagsagip sa Sakuna at Medikal' : 'Disaster & Paramedic Emergency'}
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {language === 'fil'
                ? 'Tugon sa bagyo, pagbaha, landslide, lindol, ambulance evacuation, at agarang paunang lunas sa bawat nasugatan.'
                : 'Severe weather typhoon monitoring, flood & landslide evacuation, paramedic ambulance transport, and medical emergency triage.'}
            </p>
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-800 block">Incident Jurisdiction:</span>
              <span>Medical Trauma · Flash Flood · Landslide · Typhoon Relief</span>
            </div>
          </div>
        </div>

        {/* Central Command Integration Banner */}
        <div className="p-5 rounded-2xl glass-card border border-indigo-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 p-1.5 bg-white rounded-xl shadow-md border border-indigo-200/80 flex items-center justify-center shrink-0">
              <AgencyLogo agency="CENTRAL" className="w-8 h-8 object-contain" animate />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Multi-Agency Command Portals · Central Joint Command, PNP, BFP & MDRRMO
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                Independent department command consoles powered by a unified centralized operations network with zero silos.
              </p>
            </div>
          </div>
          {agencyUser ? (
            <button
              onClick={() => setPortalMode('agency')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Enter Agency Command</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-indigo-700 font-mono flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pre-Provisioned Agency Access</span>
              </span>
              <button
                onClick={() => onOpenAgencyAuth ? onOpenAgencyAuth() : openAuthModal('login')}
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-blue-500/20"
              >
                Sign In (Agency)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Oriental Mindoro Territorial Coverage & Municipality Explorer */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>Provincial Territory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {language === 'fil' ? 'Saklaw sa Oriental Mindoro' : 'Oriental Mindoro Complete Coverage'}
          </h2>
          <p className="text-sm text-slate-600 font-normal">
            {language === 'fil'
              ? 'Konektado ang 1 Component City at 14 Municipalities na may 426 na barangay.'
              : 'Connecting 1 Component City and 14 Municipalities across 426 barangays with high-precision coordinates.'}
          </p>
        </div>

        {/* Municipality Grid Showcase */}
        <div className="p-6 rounded-3xl glass-card border border-white/90 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Pilot Operational Coverage · Municipality of Bongabong:</span>
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              32 Official Barangays
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {ORIENTAL_MINDORO_MUNICIPALITIES.map((muni) => {
              const isSelected = selectedMuni === muni;
              const coords = MUNICIPALITY_COORDINATES[muni];
              return (
                <button
                  key={muni}
                  onClick={() => setSelectedMuni(muni)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm font-bold'
                      : 'bg-white/80 border-slate-200/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <span className="block truncate">{muni}</span>
                  <span className="text-[10px] text-slate-400 block font-mono truncate font-normal">
                    {coords.lat.toFixed(3)}°N, {coords.lng.toFixed(3)}°E
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Municipality Detail Box */}
          {selectedMuni && (
            <div className="mt-4 p-4 rounded-2xl glass-card-subtle border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span className="font-bold text-slate-900 text-sm">{selectedMuni}, Oriental Mindoro</span>
                  {selectedMuni === 'Calapan City' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold shadow-xs">
                      Provincial Capital
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Full multi-agency response readiness for PNP Police Station, BFP Fire Station, and MDRRMO Operations Center.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {firebaseUser ? (
                  <button
                    onClick={onEnterResidentPortal}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Report in {selectedMuni}
                  </button>
                ) : (
                  <button
                    onClick={() => openAuthModal('login')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Report</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Advanced Capabilities Highlights */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Built-in Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {language === 'fil' ? 'Mga Tampok na Kakayahan' : 'Engineered for Real-World Emergency Scenarios'}
          </h2>
          <p className="text-sm text-slate-600 font-normal">
            Resilient, secure, and intuitive for both distressed citizens and high-pressure dispatchers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-card space-y-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-xs">
              <Map className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Authorized GIS Operations</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Official OpenStreetMap GIS layer with street and satellite view toggles, marker clustering, and incident intensity analytics for authorized responders and verified citizens.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card space-y-2">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">True Resident Identity</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Firebase Authentication (Google & Email) with camera/photo upload and Mindoro address selector to prevent prank calls.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card space-y-2">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Multi-Agency Requests</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              1-click inter-agency assistance. When PNP requires BFP water canon or MDRRMO ambulance, assistance requests link immediately.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card space-y-2">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Real-Time Audio Siren</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Synthesized emergency sirens and flashing beacons guarantee dispatchers are alerted even if multitasking across tabs.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {language === 'fil' ? 'Mga Madalas Itanong (FAQ)' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-sm text-slate-600 font-normal">
            Clear guidelines on reporting, data security, and agency procedures.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/80 glass-card overflow-hidden transition shadow-sm"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  <span className="font-bold text-sm text-slate-900">
                    {language === 'fil' ? faq.qFil : faq.qEn}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 font-normal">
                    {language === 'fil' ? faq.aFil : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Emergency Hotlines Directory */}
      <section className="p-6 sm:p-8 rounded-3xl glass-card border border-white/90 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-rose-500" />
              <span>Oriental Mindoro Emergency Hotline Directory</span>
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Immediate voice lines available 24/7 during life-threatening situations.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-700 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 w-fit shadow-xs">
            24/7 Active Dispatch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* PNP Card */}
          <div className="p-5 bg-white/95 rounded-2xl border border-slate-200/90 space-y-3 shadow-xs hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 p-1 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0">
                <AgencyLogo agency="PNP" className="w-8 h-8 object-contain" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-blue-900 text-sm block truncate">
                  {agencyDetails?.PNP?.fullNameEn || 'Philippine National Police'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block truncate">
                  {adminProfiles?.PNP?.title ? `${adminProfiles.PNP.name} · ${adminProfiles.PNP.title}` : 'Bongabong Police Station'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">Official Emergency Hotline:</span>
              <span className="font-mono text-slate-900 text-sm sm:text-base font-black block tracking-tight">
                {agencyDetails?.PNP?.hotline || adminProfiles?.PNP?.hotline || '911 / (043) 283-5192'}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 font-medium pt-1 border-t border-slate-100">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 font-bold shrink-0">HQ:</span>
                <span className="text-slate-700">{adminProfiles?.PNP?.stationAddress || 'Municipal Police Station, Poblacion, Bongabong'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-400 font-bold shrink-0">Email:</span>
                <span className="truncate text-slate-700">{adminProfiles?.PNP?.email || 'pnp.admin@nexus.gov.ph'}</span>
              </div>
            </div>
          </div>

          {/* BFP Card */}
          <div className="p-5 bg-white/95 rounded-2xl border border-slate-200/90 space-y-3 shadow-xs hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 p-1 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0">
                <AgencyLogo agency="BFP" className="w-8 h-8 object-contain" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-orange-900 text-sm block truncate">
                  {agencyDetails?.BFP?.fullNameEn || 'Bureau of Fire Protection'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block truncate">
                  {adminProfiles?.BFP?.title ? `${adminProfiles.BFP.name} · ${adminProfiles.BFP.title}` : 'Bongabong Fire Station'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-orange-50/70 border border-orange-100 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-orange-700 tracking-wider block">Official Emergency Hotline:</span>
              <span className="font-mono text-slate-900 text-sm sm:text-base font-black block tracking-tight">
                {agencyDetails?.BFP?.hotline || adminProfiles?.BFP?.hotline || '160 / (043) 283-5161'}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 font-medium pt-1 border-t border-slate-100">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 font-bold shrink-0">HQ:</span>
                <span className="text-slate-700">{adminProfiles?.BFP?.stationAddress || 'BFP Fire Station, Poblacion, Bongabong'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-400 font-bold shrink-0">Email:</span>
                <span className="truncate text-slate-700">{adminProfiles?.BFP?.email || 'bfp.admin@nexus.gov.ph'}</span>
              </div>
            </div>
          </div>

          {/* MDRRMO Card */}
          <div className="p-5 bg-white/95 rounded-2xl border border-slate-200/90 space-y-3 shadow-xs hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 p-1 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0">
                <AgencyLogo agency="MDRRMO" className="w-8 h-8 object-contain" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-emerald-900 text-sm block truncate">
                  {agencyDetails?.MDRRMO?.fullNameEn || 'MDRRMO Bongabong'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block truncate">
                  {adminProfiles?.MDRRMO?.title ? `${adminProfiles.MDRRMO.name} · ${adminProfiles.MDRRMO.title}` : 'Disaster Risk Reduction & Management'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Official Emergency Hotline:</span>
              <span className="font-mono text-slate-900 text-sm sm:text-base font-black block tracking-tight">
                {agencyDetails?.MDRRMO?.hotline || adminProfiles?.MDRRMO?.hotline || '(043) 283-5353 / 0966-476-8806'}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 font-medium pt-1 border-t border-slate-100">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 font-bold shrink-0">HQ:</span>
                <span className="text-slate-700">{adminProfiles?.MDRRMO?.stationAddress || 'MDRRMO Operations Center, Municipal Hall Compound, Bongabong'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-400 font-bold shrink-0">Email:</span>
                <span className="truncate text-slate-700">{adminProfiles?.MDRRMO?.email || 'mdrrmo.admin@nexus.gov.ph'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Final Call to Action */}
      <section className="p-8 sm:p-12 rounded-3xl glass-shell border border-white/90 text-center space-y-5 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {language === 'fil'
              ? 'Ligtas ang Oriental Mindoro sa Bilis ng Pagtugon'
              : 'Safeguarding Oriental Mindoro Through Connected Response'}
          </h2>
          <p className="text-sm text-slate-600 font-normal">
            {language === 'fil'
              ? 'Mag-sign in upang mairehistro ang inyong profile o magsumite ng agarang ulat ng sakuna.'
              : 'Report incidents, access live safety updates, or enter agency dispatch command.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {firebaseUser ? (
              <button
                onClick={onEnterResidentPortal}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>Go to Resident Portal</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Report</span>
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Register Citizen Account</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
