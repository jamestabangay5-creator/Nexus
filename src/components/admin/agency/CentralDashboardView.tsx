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
      {/* Top 911 Master KPI Cards - Frosted Glass matching Reference Design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Active Incidents */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total 911 Incidents
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
              {activeReports.length}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Live Synced
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Unified Registry</span>
            </div>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              911 Triage Queue
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 block">
              {pendingReports.length}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Action Required
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Needs Verification</span>
            </div>
          </div>
        </div>

        {/* Critical Red Alerts */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Critical Red Threats
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-rose-600 block">
              {criticalReports.length}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                High Priority
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Immediate Response</span>
            </div>
          </div>
        </div>

        {/* Response Teams Deployed */}
        <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Ongoing Deployments
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">
              {ongoingReports.length}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active En-route
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Units on Scene</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Priority Inter-Agency Mutual Aid Command (At Top for Fast Notice) */}
      <div className="glass-card bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-blue-50/90 border border-indigo-200/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>Unified 911 Inter-Agency Mutual Aid Command</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-medium">
            Coordinate synchronized multi-agency deployments across PNP Police, BFP Fire Protection, and MDRRMO Emergency Rescue.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestAssistance}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Launch Inter-Agency Mutual Aid</span>
        </button>
      </div>

      {/* Tri-Agency Synchronized Readiness Cards */}
      <div>
        <div className="flex items-center justify-between pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Synchronized Multi-Agency Department Matrix
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Live Central Operations Link
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PNP Police Card */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-blue-200/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">PNP Police Command</h4>
                  <span className="text-[10px] text-blue-700 font-semibold">{adminProfiles.PNP.name}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {pnpReports.length} Cases
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-blue-600" /> Patrol Fleet Ready:
                </span>
                <span className="font-bold text-slate-900">{onPatrolCount} Units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Emergency Hotline:</span>
                <span className="font-mono text-blue-700 font-bold">911 / (02) 8722-0650</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchAgencyView('PNP')}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2 shadow-2xs"
            >
              <span>Inspect Police Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* BFP Fire Card */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-orange-200/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">BFP Fire Protection</h4>
                  <span className="text-[10px] text-orange-700 font-semibold">{adminProfiles.BFP.name}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                {bfpReports.length} Cases
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-orange-600" /> In Station Ready:
                </span>
                <span className="font-bold text-slate-900">{inStationCount} Apparatus</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Alarm Escalation:</span>
                <span className="font-mono text-orange-700 font-bold">{fireAlarmLevel}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchAgencyView('BFP')}
              className="w-full py-2.5 bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2 shadow-2xs"
            >
              <span>Inspect Fire Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MDRRMO Rescue Card */}
          <div className="glass-card bg-white/90 backdrop-blur-xl border border-emerald-200/80 rounded-3xl p-5 shadow-xl shadow-slate-200/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">MDRRMO Rescue</h4>
                  <span className="text-[10px] text-emerald-700 font-semibold">{adminProfiles.MDRRMO.name}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {mdrrmoReports.length} Cases
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Ambulance className="w-3.5 h-3.5 text-emerald-600" /> Ambulances Ready:
                </span>
                <span className="font-bold text-slate-900">{availableMedics} / {medicalUnits.length} Medics</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchAgencyView('MDRRMO')}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2 shadow-2xs"
            >
              <span>Inspect Rescue Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Master 911 Live Triage & Intake Queue */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Central 911 Unified Triage & Incoming Dispatch Stream
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRequestAssistance}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mutual Aid Hub</span>
            </button>
          </div>
        </div>

        {activeReports.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-medium">
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
                  className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">
                        {report.trackingCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          agency === 'PNP'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : agency === 'BFP'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {agency}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          report.category === 'RED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
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

                  <p className="text-xs text-slate-700 font-medium line-clamp-2 mb-2">
                    {report.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-slate-600 truncate max-w-[260px]">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      {report.barangay}, {report.municipality || 'Calapan City'} (Citizen: {report.residentName})
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectReport(report.id);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition"
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

