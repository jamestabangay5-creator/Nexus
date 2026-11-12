import React, { useState } from 'react';
import { useNexus } from '../../../context/NexusContext';
import { IncidentReport, MedicalUnit } from '../../../types';
import { AGENCY_DETAILS } from '../../../constants/incidentData';
import { TRANSLATIONS } from '../../../constants/translations';
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
      {/* Top MDRRMO Disaster & Medical KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Rescue Calls */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Disaster & Medical Calls
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
              {mdrrmoReports.length}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              {activeRescues.length} Active Field Rescues
            </span>
          </div>
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Ambulances & SAR Fleet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ambulances Available
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
              {availableMedics} <span className="text-xs text-slate-400 font-normal">/ {medicalUnits.length}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {inTransitMedics} units on patient transit
            </span>
          </div>
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Ambulance className="w-6 h-6" />
          </div>
        </div>

        {/* Resolved Rescues */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Resolved Operations
            </span>
            <span className="text-2xl sm:text-3xl font-black text-purple-400 mt-1 block">
              {resolvedRescues}
            </span>
            <span className="text-[10px] text-purple-300 font-medium">
              Completed Medical & Rescue Calls
            </span>
          </div>
          <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* River & Flood Sensor Level */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Calapan River Sensor
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-400 mt-1 block">
              Alert (Stage 2)
            </span>
            <span className="text-[10px] text-blue-300 font-medium">
              3.4m / 4.8m Critical Crest
            </span>
          </div>
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Waves className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* High-Priority Inter-Agency Mutual Aid Support (At Top for Fast Notice) */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Inter-Agency Disaster & Rescue Support</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Encountering hazardous flooding or need crowd enforcement at evacuation centers? Coordinate immediately with PNP Police and BFP Fire.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestAssistance}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-blue-200" />
          <Flame className="w-3.5 h-3.5 text-orange-200" />
          <span>Call Police & Fire Mutual Aid</span>
        </button>
      </div>

      {/* Early Flood & Weather Advisory Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-emerald-950/60 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PAGASA & Provincial Hydrology Link
              </span>
              <span className="text-xs text-slate-400">Monitoring Calapan, Baco, & Naujan Basins</span>
            </div>
            <p className="text-xs text-slate-200 font-medium mt-1">
              Water levels are currently monitored with automated telemetry sensors. Flood extraction teams remain on standby.
            </p>
          </div>
        </div>
      </div>

      {/* Main MDRRMO Columns: Rescue Feed & Paramedics / Shelters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Rescue & Medical Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Disaster Triage & Medical Dispatch Feed
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {mdrrmoReports.length} Active Records
              </span>
            </div>

            {mdrrmoReports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No active disaster or medical incidents in Oriental Mindoro at this time.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {mdrrmoReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-400">
                          {report.trackingCode}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                          {report.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            report.status === 'Ongoing'
                              ? 'bg-orange-500/20 text-orange-300'
                              : report.status === 'Accepted'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {report.dateTime?.slice(11, 16) || 'Just now'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium line-clamp-2 mb-2.5">
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                      <span className="flex items-center gap-1 text-slate-300 truncate max-w-[220px]">
                        <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                        {report.barangay}, {report.municipality || 'Calapan City'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReport(report.id);
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ambulance className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  MDRRMO Ambulance Fleet
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                  {availableMedics} Ready
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMedicalUnitForEdit(null);
                  setIsResourceModalOpen(true);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            <div className="space-y-3">
              {medicalUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col gap-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white block">
                          {unit.callSign}
                        </span>
                        {unit.vehiclePlate && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-900 text-slate-400 rounded border border-slate-800">
                            {unit.vehiclePlate}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Base: {unit.base} · {unit.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          unit.status === 'Available'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : unit.status === 'Patient Transit'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : unit.status === 'Dispatched'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
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
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Crew & Dispatch Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Personnel Crew & Contact Details */}
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Paramedic / Driver:</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                        {unit.paramedicLead || 'EMT Lead'} {unit.driverName ? `· ${unit.driverName}` : ''}
                      </span>
                    </div>
                    {unit.crewMembers && (
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>Crew:</span>
                        <span className="text-slate-300 truncate max-w-[170px]">{unit.crewMembers}</span>
                      </div>
                    )}
                    {unit.contactNumber && (
                      <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>Contact / Radio:</span>
                        </span>
                        <a
                          href={`tel:${unit.contactNumber.split('/')[0].trim()}`}
                          className="font-mono font-bold text-emerald-400 hover:text-emerald-300 transition"
                        >
                          {unit.contactNumber}
                        </a>
                      </div>
                    )}
                    {unit.shift && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Shift:</span>
                        </span>
                        <span className="text-amber-300 font-medium">{unit.shift}</span>
                      </div>
                    )}
                    {unit.scheduledDispatch && (
                      <div className="text-[10px] text-emerald-300/90 italic pt-0.5">
                        {unit.scheduledDispatch}
                      </div>
                    )}
                  </div>

                  {/* Quick Dispatch Toggles */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => updateMedicalStatus(unit.id, 'Available')}
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Available'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMedicalStatus(unit.id, 'Dispatched')}
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Dispatched'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Dispatch
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMedicalStatus(unit.id, 'Patient Transit')}
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Patient Transit'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
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

