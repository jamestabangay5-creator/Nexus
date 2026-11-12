import React, { useState } from 'react';
import { useNexus } from '../../../context/NexusContext';
import { IncidentReport, MedicalUnit } from '../../../types';
import { AGENCY_DETAILS } from '../../../constants/incidentData';
import { TRANSLATIONS } from '../../../constants/translations';
import { AgencyLogo } from '../../common/AgencyLogo';
import {
  Activity,
  Ambulance,
  Waves,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  Shield,
  Flame,
  ArrowRight,
  Eye,
  Radio,
  Plus,
  Minus,
  HeartPulse,
  Edit2,
  Phone,
  User,
  CheckCircle
} from 'lucide-react';
import { ResourceEditModal } from './ResourceEditModal';

interface Props {
  onSelectReport: (reportId: string) => void;
  onRequestAssistance: () => void;
}

export const MdrrmoDashboardView: React.FC<Props> = ({ onSelectReport, onRequestAssistance }) => {
  const {
    reports,
    medicalUnits,
    updateMedicalStatus,
    adminProfiles,
    agencyUser,
    language,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const mdrrmoProfile = adminProfiles.MDRRMO;

  // Resource Customization State
  const [selectedMedicalUnitForEdit, setSelectedMedicalUnitForEdit] = useState<MedicalUnit | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Filter disaster and medical emergencies - sorted descending (newest on top)
  const mdrrmoReports = reports
    .filter(
      (r) =>
        (r.selectedAgency === 'MDRRMO' ||
          r.initialTypeId === 'medical_emergency' ||
          r.initialTypeId === 'flooding_landslide' ||
          r.initialTypeId === 'person_unresponsive' ||
          r.verifiedTypeId === 'medical_emergency' ||
          r.verifiedTypeId === 'flooding_landslide') &&
        r.status !== 'Rejected'
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeRescues = mdrrmoReports.filter((r) => r.status === 'Ongoing' || r.status === 'Accepted');
  const resolvedRescues = mdrrmoReports.filter((r) => r.status === 'Resolved').length;
  const availableMedics = medicalUnits.filter((m) => m.status === 'Available').length;
  const inTransitMedics = medicalUnits.filter((m) => m.status === 'Dispatched' || m.status === 'Patient Transit').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top MDRRMO Disaster & Medical KPI Grid - Frosted Neo-Aero Glass */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Active Rescue Calls */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Disaster & Medical Calls
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs p-1">
              <AgencyLogo agency="MDRRMO" className="w-7 h-7 object-contain" animate />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
              {mdrrmoReports.length}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {activeRescues.length} Active
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Field Rescues</span>
            </div>
          </div>
        </div>

        {/* Ambulances & SAR Fleet */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Ambulances Available
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Ambulance className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">
              {availableMedics} <span className="text-xs text-slate-400 font-normal">/ {medicalUnits.length}</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {inTransitMedics} In Transit
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Paramedics Ready</span>
            </div>
          </div>
        </div>

        {/* Resolved Rescues */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Resolved Operations
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-purple-600 block">
              {resolvedRescues}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Completed
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Safe Extractions</span>
            </div>
          </div>
        </div>

        {/* River & Flood Sensor Level */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Calapan River Sensor
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-blue-600 block">
              Alert (Stage 2)
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                3.4m / 4.8m
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Critical Crest</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Priority Inter-Agency Mutual Aid Support (At Top for Fast Notice) */}
      <div className="glass-card bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-blue-50/90 border border-emerald-200/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Inter-Agency Disaster & Rescue Support</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-medium">
            Encountering hazardous flooding or need crowd enforcement at evacuation centers? Coordinate immediately with PNP Police and BFP Fire.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestAssistance}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-blue-200" />
          <Flame className="w-3.5 h-3.5 text-orange-200" />
          <span>Call Police & Fire Mutual Aid</span>
        </button>
      </div>

      {/* Early Flood & Weather Advisory Banner */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-emerald-200/80 rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                PAGASA & Provincial Hydrology Link
              </span>
              <span className="text-xs text-slate-500 font-medium">Monitoring Calapan, Baco, & Naujan Basins</span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Water levels are currently monitored with automated telemetry sensors. Flood extraction teams remain on standby.
            </p>
          </div>
        </div>
      </div>

      {/* Main MDRRMO Columns: Rescue Feed & Paramedics / Shelters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Rescue & Medical Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Disaster Triage & Medical Dispatch Feed
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {mdrrmoReports.length} Active Records
              </span>
            </div>

            {mdrrmoReports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
                No active disaster or medical incidents in Oriental Mindoro at this time.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {mdrrmoReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-emerald-300 transition cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-700">
                          {report.trackingCode}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {report.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            report.status === 'Ongoing'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : report.status === 'Accepted'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {report.dateTime?.slice(11, 16) || 'Just now'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium line-clamp-2 mb-2.5">
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-slate-600 truncate max-w-[220px]">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        {report.barangay}, {report.municipality || 'Calapan City'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReport(report.id);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition"
                        >
                          <span>Manage Rescue</span>
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Ambulances Fleet & Inter-Agency Coordination */}
        <div className="space-y-4">
          {/* Medical Units Panel */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ambulance className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  MDRRMO Ambulance Fleet
                </h3>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {availableMedics} Ready
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMedicalUnitForEdit(null);
                  setIsResourceModalOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            <div className="space-y-3">
              {medicalUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-2.5 hover:border-slate-300 hover:bg-white transition shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 block">
                          {unit.callSign}
                        </span>
                        {unit.vehiclePlate && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white text-slate-600 rounded border border-slate-200 font-bold">
                            {unit.vehiclePlate}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        Base: {unit.base} · {unit.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          unit.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : unit.status === 'Patient Transit'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : unit.status === 'Dispatched'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {unit.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMedicalUnitForEdit(unit);
                          setIsResourceModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Edit Crew & Dispatch Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Personnel Crew & Contact Details */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-1.5 text-[11px] shadow-2xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Paramedic / Driver:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                        {unit.paramedicLead || 'EMT Lead'} {unit.driverName ? `· ${unit.driverName}` : ''}
                      </span>
                    </div>
                    {unit.crewMembers && (
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>Crew:</span>
                        <span className="text-slate-700 truncate max-w-[170px] font-medium">{unit.crewMembers}</span>
                      </div>
                    )}
                    {unit.contactNumber && (
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                        <span className="text-slate-400 flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>Contact / Radio:</span>
                        </span>
                        <a
                          href={`tel:${unit.contactNumber.split('/')[0].trim()}`}
                          className="font-mono font-bold text-emerald-600 hover:text-emerald-700 transition"
                        >
                          {unit.contactNumber}
                        </a>
                      </div>
                    )}
                    {unit.shift && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Shift:</span>
                        </span>
                        <span className="text-amber-700 font-bold">{unit.shift}</span>
                      </div>
                    )}
                    {unit.scheduledDispatch && (
                      <div className="text-[10px] text-emerald-700 italic pt-0.5 font-medium">
                        {unit.scheduledDispatch}
                      </div>
                    )}
                  </div>

                  {/* Quick Dispatch Toggles */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => updateMedicalStatus(unit.id, 'Available')}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Available'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMedicalStatus(unit.id, 'Dispatched')}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Dispatched'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dispatch
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMedicalStatus(unit.id, 'Patient Transit')}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Patient Transit'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Transit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resource Customization Modal */}
      <ResourceEditModal
        isOpen={isResourceModalOpen}
        onClose={() => {
          setIsResourceModalOpen(false);
          setSelectedMedicalUnitForEdit(null);
        }}
        agencyType="MDRRMO"
        unitToEdit={selectedMedicalUnitForEdit}
      />
    </div>
  );
};

