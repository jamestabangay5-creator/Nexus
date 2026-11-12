import React, { useState } from 'react';
import { useNexus } from '../../../context/NexusContext';
import { IncidentReport, PatrolUnit } from '../../../types';
import { AGENCY_DETAILS } from '../../../constants/incidentData';
import { TRANSLATIONS } from '../../../constants/translations';
import {
  ShieldAlert,
  Shield,
  Car,
  Radio,
  Users,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Flame,
  Activity,
  ArrowRight,
  Eye,
  Search,
  Filter,
  Phone,
  FileText,
  Edit2,
  Plus,
  User
} from 'lucide-react';
import { ResourceEditModal } from './ResourceEditModal';

interface Props {
  onSelectReport: (reportId: string) => void;
  onRequestAssistance: () => void;
}

export const PnpDashboardView: React.FC<Props> = ({ onSelectReport, onRequestAssistance }) => {
  const {
    reports,
    patrolUnits,
    updatePatrolStatus,
    adminProfiles,
    agencyUser,
    language,
    updateIncidentStatus,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const pnpProfile = adminProfiles.PNP;

  // Resource Customization State
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<PatrolUnit | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Filter police incidents (primary PNP or assigned to PNP) - sorted descending (newest on top)
  const pnpReports = reports
    .filter(
      (r) => (r.selectedAgency === 'PNP' || r.category === 'RED' || r.category === 'YELLOW') && r.status !== 'Rejected'
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingVerification = pnpReports.filter((r) => r.status === 'Pending Verification');
  const activeDispatches = pnpReports.filter((r) => r.status === 'Accepted' || r.status === 'Ongoing');
  const criticalThreats = pnpReports.filter((r) => r.category === 'RED');

  const onPatrolCount = patrolUnits.filter((u) => u.status === 'On Patrol').length;
  const dispatchedUnitsCount = patrolUnits.filter((u) => u.status === 'Dispatched').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Police KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Police Cases */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Police Cases
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
              {pnpReports.length}
            </span>
            <span className="text-[10px] text-blue-400 font-medium">
              {activeDispatches.length} Units in Field
            </span>
          </div>
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Patrol Units on Duty */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Patrol Fleet Ready
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
              {onPatrolCount} <span className="text-xs text-slate-400 font-normal">/ {patrolUnits.length}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {dispatchedUnitsCount} units on active run
            </span>
          </div>
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Critical Armed / Red Threats */}
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Critical Threats
            </span>
            <span className="text-2xl sm:text-3xl font-black text-red-400 mt-1 block">
              {criticalThreats.length}
            </span>
            <span className="text-[10px] text-red-300 font-medium">
              Armed Threat / Assault
            </span>
          </div>
          <div className="p-3 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Police Review
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 block">
              {pendingVerification.length}
            </span>
            <span className="text-[10px] text-amber-300 font-medium">
              Requires 911 dispatch
            </span>
          </div>
          <div className="p-3 bg-amber-600/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* High-Priority Inter-Agency Mutual Aid Support (At Top for Fast Notice) */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Inter-Agency Police Support</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Require structural fire suppression, chemical hazard mitigation, or paramedic trauma transport? Dispatch immediate mutual aid requests to BFP or MDRRMO.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestAssistance}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-950/60 cursor-pointer shrink-0"
        >
          <Flame className="w-3.5 h-3.5 text-orange-200" />
          <Activity className="w-3.5 h-3.5 text-emerald-200" />
          <span>Call Fire & Paramedic Mutual Aid</span>
        </button>
      </div>

      {/* Main PNP Operational Columns: Patrol Management & Live Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Police Incident Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Police Dispatch Queue & Field Reports
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {pnpReports.length} Active Records
              </span>
            </div>

            {pnpReports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No active police incidents in Oriental Mindoro at this time.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {pnpReports.map((report) => {
                  const isCritical = report.category === 'RED';
                  return (
                    <div
                      key={report.id}
                      onClick={() => onSelectReport(report.id)}
                      className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/60 transition cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-400">
                            {report.trackingCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isCritical
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
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
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition"
                          >
                            <span>Inspect Case</span>
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Mobile Patrols & Inter-Agency Coordination */}
        <div className="space-y-4">
          {/* Mobile Patrol Units Panel (Customizable & Editable) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  PNP Patrol Cars & Sectors
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                  {onPatrolCount} Active
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUnitForEdit(null);
                  setIsResourceModalOpen(true);
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            <div className="space-y-3">
              {patrolUnits.map((unit) => (
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
                        {unit.division}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          unit.status === 'On Patrol'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : unit.status === 'Dispatched'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {unit.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUnitForEdit(unit);
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
                      <span className="text-slate-400">Sector:</span>
                      <span className="font-semibold text-white truncate max-w-[170px]">{unit.sector}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Officer / Driver:</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                        {unit.officerInCharge} {unit.driverName ? `· ${unit.driverName}` : ''}
                      </span>
                    </div>
                    {unit.contactNumber && (
                      <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-red-400" />
                          <span>Contact:</span>
                        </span>
                        <a
                          href={`tel:${unit.contactNumber.split('/')[0].trim()}`}
                          className="font-mono font-bold text-red-400 hover:text-red-300 transition"
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
                      <div className="text-[10px] text-blue-300/90 italic pt-0.5">
                        {unit.scheduledDispatch}
                      </div>
                    )}
                  </div>

                  {/* Quick Status Dispatch Toggle */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => updatePatrolStatus(unit.id, 'On Patrol')}
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'On Patrol'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Patrol
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePatrolStatus(unit.id, 'Dispatched')}
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Dispatched'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Dispatch
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePatrolStatus(unit.id, 'Standby')}
                      className={`py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Standby'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Standby
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
          setSelectedUnitForEdit(null);
        }}
        agencyType="PNP"
        unitToEdit={selectedUnitForEdit}
      />
    </div>
  );
};

