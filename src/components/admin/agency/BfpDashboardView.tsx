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
      {/* Top Fire Operations KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Fire Incidents */}
        <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Fire Calls
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
              {bfpReports.length}
            </span>
            <span className="text-[10px] text-orange-400 font-medium">
              {activeFires.length} Active Suppression Runs
            </span>
          </div>
          <div className="p-3 bg-orange-600/20 text-orange-400 rounded-xl border border-orange-500/30">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Fire Engines & Tankers Ready */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Apparatus in Station
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
              {inStationCount} <span className="text-xs text-slate-400 font-normal">/ {fireApparatus.length}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {deployedCount} on active fire scene
            </span>
          </div>
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Highest Alarm Level */}
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Highest Active Alarm
            </span>
            <span className="text-lg sm:text-2xl font-black text-red-400 mt-1 block truncate max-w-[150px]">
              {fireAlarmLevel}
            </span>
            <span className="text-[10px] text-red-300 font-medium">
              Calapan & 14 Municipalities
            </span>
          </div>
          <div className="p-3 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Hydrant & Water Grid Readiness */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Hydrant Grid Status
            </span>
            <span className="text-2xl sm:text-3xl font-black text-blue-400 mt-1 block">
              98.4%
            </span>
            <span className="text-[10px] text-blue-300 font-medium">
              Water Pressure Nominal
            </span>
          </div>
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Droplets className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* High-Priority Inter-Agency Mutual Aid Support (At Top for Fast Notice) */}
      <div className="bg-gradient-to-r from-orange-950/70 via-slate-900 to-slate-900 border border-orange-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-orange-400 animate-pulse" />
            <span>Inter-Agency Fire Support</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Require road closures or perimeter isolation? Dispatch immediate mutual aid requests to PNP Police or MDRRMO Trauma Ambulances.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestAssistance}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-950/60 cursor-pointer shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-blue-200" />
          <Activity className="w-3.5 h-3.5 text-emerald-200" />
          <span>Call Police & Paramedic Mutual Aid</span>
        </button>
      </div>

      {/* Interactive Fire Alarm Level Escalator Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Provincial Fire Alarm Escalator Protocol
            </h3>
          </div>
          <span className="text-xs text-orange-300 font-mono font-bold bg-orange-950/60 border border-orange-500/30 px-2 py-0.5 rounded">
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
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-950/50 ring-1 ring-orange-400'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-200 animate-pulse' : 'text-slate-600'}`} />
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Fire & HAZMAT Suppression Queue
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {bfpReports.length} Active Records
              </span>
            </div>

            {bfpReports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No active fire incidents in Oriental Mindoro at this time.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {bfpReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-orange-500/60 transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-orange-400">
                          {report.trackingCode}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 uppercase">
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
                          className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  BFP Engines & Water Tankers
                </h3>
                <span className="text-[10px] text-orange-400 font-bold bg-orange-950 px-2 py-0.5 rounded border border-orange-800/60">
                  {inStationCount} Ready
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedApparatusForEdit(null);
                  setIsResourceModalOpen(true);
                }}
                className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            <div className="space-y-3">
              {fireApparatus.map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col gap-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white block">
                          {app.callSign}
                        </span>
                        {app.vehiclePlate && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-900 text-slate-400 rounded border border-slate-800">
                            {app.vehiclePlate}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {app.station} · {app.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          app.status === 'In Station'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : app.status === 'On Scene'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : app.status === 'En Route'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-slate-800 text-slate-400'
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
                      <span className="text-slate-400">Officer / Driver:</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                        {app.officerInCharge || 'Shift Commander'} {app.driverName ? `· ${app.driverName}` : ''}
                      </span>
                    </div>
                    {app.contactNumber && (
                      <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-orange-400" />
                          <span>Contact / Radio:</span>
                        </span>
                        <a
                          href={`tel:${app.contactNumber.split('/')[0].trim()}`}
                          className="font-mono font-bold text-orange-400 hover:text-orange-300 transition"
                        >
                          {app.contactNumber}
                        </a>
                      </div>
                    )}
                    {app.shift && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Shift:</span>
                        </span>
                        <span className="text-amber-300 font-medium">{app.shift}</span>
                      </div>
                    )}
                    {app.scheduledDispatch && (
                      <div className="text-[10px] text-orange-300/90 italic pt-0.5">
                        {app.scheduledDispatch}
                      </div>
                    )}
                  </div>

                  {/* Water Tank Bar */}
                  {app.type !== 'Ladder Truck' && (
                    <div className="space-y-1 bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-400" /> Water Tank
                        </span>
                        <span className="font-mono font-bold text-blue-300">
                          {app.waterLevelPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
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
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        app.status === 'In Station'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Station
                    </button>
                    <button
                      type="button"
                      onClick={() => updateApparatusStatus(app.id, 'En Route')}
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        app.status === 'En Route'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      En Route
                    </button>
                    <button
                      type="button"
                      onClick={() => updateApparatusStatus(app.id, 'On Scene', 60)}
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        app.status === 'On Scene'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
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

