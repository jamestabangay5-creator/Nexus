import React, { useState, useMemo } from 'react';
import { useNexus } from '../../context/NexusContext';
import { Agency, IncidentReport, AssistanceRequest, PatrolUnit, FireApparatus, MedicalUnit } from '../../types';
import { AGENCY_DETAILS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
import { AgencyLogo } from '../common/AgencyLogo';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Shield,
  Flame,
  Activity,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Car,
  Truck,
  Ambulance,
  Radio,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  onSelectReport?: (reportId: string) => void;
}

type FleetAgencyFilter = 'ALL' | 'PNP' | 'BFP' | 'MDRRMO';
type FleetStatusFilter = 'ALL' | 'Standby' | 'On Patrol' | 'Dispatched' | 'Maintenance';

interface UnifiedVehicle {
  id: string;
  agency: 'PNP' | 'BFP' | 'MDRRMO';
  agencyName: string;
  callSign: string;
  vehiclePlate?: string;
  type: string;
  sectorOrStation: string;
  status: string;
  normalizedStatus: 'Standby' | 'On Patrol' | 'Dispatched' | 'Maintenance';
  officerInCharge?: string;
  driverName?: string;
  crewMembers?: string;
  contactNumber?: string;
  shift?: string;
  scheduledDispatch?: string;
  waterLevelPercent?: number;
}

export const InterAgencyCoordination: React.FC<Props> = ({ onSelectReport }) => {
  const {
    reports,
    activeRole,
    acknowledgeAssistanceRequest,
    adminProfiles,
    language,
    patrolUnits,
    updatePatrolStatus,
    fireApparatus,
    updateApparatusStatus,
    medicalUnits,
    updateMedicalStatus,
    triggerSuccessModal,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const isCentralAdmin = activeRole === 'CENTRAL';
  const currentAgency: Agency = activeRole === 'resident' || isCentralAdmin ? 'PNP' : (activeRole as Agency);
  const currentAdmin = adminProfiles[currentAgency];

  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [ackNote, setAckNote] = useState('');

  // Fleet Monitoring Filters & Search State
  const [fleetAgencyFilter, setFleetAgencyFilter] = useState<FleetAgencyFilter>('ALL');
  const [fleetStatusFilter, setFleetStatusFilter] = useState<FleetStatusFilter>('ALL');
  const [fleetSearch, setFleetSearch] = useState('');

  // Normalize all vehicles across PNP, BFP, and MDRRMO into a unified monitoring registry
  const allVehicles: UnifiedVehicle[] = useMemo(() => {
    const list: UnifiedVehicle[] = [];

    // 1. PNP Police Patrol Units
    patrolUnits.forEach((u) => {
      list.push({
        id: u.id,
        agency: 'PNP',
        agencyName: 'PNP Police Command',
        callSign: u.callSign,
        vehiclePlate: u.vehiclePlate,
        type: u.division,
        sectorOrStation: u.sector,
        status: u.status,
        normalizedStatus:
          u.status === 'On Patrol'
            ? 'On Patrol'
            : u.status === 'Dispatched'
            ? 'Dispatched'
            : u.status === 'Standby'
            ? 'Standby'
            : 'Maintenance',
        officerInCharge: u.officerInCharge,
        driverName: u.driverName,
        crewMembers: u.crewMembers,
        contactNumber: u.contactNumber,
        shift: u.shift,
        scheduledDispatch: u.scheduledDispatch,
      });
    });

    // 2. BFP Fire Apparatus
    fireApparatus.forEach((a) => {
      const isStandby = a.status === 'In Station' || a.status === 'Standby';
      const isDispatched = a.status === 'En Route' || a.status === 'On Scene';
      list.push({
        id: a.id,
        agency: 'BFP',
        agencyName: 'BFP Fire Protection',
        callSign: a.callSign,
        vehiclePlate: a.vehiclePlate,
        type: a.type,
        sectorOrStation: a.station,
        status: a.status,
        normalizedStatus: isStandby ? 'Standby' : isDispatched ? 'Dispatched' : 'Maintenance',
        officerInCharge: a.officerInCharge,
        driverName: a.driverName,
        crewMembers: a.crewMembers,
        contactNumber: a.contactNumber,
        shift: a.shift,
        scheduledDispatch: a.scheduledDispatch,
        waterLevelPercent: a.waterLevelPercent,
      });
    });

    // 3. MDRRMO Medical & Rescue Units
    medicalUnits.forEach((m) => {
      const isStandby = m.status === 'Available';
      const isDispatched =
        m.status === 'Dispatched' || m.status === 'Patient Transit' || m.status === 'Hospital Turnover';
      list.push({
        id: m.id,
        agency: 'MDRRMO',
        agencyName: 'MDRRMO Rescue',
        callSign: m.callSign,
        vehiclePlate: m.vehiclePlate,
        type: m.type,
        sectorOrStation: m.base,
        status: m.status,
        normalizedStatus: isStandby ? 'Standby' : isDispatched ? 'Dispatched' : 'Maintenance',
        officerInCharge: m.paramedicLead,
        driverName: m.driverName,
        crewMembers: m.crewMembers,
        contactNumber: m.contactNumber,
        shift: m.shift,
        scheduledDispatch: m.scheduledDispatch,
      });
    });

    return list;
  }, [patrolUnits, fireApparatus, medicalUnits]);

  // Filtered vehicles based on selected Agency, Status, and Search Query
  const filteredVehicles = useMemo(() => {
    return allVehicles.filter((v) => {
      if (fleetAgencyFilter !== 'ALL' && v.agency !== fleetAgencyFilter) return false;
      if (fleetStatusFilter !== 'ALL' && v.normalizedStatus !== fleetStatusFilter) return false;
      if (fleetSearch.trim()) {
        const query = fleetSearch.toLowerCase();
        const matchCall = v.callSign.toLowerCase().includes(query);
        const matchPlate = (v.vehiclePlate || '').toLowerCase().includes(query);
        const matchOfficer = (v.officerInCharge || '').toLowerCase().includes(query);
        const matchDriver = (v.driverName || '').toLowerCase().includes(query);
        const matchSector = v.sectorOrStation.toLowerCase().includes(query);
        const matchType = v.type.toLowerCase().includes(query);
        if (!matchCall && !matchPlate && !matchOfficer && !matchDriver && !matchSector && !matchType) {
          return false;
        }
      }
      return true;
    });
  }, [allVehicles, fleetAgencyFilter, fleetStatusFilter, fleetSearch]);

  // Summary KPI Counters
  const standbyCount = allVehicles.filter((v) => v.normalizedStatus === 'Standby').length;
  const patrolCount = allVehicles.filter((v) => v.normalizedStatus === 'On Patrol').length;
  const dispatchedCount = allVehicles.filter((v) => v.normalizedStatus === 'Dispatched').length;
  const maintenanceCount = allVehicles.filter((v) => v.normalizedStatus === 'Maintenance').length;

  const handleUpdateVehicleStatus = (vehicle: UnifiedVehicle, newStatus: string) => {
    if (vehicle.agency === 'PNP') {
      updatePatrolStatus(vehicle.id, newStatus as PatrolUnit['status']);
    } else if (vehicle.agency === 'BFP') {
      updateApparatusStatus(vehicle.id, newStatus as FireApparatus['status']);
    } else if (vehicle.agency === 'MDRRMO') {
      updateMedicalStatus(vehicle.id, newStatus as MedicalUnit['status']);
    }

    triggerSuccessModal({
      title: 'Fleet Status Updated',
      message: `${vehicle.callSign} (${vehicle.agency}) status is now "${newStatus}".`,
    });
  };

  // Collect all assistance requests across all reports in centralized database
  const allRequests: { report: IncidentReport; request: AssistanceRequest }[] = [];
  reports.forEach((report) => {
    report.assistanceRequests.forEach((request) => {
      allRequests.push({ report, request });
    });
  });

  // For Agency Admins (PNP, BFP, MDRRMO): incoming requests targeting their agency
  const incomingRequests = allRequests.filter(({ request }) =>
    request.targetAgencies.includes(currentAgency)
  );

  // For Agency Admins: outgoing requests originated by their agency
  const outgoingRequests = allRequests.filter(({ request }) =>
    request.fromAgency === currentAgency
  );

  // For System Admin (CENTRAL Operations Monitoring):
  // 1. All active requests awaiting response between agencies
  const centralActiveRequests = allRequests.filter(({ request }) =>
    request.status !== 'Acknowledged'
  );
  // 2. All acknowledged / deployed mutual aid records
  const centralAcknowledgedRequests = allRequests.filter(({ request }) =>
    request.status === 'Acknowledged'
  );

  const handleAcknowledge = (reportId: string, requestId: string) => {
    acknowledgeAssistanceRequest(
      reportId,
      requestId,
      currentAgency,
      currentAdmin?.name || `${currentAgency} Admin`,
      ackNote || `${currentAgency} responder unit dispatched to scene.`
    );
    setAcknowledgingId(null);
    setAckNote('');
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Header Banner */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-2xl shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isCentralAdmin
                  ? 'Centralized Multi-Agency Fleet & Mutual Aid Monitor'
                  : t.coordinationTitle}
              </h2>
              {isCentralAdmin ? (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                  Central Operations Monitoring
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
                  Agency Coordination Hub
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCentralAdmin
                ? 'Central operational oversight of emergency vehicles and inter-agency mutual aid dispatches exchanged between PNP, BFP, and MDRRMO.'
                : 'Unified emergency fleet deployment & synchronized multi-agency mutual aid command across PNP, BFP, and MDRRMO.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-slate-500 font-medium">
            {isCentralAdmin ? 'Monitoring Authority:' : 'Operating As:'}
          </span>
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
            <AgencyLogo agency={isCentralAdmin ? 'CENTRAL' : currentAgency} className="w-4 h-4 object-contain" />
            {isCentralAdmin ? 'CENTRAL COMMAND (SYSTEM ADMIN)' : `${currentAgency} Command`}
          </span>
        </div>
      </div>

      {/* SYNCHRONIZED MULTI-AGENCY VEHICLE & EMERGENCY FLEET STATUS MONITOR */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Multi-Agency Emergency Vehicle & Fleet Status Monitor
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Live monitoring of standby, dispatched, and patrol vehicles across all responding municipal departments.
              </p>
            </div>
          </div>

          {/* Quick KPI Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Standby: {standbyCount}</span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>On Patrol: {patrolCount}</span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>Dispatched: {dispatchedCount}</span>
            </span>
            {maintenanceCount > 0 && (
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Maintenance: {maintenanceCount}</span>
              </span>
            )}
          </div>
        </div>

        {/* System Admin Operational Monitoring Notice */}
        {isCentralAdmin && (
          <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold text-blue-950 block">Central Operations Monitoring Protocol</strong>
              <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                Emergency vehicle statuses (Standby, On Patrol, Dispatched, Maintenance) are exclusively maintained and updated by responding agencies (Bongabong PNP, BFP, and MDRRMO). System Admin maintains centralized read-only operational oversight of fleet readiness.
              </p>
            </div>
          </div>
        )}

        {/* Filter Bar: Agency Tabs, Status Pills, and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          {/* Agency Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFleetAgencyFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                fleetAgencyFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Agencies ({allVehicles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFleetAgencyFilter('PNP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                fleetAgencyFilter === 'PNP'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>PNP Police ({patrolUnits.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFleetAgencyFilter('BFP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                fleetAgencyFilter === 'BFP'
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/25'
                  : 'bg-white text-orange-700 hover:bg-orange-50 border border-orange-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>BFP Fire ({fireApparatus.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFleetAgencyFilter('MDRRMO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                fleetAgencyFilter === 'MDRRMO'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <Ambulance className="w-3.5 h-3.5" />
              <span>MDRRMO Rescue ({medicalUnits.length})</span>
            </button>
          </div>

          {/* Status Filter Pills & Search */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFleetStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  fleetStatusFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Statuses
              </button>
              <button
                type="button"
                onClick={() => setFleetStatusFilter('Standby')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  fleetStatusFilter === 'Standby'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Standby ({standbyCount})
              </button>
              <button
                type="button"
                onClick={() => setFleetStatusFilter('On Patrol')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  fleetStatusFilter === 'On Patrol'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                Patrol ({patrolCount})
              </button>
              <button
                type="button"
                onClick={() => setFleetStatusFilter('Dispatched')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  fleetStatusFilter === 'Dispatched'
                    ? 'bg-orange-600 text-white'
                    : 'text-orange-700 hover:bg-orange-50'
                }`}
              >
                Dispatched ({dispatchedCount})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search unit / officer / plate..."
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-none w-44 sm:w-56 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Fleet Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              No emergency vehicles match the selected agency or status filter.
            </div>
          ) : (
            filteredVehicles.map((unit) => {
              const isPnp = unit.agency === 'PNP';
              const isBfp = unit.agency === 'BFP';
              const isMdrrmo = unit.agency === 'MDRRMO';

              const cardBorder =
                isPnp ? 'border-blue-200/90 hover:border-blue-400' :
                isBfp ? 'border-orange-200/90 hover:border-orange-400' :
                'border-emerald-200/90 hover:border-emerald-400';

              const agencyColor = isPnp ? '#2563eb' : isBfp ? '#ea580c' : '#059669';
              const canEditUnitStatus = !isCentralAdmin && activeRole === unit.agency;

              return (
                <div
                  key={`${unit.agency}-${unit.id}`}
                  className={`bg-white rounded-2xl border p-4.5 shadow-sm hover:shadow-md transition-all space-y-3 relative group ${cardBorder}`}
                >
                  {/* Top Bar: Agency Logo & Identity Badge + Live Status Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl bg-white p-1 border flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ borderColor: `${agencyColor}50` }}
                      >
                        <AgencyLogo agency={unit.agency} className="w-7 h-7 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded text-white"
                            style={{ backgroundColor: agencyColor }}
                          >
                            {unit.agency}
                          </span>
                          {unit.vehiclePlate && (
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {unit.vehiclePlate}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 truncate mt-0.5" title={unit.callSign}>
                          {unit.callSign}
                        </h4>
                      </div>
                    </div>

                    {/* Status Pill with Visual Animation */}
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 border ${
                        unit.normalizedStatus === 'Standby'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : unit.normalizedStatus === 'On Patrol'
                          ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-xs'
                          : unit.normalizedStatus === 'Dispatched'
                          ? 'bg-orange-50 text-orange-800 border-orange-200 animate-pulse'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          unit.normalizedStatus === 'Standby'
                            ? 'bg-emerald-500'
                            : unit.normalizedStatus === 'On Patrol'
                            ? 'bg-blue-600 animate-ping'
                            : unit.normalizedStatus === 'Dispatched'
                            ? 'bg-orange-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span>{unit.status}</span>
                    </span>
                  </div>

                  {/* Core Vehicle Information Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-semibold line-clamp-1" title={unit.sectorOrStation}>
                        {unit.sectorOrStation}
                      </span>
                    </div>

                    {unit.officerInCharge && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 font-medium">Lead / Officer:</span>
                        <strong className="text-slate-900 font-bold">{unit.officerInCharge}</strong>
                      </div>
                    )}

                    {unit.driverName && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Driver / Pilot:</span>
                        <span className="text-slate-700 font-medium">{unit.driverName}</span>
                      </div>
                    )}

                    {unit.waterLevelPercent !== undefined && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 font-medium">Water Tank Level:</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${unit.waterLevelPercent}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-blue-700 text-[10px]">
                            {unit.waterLevelPercent}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scheduled Mission / Dispatch Mission Note */}
                  {unit.scheduledDispatch && (
                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/70 line-clamp-2 italic">
                      "{unit.scheduledDispatch}"
                    </div>
                  )}

                  {/* Interactive Status Switcher (Respective Agency Only) OR Read-Only Monitoring Status (System Admin / Partner Agency) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Radio className="w-3 h-3 text-slate-400" />
                      {canEditUnitStatus ? 'Set Status:' : 'Live Status:'}
                    </span>

                    {canEditUnitStatus ? (
                      <select
                        value={unit.status}
                        onChange={(e) => handleUpdateVehicleStatus(unit, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        {isPnp && (
                          <>
                            <option value="On Patrol">🔵 On Patrol</option>
                            <option value="Dispatched">🟠 Dispatched</option>
                            <option value="Standby">🟢 Standby</option>
                            <option value="Maintenance">⚪ Maintenance</option>
                          </>
                        )}
                        {isBfp && (
                          <>
                            <option value="In Station">🟢 In Station (Standby)</option>
                            <option value="Standby">🟢 Standby</option>
                            <option value="En Route">🟠 En Route (Dispatched)</option>
                            <option value="On Scene">🚨 On Scene</option>
                            <option value="Maintenance">⚪ Maintenance</option>
                          </>
                        )}
                        {isMdrrmo && (
                          <>
                            <option value="Available">🟢 Available (Standby)</option>
                            <option value="Dispatched">🟠 Dispatched</option>
                            <option value="Patient Transit">🟣 Patient Transit</option>
                            <option value="Hospital Turnover">🏥 Hospital Turnover</option>
                            <option value="Maintenance">⚪ Maintenance</option>
                          </>
                        )}
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-lg border ${
                            unit.normalizedStatus === 'Standby'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : unit.normalizedStatus === 'On Patrol'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : unit.normalizedStatus === 'Dispatched'
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              unit.normalizedStatus === 'Standby'
                                ? 'bg-emerald-500'
                                : unit.normalizedStatus === 'On Patrol'
                                ? 'bg-blue-600 animate-pulse'
                                : unit.normalizedStatus === 'Dispatched'
                                ? 'bg-orange-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {unit.status}
                        </span>
                        {isCentralAdmin ? (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-tight">
                            Agency Managed
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-tight">
                            {unit.agency} Controlled
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Grid: Mutual Aid Coordination Section (System Admin Central Oversight VS Agency Admin Dispatches) */}
      {isCentralAdmin ? (
        /* CENTRAL COMMAND / SYSTEM ADMIN OVERSIGHT VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Active Inter-Agency Mutual Aid Dispatches (All Agencies) */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-900">
                    Active Inter-Agency Mutual Aid Dispatches
                  </h3>
                </div>
                <span className="text-xs font-mono bg-amber-50 px-2.5 py-0.5 rounded-lg text-amber-700 font-bold border border-amber-200">
                  {centralActiveRequests.length} Active
                </span>
              </div>

              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {centralActiveRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No active inter-agency mutual aid requests in progress across Bongabong PNP, BFP, or MDRRMO.
                  </div>
                ) : (
                  centralActiveRequests.map(({ report, request }) => (
                    <div
                      key={request.id}
                      className="p-4 rounded-2xl border bg-amber-50/70 border-amber-300 shadow-md shadow-amber-500/10 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                            {report.trackingCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              request.urgency === 'Critical'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : request.urgency === 'Urgent'
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {request.urgency}
                          </span>
                        </div>

                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Awaiting Agency Response
                        </span>
                      </div>

                      <div className="text-xs space-y-2 text-slate-700">
                        <div className="flex items-center justify-between text-slate-600 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <span className="flex items-center gap-1">
                            <strong className="text-slate-900 font-bold">Requesting:</strong> {request.fromAgency} ({request.requestedBy})
                          </span>
                          <span className="flex items-center gap-1">
                            <strong className="text-slate-900 font-bold">Summoned:</strong> {request.targetAgencies.join(', ')}
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-slate-800">
                          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">
                            Field Assistance Note:
                          </span>
                          <p className="text-xs italic font-medium">"{request.note}"</p>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
                          <span>Location: {report.barangay}</span>
                          <span>{new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {onSelectReport && (
                        <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                          <button
                            onClick={() => onSelectReport(report.id)}
                            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect Incident Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              ℹ️ Mutual aid requests are directly initiated and responded to between operational agencies.
            </div>
          </div>

          {/* Column 2: Acknowledged & Deployed Mutual Aid Records */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Acknowledged & Deployed Mutual Aid Records
                  </h3>
                </div>
                <span className="text-xs font-mono bg-emerald-50 px-2.5 py-0.5 rounded-lg text-emerald-700 font-bold border border-emerald-200">
                  {centralAcknowledgedRequests.length} Deployed
                </span>
              </div>

              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {centralAcknowledgedRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No acknowledged mutual aid deployments recorded in the current session.
                  </div>
                ) : (
                  centralAcknowledgedRequests.map(({ report, request }) => (
                    <div
                      key={request.id}
                      className="p-4 rounded-2xl border bg-slate-50/80 border-slate-200/80 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                            {report.trackingCode}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            {request.fromAgency} → <strong className="text-slate-900">{request.targetAgencies.join(' & ')}</strong>
                          </span>
                        </div>

                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Deployed & Confirmed
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 italic font-medium">
                        "{request.note}"
                      </p>

                      <div className="text-[11px] space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Responding Agency Deployment Log:
                        </span>
                        {request.targetAgencies.map((agency) => {
                          const ack = request.acknowledgments.find((a) => a.agency === agency);
                          return (
                            <div
                              key={agency}
                              className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/60"
                            >
                              <span className="font-bold text-slate-800">{agency}:</span>
                              {ack ? (
                                <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {ack.acknowledgedBy} ({new Date(ack.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              ) : (
                                <span className="text-amber-600 italic text-[11px] font-medium">
                                  Awaiting response...
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {onSelectReport && (
                        <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                          <button
                            onClick={() => onSelectReport(report.id)}
                            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect Incident Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Live Central Command audit feed of all multi-agency field collaborations.
            </div>
          </div>
        </div>
      ) : (
        /* AGENCY ADMIN VIEW (PNP / BFP / MDRRMO) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incoming Requests to Current Agency */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-900">
                    Incoming Assistance Dispatches for {currentAgency}
                  </h3>
                </div>
                <span className="text-xs font-mono bg-amber-50 px-2.5 py-0.5 rounded-lg text-amber-700 font-bold border border-amber-200">
                  {incomingRequests.length} Active
                </span>
              </div>

              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {incomingRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No incoming assistance requests directed to {currentAgency} at this time.
                  </div>
                ) : (
                  incomingRequests.map(({ report, request }) => {
                    const isAcknowledgedByMe = request.acknowledgments.some(
                      (a) => a.agency === currentAgency
                    );

                    return (
                      <div
                        key={request.id}
                        className={`p-4 rounded-2xl border transition ${
                          isAcknowledgedByMe
                            ? 'bg-slate-50/80 border-slate-200/80'
                            : 'bg-amber-50/90 border-amber-300 shadow-md shadow-amber-500/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                              {report.trackingCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                request.urgency === 'Critical'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : request.urgency === 'Urgent'
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {request.urgency}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              isAcknowledgedByMe
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            }`}
                          >
                            {isAcknowledgedByMe ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {t.acknowledged}
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                {t.pendingAck}
                              </>
                            )}
                          </span>
                        </div>

                        <div className="text-xs space-y-2 text-slate-700 mb-3">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              From: <strong className="text-slate-900">{request.fromAgency}</strong> ({request.requestedBy})
                            </span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-slate-800">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">
                              Mutual Aid Note:
                            </span>
                            <p className="text-xs italic font-medium">"{request.note}"</p>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
                            <span>Location: {report.barangay}</span>
                            <span>{new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                          {onSelectReport && (
                            <button
                              onClick={() => onSelectReport(report.id)}
                              className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Inspect Full Report Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          {!isAcknowledgedByMe ? (
                            acknowledgingId === request.id ? (
                              <div className="flex flex-col gap-2 w-full mt-2">
                                <input
                                  type="text"
                                  placeholder="Response note (e.g. Unit 3 en route)..."
                                  value={ackNote}
                                  onChange={(e) => setAckNote(e.target.value)}
                                  className="bg-white border border-slate-300 text-slate-900 rounded-xl p-2 text-xs focus:ring-2 focus:ring-blue-500/20"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setAcknowledgingId(null)}
                                    className="px-3 py-1.5 text-slate-500 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleAcknowledge(report.id, request.id)}
                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                                  >
                                    Confirm & Acknowledge
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAcknowledgingId(request.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{t.acknowledge}</span>
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-bold">
                              ✓ Confirmed by {currentAdmin?.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Outgoing Requests Sent by Current Agency */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Outgoing Requests Dispatched by {currentAgency}
                  </h3>
                </div>
                <span className="text-xs font-mono bg-blue-50 px-2.5 py-0.5 rounded-lg text-blue-700 font-bold border border-blue-200">
                  {outgoingRequests.length} Dispatched
                </span>
              </div>

              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {outgoingRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    {currentAgency} has not dispatched any assistance requests yet. You can request assistance from any incident report card or table row.
                  </div>
                ) : (
                  outgoingRequests.map(({ report, request }) => (
                    <div
                      key={request.id}
                      className="p-4 rounded-2xl border bg-slate-50/80 border-slate-200/80 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                              {report.trackingCode}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              → Requested: <strong className="text-slate-900">{request.targetAgencies.join(' & ')}</strong>
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            request.status === 'Acknowledged'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {request.status === 'Acknowledged' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Acknowledged
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Response
                            </>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 italic font-medium">
                        "{request.note}"
                      </p>

                      {/* Acknowledgment history */}
                      <div className="text-[11px] space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Agency Acknowledgment Status:
                        </span>
                        {request.targetAgencies.map((agency) => {
                          const ack = request.acknowledgments.find((a) => a.agency === agency);
                          return (
                            <div
                              key={agency}
                              className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/60"
                            >
                              <span className="font-bold text-slate-800">{agency}:</span>
                              {ack ? (
                                <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {ack.acknowledgedBy} ({new Date(ack.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              ) : (
                                <span className="text-amber-600 italic text-[11px] font-medium">
                                  Awaiting response...
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
