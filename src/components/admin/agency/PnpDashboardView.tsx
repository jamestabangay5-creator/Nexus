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
      {/* Top Police KPI Grid - Frosted Neo-Aero Glass matching Reference Image */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Active Police Cases */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Active Police Cases
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
              {pnpReports.length}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {activeDispatches.length} In Field
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Active Investigation</span>
            </div>
          </div>
        </div>

        {/* Patrol Units on Duty */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Patrol Fleet Ready
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">
              {onPatrolCount} <span className="text-xs text-slate-400 font-normal">/ {patrolUnits.length}</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {dispatchedUnitsCount} Dispatched
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Patrol Fleet Online</span>
            </div>
          </div>
        </div>

        {/* Critical Armed / Red Threats */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Critical Threats
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-rose-600 block">
              {criticalThreats.length}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Code Red
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Armed / High Risk</span>
            </div>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Pending Police Review
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 block">
              {pendingVerification.length}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Triage Queue
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Requires Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Priority Inter-Agency Mutual Aid Support (At Top for Fast Notice) */}
      <div className="glass-card bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 border border-blue-200/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-700 font-black text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>Inter-Agency Police Support</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-medium">
            Require structural fire suppression, chemical hazard mitigation, or paramedic trauma transport? Dispatch immediate mutual aid requests to BFP or MDRRMO.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestAssistance}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
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
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Police Dispatch Queue & Field Reports
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {pnpReports.length} Active Records
              </span>
            </div>

            {pnpReports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
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
                      className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-blue-300 transition cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-700">
                            {report.trackingCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                              isCritical
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
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
                            className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition"
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
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  PNP Patrol Cars & Sectors
                </h3>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {onPatrolCount} Active
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUnitForEdit(null);
                  setIsResourceModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            <div className="space-y-3">
              {patrolUnits.map((unit) => (
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
                        {unit.division}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          unit.status === 'On Patrol'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : unit.status === 'Dispatched'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
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
                      <span className="text-slate-400 font-medium">Sector:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[170px]">{unit.sector}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Officer / Driver:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                        {unit.officerInCharge} {unit.driverName ? `· ${unit.driverName}` : ''}
                      </span>
                    </div>
                    {unit.contactNumber && (
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                        <span className="text-slate-400 flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-red-500" />
                          <span>Contact:</span>
                        </span>
                        <a
                          href={`tel:${unit.contactNumber.split('/')[0].trim()}`}
                          className="font-mono font-bold text-red-600 hover:text-red-700 transition"
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
                      <div className="text-[10px] text-indigo-700 italic pt-0.5 font-medium">
                        {unit.scheduledDispatch}
                      </div>
                    )}
                  </div>

                  {/* Quick Status Dispatch Toggle */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => updatePatrolStatus(unit.id, 'On Patrol')}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'On Patrol'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Patrol
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePatrolStatus(unit.id, 'Dispatched')}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Dispatched'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dispatch
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePatrolStatus(unit.id, 'Standby')}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        unit.status === 'Standby'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
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

