import React, { useState } from 'react';
import { useNexus } from '../../../context/NexusContext';
import { IncidentReport, FireApparatus, FireAlarmLevel } from '../../../types';
import { AGENCY_DETAILS } from '../../../constants/incidentData';
import { TRANSLATIONS } from '../../../constants/translations';
import {
  Flame,
  Truck,
  Droplets,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  Shield,
  Activity,
  ArrowRight,
  Eye,
  Radio,
  Building2,
  Wrench,
  Edit2,
  Plus,
  Phone,
  User
} from 'lucide-react';
import { ResourceEditModal } from './ResourceEditModal';

interface Props {
  onSelectReport: (reportId: string) => void;
  onRequestAssistance: () => void;
}

const ALARM_LEVELS: FireAlarmLevel[] = [
  '1st Alarm',
  '2nd Alarm',
  '3rd Alarm',
  '4th Alarm',
  '5th Alarm',
  'Task Force Alpha',
  'General Alarm',
];

export const BfpDashboardView: React.FC<Props> = ({ onSelectReport, onRequestAssistance }) => {
  const {
    reports,
    fireApparatus,
    updateApparatusStatus,
    fireAlarmLevel,
    setFireAlarmLevel,
    adminProfiles,
    agencyUser,
    language,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const bfpProfile = adminProfiles.BFP;

  // Resource Customization State
  const [selectedApparatusForEdit, setSelectedApparatusForEdit] = useState<FireApparatus | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Filter fire & hazmat incidents - sorted descending (newest on top)
  const bfpReports = reports
    .filter(
      (r) =>
        (r.selectedAgency === 'BFP' ||
          r.initialTypeId === 'fire_incident' ||
          r.verifiedTypeId === 'fire_incident') &&
        r.status !== 'Rejected'
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeFires = bfpReports.filter((r) => r.status === 'Ongoing' || r.status === 'Accepted');
  const inStationCount = fireApparatus.filter((a) => a.status === 'In Station').length;
  const deployedCount = fireApparatus.filter((a) => a.status === 'En Route' || a.status === 'On Scene').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Fire Operations KPI Grid - Frosted Neo-Aero Glass */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Active Fire Incidents */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Active Fire Calls
            </span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
              {bfpReports.length}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                {activeFires.length} In Action
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Active Suppression</span>
            </div>
          </div>
        </div>

        {/* Fire Engines & Tankers Ready */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Apparatus in Station
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">
              {inStationCount} <span className="text-xs text-slate-400 font-normal">/ {fireApparatus.length}</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {deployedCount} On Scene
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Fleet Ready</span>
            </div>
          </div>
        </div>

        {/* Highest Alarm Level */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Highest Active Alarm
            </span>
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-2xl font-black text-red-600 block truncate max-w-[150px]">
              {fireAlarmLevel}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Alert Escalated
              </span>
              <span className="text-[10px] text-slate-500 font-medium truncate">15 Municipalities</span>
            </div>
          </div>
        </div>

        {/* Hydrant & Water Grid Readiness */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Hydrant Grid Status
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-blue-600 block">
              98.4%
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Nominal
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Water Pressure Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Priority Inter-Agency Mutual Aid Support (At Top for Fast Notice) */}
      <div className="glass-card bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-red-50/90 border border-orange-200/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-700 font-black text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-orange-600 animate-pulse" />
            <span>Inter-Agency Fire Support</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-medium">
            Require road closures or perimeter isolation? Dispatch immediate mutual aid requests to PNP Police or MDRRMO Trauma Ambulances.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestAssistance}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-blue-200" />
          <Activity className="w-3.5 h-3.5 text-emerald-200" />
          <span>Call Police & Paramedic Mutual Aid</span>
        </button>
      </div>

      {/* Interactive Fire Alarm Level Escalator Bar */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Provincial Fire Alarm Escalator Protocol
            </h3>
          </div>
          <span className="text-xs text-orange-700 font-mono font-bold bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
            Current: {fireAlarmLevel}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {ALARM_LEVELS.map((level) => {
            const isSelected = fireAlarmLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setFireAlarmLevel(level)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-400'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-200 animate-pulse' : 'text-slate-400'}`} />
                <span>{level}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main BFP Operational Columns: Incidents & Apparatus Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Fire Incident Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Fire & HAZMAT Suppression Queue
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                {bfpReports.length} Active Records
              </span>
            </div>

            {bfpReports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
                No active fire incidents in Oriental Mindoro at this time.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {bfpReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-orange-300 transition cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-orange-700">
                          {report.trackingCode}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 uppercase">
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
                          className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition"
                        >
                          <span>Manage Response</span>
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

        {/* Right Column (1 Col): Apparatus Fleet & Inter-Agency Coordination */}
        <div className="space-y-4">
          {/* Fire Apparatus Fleet Status */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  BFP Engines & Water Tankers
                </h3>
                <span className="text-[10px] text-orange-700 font-bold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  {inStationCount} Ready
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedApparatusForEdit(null);
                  setIsResourceModalOpen(true);
                }}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            <div className="space-y-3">
              {fireApparatus.map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-2.5 hover:border-slate-300 hover:bg-white transition shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 block">
                          {app.callSign}
                        </span>
                        {app.vehiclePlate && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white text-slate-600 rounded border border-slate-200 font-bold">
                            {app.vehiclePlate}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {app.station} · {app.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          app.status === 'In Station'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : app.status === 'On Scene'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : app.status === 'En Route'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {app.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApparatusForEdit(app);
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
                      <span className="text-slate-400 font-medium">Officer / Driver:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                        {app.officerInCharge || 'Shift Commander'} {app.driverName ? `· ${app.driverName}` : ''}
                      </span>
                    </div>
                    {app.contactNumber && (
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                        <span className="text-slate-400 flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-orange-500" />
                          <span>Contact / Radio:</span>
                        </span>
                        <a
                          href={`tel:${app.contactNumber.split('/')[0].trim()}`}
                          className="font-mono font-bold text-orange-600 hover:text-orange-700 transition"
                        >
                          {app.contactNumber}
                        </a>
                      </div>
                    )}
                    {app.shift && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Shift:</span>
                        </span>
                        <span className="text-amber-700 font-bold">{app.shift}</span>
                      </div>
                    )}
                    {app.scheduledDispatch && (
                      <div className="text-[10px] text-orange-700 italic pt-0.5 font-medium">
                        {app.scheduledDispatch}
                      </div>
                    )}
                  </div>

                  {/* Water Tank Bar */}
                  {app.type !== 'Ladder Truck' && (
                    <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Droplets className="w-3 h-3 text-blue-500" /> Water Tank
                        </span>
                        <span className="font-mono font-bold text-blue-700">
                          {app.waterLevelPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${app.waterLevelPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Dispatch Toggles */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => updateApparatusStatus(app.id, 'In Station', 100)}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        app.status === 'In Station'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Station
                    </button>
                    <button
                      type="button"
                      onClick={() => updateApparatusStatus(app.id, 'En Route')}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        app.status === 'En Route'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      En Route
                    </button>
                    <button
                      type="button"
                      onClick={() => updateApparatusStatus(app.id, 'On Scene', 60)}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        app.status === 'On Scene'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      On Scene
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
          setSelectedApparatusForEdit(null);
        }}
        agencyType="BFP"
        unitToEdit={selectedApparatusForEdit}
      />
    </div>
  );
};

