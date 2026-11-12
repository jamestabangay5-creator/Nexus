import React, { useState } from 'react';
import { useNexus } from '../../../context/NexusContext';
import { IncidentReport, Agency } from '../../../types';
import { AGENCY_DETAILS } from '../../../constants/incidentData';
import { TRANSLATIONS } from '../../../constants/translations';
import {
  Radio,
  ShieldAlert,
  Flame,
  Activity,
  Car,
  Truck,
  Ambulance,
  Users,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Eye,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  ShieldCheck,
  Send
} from 'lucide-react';

interface Props {
  onSelectReport: (reportId: string) => void;
  onRequestAssistance: () => void;
  onSwitchAgencyView: (agency: Agency) => void;
}

export const CentralDashboardView: React.FC<Props> = ({
  onSelectReport,
  onRequestAssistance,
  onSwitchAgencyView,
}) => {
  const {
    reports,
    patrolUnits,
    fireApparatus,
    medicalUnits,
    fireAlarmLevel,
    simulateIncomingIncident,
    language,
    adminProfiles,
  } = useNexus();

  const t = TRANSLATIONS[language];

  // Active reports - sorted descending (newest on top)
  const activeReports = reports
    .filter((r) => r.status !== 'Rejected')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pendingReports = activeReports.filter((r) => r.status === 'Pending Verification');
  const ongoingReports = activeReports.filter((r) => r.status === 'Ongoing');
  const criticalReports = activeReports.filter((r) => r.category === 'RED');

  // Breakdown per agency
  const pnpReports = activeReports.filter((r) => r.selectedAgency === 'PNP');
  const bfpReports = activeReports.filter((r) => r.selectedAgency === 'BFP');
  const mdrrmoReports = activeReports.filter((r) => r.selectedAgency === 'MDRRMO');

  const onPatrolCount = patrolUnits.filter((u) => u.status === 'On Patrol').length;
  const inStationCount = fireApparatus.filter((a) => a.status === 'In Station').length;
  const availableMedics = medicalUnits.filter((m) => m.status === 'Available').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top 911 Master KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Active Incidents */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total 911 Incidents
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
              {activeReports.length}
            </span>
            <span className="text-[10px] text-purple-400 font-medium">
              Unified Provincial Registry
            </span>
          </div>
          <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              911 Triage Queue
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 block">
              {pendingReports.length}
            </span>
            <span className="text-[10px] text-amber-300 font-medium">
              Requires Initial Verification
            </span>
          </div>
          <div className="p-3 bg-amber-600/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Critical Red Alerts */}
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Critical Red Threats
            </span>
            <span className="text-2xl sm:text-3xl font-black text-red-400 mt-1 block">
              {criticalReports.length}
            </span>
            <span className="text-[10px] text-red-300 font-medium">
              High-Risk Immediate Response
            </span>
          </div>
          <div className="p-3 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Response Teams Deployed */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ongoing Deployments
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
              {ongoingReports.length}
            </span>
            <span className="text-[10px] text-emerald-300 font-medium">
              Active Units on Scene
            </span>
          </div>
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* High-Priority Inter-Agency Mutual Aid Command (At Top for Fast Notice) */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Unified 911 Inter-Agency Mutual Aid Command</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Coordinate synchronized multi-agency deployments across PNP Police, BFP Fire Protection, and MDRRMO Emergency Rescue.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestAssistance}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 cursor-pointer shrink-0"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Launch Inter-Agency Mutual Aid</span>
        </button>
      </div>

      {/* Tri-Agency Synchronized Readiness Cards */}
      <div>
        <div className="flex items-center justify-between pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Synchronized Multi-Agency Department Matrix
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Live Central Operations Link
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PNP Police Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">PNP Police Command</h4>
                  <span className="text-[10px] text-blue-300">{adminProfiles.PNP.name}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                {pnpReports.length} Cases
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-blue-400" /> Patrol Fleet Ready:
                </span>
                <span className="font-bold text-white">{onPatrolCount} Units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Emergency Hotline:</span>
                <span className="font-mono text-blue-300 font-bold">911 / (02) 8722-0650</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchAgencyView('PNP')}
              className="w-full py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span>Inspect Police Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* BFP Fire Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-950/60 to-slate-900 border border-orange-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">BFP Fire Protection</h4>
                  <span className="text-[10px] text-orange-300">{adminProfiles.BFP.name}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950 px-2 py-0.5 rounded border border-orange-800">
                {bfpReports.length} Cases
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-orange-400" /> In Station Ready:
                </span>
                <span className="font-bold text-white">{inStationCount} Apparatus</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Alarm Escalation:</span>
                <span className="font-mono text-orange-300 font-bold">{fireAlarmLevel}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchAgencyView('BFP')}
              className="w-full py-2 bg-orange-600/30 hover:bg-orange-600/50 text-orange-200 border border-orange-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span>Inspect Fire Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MDRRMO Rescue Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">MDRRMO Rescue</h4>
                  <span className="text-[10px] text-emerald-300">{adminProfiles.MDRRMO.name}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {mdrrmoReports.length} Cases
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Ambulance className="w-3.5 h-3.5 text-emerald-400" /> Ambulances Ready:
                </span>
                <span className="font-bold text-white">{availableMedics} / {medicalUnits.length} Medics</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchAgencyView('MDRRMO')}
              className="w-full py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span>Inspect Rescue Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Master 911 Live Triage & Intake Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Central 911 Unified Triage & Incoming Dispatch Stream
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRequestAssistance}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mutual Aid Hub</span>
            </button>
          </div>
        </div>

        {activeReports.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No active emergency incidents across any department in Oriental Mindoro.
          </div>
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {activeReports.slice(0, 10).map((report) => {
              const agency = report.selectedAgency;
              return (
                <div
                  key={report.id}
                  onClick={() => onSelectReport(report.id)}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/60 transition cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-white">
                        {report.trackingCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          agency === 'PNP'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : agency === 'BFP'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {agency}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          report.category === 'RED'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-slate-800 text-slate-300'
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

                  <p className="text-xs text-slate-200 font-medium line-clamp-2 mb-2">
                    {report.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                    <span className="flex items-center gap-1 text-slate-300 truncate max-w-[260px]">
                      <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                      {report.barangay}, {report.municipality || 'Calapan City'} (Citizen: {report.residentName})
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectReport(report.id);
                      }}
                      className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition"
                    >
                      <span>Command Triage</span>
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

