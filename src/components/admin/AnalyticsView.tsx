import React, { useState, useMemo } from 'react';
import { useNexus } from '../../context/NexusContext';
import { INCIDENT_TYPES, CATEGORY_INFO, BARANGAYS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
import { TimeFilterPeriod } from '../../types';
import {
  BarChart3,
  PieChart as PieIcon,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
  Archive,
  Award,
  Layers
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { reports, language } = useNexus();
  const t = TRANSLATIONS[language];

  // Filters
  const [selectedBarangay, setSelectedBarangay] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [period, setPeriod] = useState<TimeFilterPeriod>('all');
  
  // Requirement 3: "Use verified reports as the default basis for incident percentages, excluding rejected and pending reports."
  const [verifiedOnlyBasis, setVerifiedOnlyBasis] = useState<boolean>(true);

  // Filter reports by period, barangay, and category
  const filteredReports = useMemo(() => {
    const now = new Date().getTime();

    return reports.filter((rep) => {
      // Period filter
      if (period !== 'all') {
        const repTime = new Date(rep.createdAt).getTime();
        const diffMs = now - repTime;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (period === 'daily' && diffDays > 1) return false;
        if (period === 'weekly' && diffDays > 7) return false;
        if (period === 'monthly' && diffDays > 30) return false;
        if (period === 'yearly' && diffDays > 365) return false;
      }

      // Barangay filter
      if (selectedBarangay !== 'ALL' && rep.barangay !== selectedBarangay) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && rep.category !== selectedCategory) return false;

      return true;
    });
  }, [reports, period, selectedBarangay, selectedCategory]);

  // Baseline reports for percentages: verified reports (Accepted, Ongoing, Resolved) by default!
  const baselineReports = useMemo(() => {
    if (verifiedOnlyBasis) {
      return filteredReports.filter(
        (r) => r.status === 'Accepted' || r.status === 'Ongoing' || r.status === 'Resolved'
      );
    }
    return filteredReports;
  }, [filteredReports, verifiedOnlyBasis]);

  // Overall KPI counts
  const totalSubmitted = filteredReports.length;
  const verifiedCount = filteredReports.filter(
    (r) => r.status === 'Accepted' || r.status === 'Ongoing' || r.status === 'Resolved'
  ).length;
  const pendingCount = filteredReports.filter((r) => r.status === 'Pending Verification').length;
  const ongoingCount = filteredReports.filter((r) => r.status === 'Ongoing' || r.status === 'Accepted').length;
  const resolvedCount = filteredReports.filter((r) => r.status === 'Resolved').length;
  const rejectedCount = filteredReports.filter((r) => r.status === 'Rejected').length;

  // Percentage breakdown per incident type
  const typeStatistics = useMemo(() => {
    const baseTotal = baselineReports.length || 1;

    return INCIDENT_TYPES.map((typeDef) => {
      const count = baselineReports.filter(
        (r) => (r.verifiedTypeId || r.initialTypeId) === typeDef.id
      ).length;

      const percentage = (count / baseTotal) * 100;

      return {
        ...typeDef,
        count,
        percentage: Number(percentage.toFixed(1)),
      };
    });
  }, [baselineReports]);

  // Identify most frequently reported incident types
  const topReportedTypes = useMemo(() => {
    return [...typeStatistics]
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [typeStatistics]);

  // Category percentage breakdown for Donut / Pie Chart
  const categoryStats = useMemo(() => {
    const baseTotal = baselineReports.length || 1;
    const catKeys = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE', 'WHITE'] as const;

    let cumulativeAngle = 0;

    return catKeys.map((cat) => {
      const catCount = baselineReports.filter((r) => r.category === cat).length;
      const pct = (catCount / baseTotal) * 100;
      const angle = (catCount / baseTotal) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;

      return {
        category: cat,
        info: CATEGORY_INFO[cat],
        count: catCount,
        percentage: Number(pct.toFixed(1)),
        startAngle,
        angle,
      };
    });
  }, [baselineReports]);

  return (
    <div className="space-y-6">
      {/* Filters & Baseline Toggle Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Filter Analytics:</span>
          </div>

          {/* Time Period Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as TimeFilterPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition cursor-pointer ${
                  period === p
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>

          {/* Barangay Filter */}
          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Barangays</option>
            {BARANGAYS.map((brgy) => (
              <option key={brgy} value={brgy}>
                {brgy}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="RED">RED — Critical Safety</option>
            <option value="ORANGE">ORANGE — Accidents & Emergencies</option>
            <option value="YELLOW">YELLOW — Suspected Criminal</option>
            <option value="GREEN">GREEN — Community Concerns</option>
            <option value="BLUE">BLUE — Online & Complaints</option>
            <option value="WHITE">WHITE — Other</option>
          </select>
        </div>

        {/* Verified Reports as Default Basis Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVerifiedOnlyBasis(!verifiedOnlyBasis)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
              verifiedOnlyBasis
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-950 border-slate-700 text-slate-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {verifiedOnlyBasis ? t.verifiedBaselineToggle : t.allReportsBaselineToggle}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            {t.totalReports}
          </span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {totalSubmitted}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Central Database</span>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-3 shadow-md">
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Verified Basis
          </span>
          <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">
            {verifiedCount}
          </span>
          <span className="text-[10px] text-emerald-500/80 block mt-0.5">Accepted/Active/Done</span>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-3 shadow-md">
          <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {t.pendingVerification}
          </span>
          <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[10px] text-amber-500/80 block mt-0.5">Awaiting Triage</span>
        </div>

        <div className="bg-slate-900 border border-orange-900/40 rounded-xl p-3 shadow-md">
          <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider block flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {t.activeIncidents}
          </span>
          <span className="text-2xl font-black text-orange-300 font-mono mt-1 block">
            {ongoingCount}
          </span>
          <span className="text-[10px] text-orange-500/80 block mt-0.5">Dispatched / Field</span>
        </div>

        <div className="bg-slate-900 border border-blue-900/40 rounded-xl p-3 shadow-md">
          <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">
            {t.resolvedIncidents}
          </span>
          <span className="text-2xl font-black text-blue-300 font-mono mt-1 block">
            {resolvedCount}
          </span>
          <span className="text-[10px] text-blue-500/80 block mt-0.5">Successfully Closed</span>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-3 shadow-md">
          <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider block flex items-center gap-1">
            <Archive className="w-3 h-3" />
            {t.rejectedArchived}
          </span>
          <span className="text-2xl font-black text-rose-300 font-mono mt-1 block">
            {rejectedCount}
          </span>
          <span className="text-[10px] text-rose-500/80 block mt-0.5">Excluded from Map</span>
        </div>
      </div>

      {/* Most Frequently Reported Incidents Callout */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-800/40 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {t.mostFrequentType} {language === 'fil' ? '(Pinakamadalas na Insidente)' : '(Top Incident Hotspots)'}
          </h3>
          <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
            {t.verifiedBasisNotice}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topReportedTypes.length > 0 ? (
            topReportedTypes.map((item, idx) => (
              <div
                key={item.id}
                className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase" style={{ color: item.colorHex }}>
                      {item.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 mt-1 line-clamp-1">
                    {language === 'fil' ? item.fil : item.en}
                  </h4>
                </div>
                <div className="text-right pl-2">
                  <span className="text-base font-black text-white font-mono block">
                    {item.percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {item.count} {item.count === 1 ? 'report' : 'reports'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-4 text-slate-500 text-xs">
              No matching incidents found in selected period and filters.
            </div>
          )}
        </div>
      </div>

      {/* Visualizations: Pie / Donut Chart & Bar Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie / Donut Chart for Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Category Percentage Distribution
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Base: {baselineReports.length} {verifiedOnlyBasis ? 'Verified Cases' : 'All Cases'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {categoryStats.map((cat) => {
                  const strokeDasharray = `${(cat.angle / 360) * 251.2} 251.2`;
                  const strokeDashoffset = -((cat.startAngle / 360) * 251.2);
                  return (
                    <circle
                      key={cat.category}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={cat.info.colorHex}
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500 hover:opacity-80"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-white font-mono">
                  {baselineReports.length}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">
                  {verifiedOnlyBasis ? 'Verified' : 'Reports'}
                </span>
              </div>
            </div>

            {/* Category Legend & Breakdown */}
            <div className="space-y-2 w-full text-xs">
              {categoryStats.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow"
                      style={{ backgroundColor: cat.info.colorHex }}
                    />
                    <span className="font-semibold text-slate-200">
                      {language === 'fil' ? cat.info.labelFil : cat.info.labelEn}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-white font-bold">{cat.percentage}%</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">({cat.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Graphs: Most Reported Incident Percentages */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Incident Percentages (Bar Visualization)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              {verifiedOnlyBasis ? 'Verified Basis (Default)' : 'All Submitted'}
            </span>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {typeStatistics
              .filter((item) => item.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <span className="font-medium text-slate-200 truncate">
                        #{item.number} {language === 'fil' ? item.fil : item.en}
                      </span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="font-bold text-white">{item.percentage}%</span>
                      <span className="text-slate-500 text-[10px] ml-1">({item.count})</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(item.percentage, 2)}%`,
                        backgroundColor: item.colorHex,
                      }}
                    />
                  </div>
                </div>
              ))}

            {typeStatistics.every((t) => t.count === 0) && (
              <div className="text-center py-10 text-slate-500 text-xs">
                No incidents reported for the current filter criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Incident Type Table (All 24 Types) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Complete Incident Type Frequency & Percentage Matrix (24 Standard Types)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {typeStatistics.filter((t) => t.count > 0).length} of 24 Types Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Incident Classification</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Primary Agency</th>
                <th className="py-2.5 px-4 text-right">Reports Count</th>
                <th className="py-2.5 px-4 text-right">Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {typeStatistics.map((type) => (
                <tr
                  key={type.id}
                  className={`hover:bg-slate-800/40 transition ${
                    type.count > 0 ? 'bg-slate-800/10' : 'opacity-70'
                  }`}
                >
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-400">
                    #{type.number}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-white block">
                      {type.en}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {type.fil}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block"
                      style={{
                        backgroundColor: `${type.colorHex}22`,
                        color: type.colorHex,
                        border: `1px solid ${type.colorHex}55`,
                      }}
                    >
                      {type.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-300">
                    {type.primaryAgency}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                    {type.count}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">
                    <span
                      className={
                        type.count > 0 ? 'text-emerald-400' : 'text-slate-500'
                      }
                    >
                      {type.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
