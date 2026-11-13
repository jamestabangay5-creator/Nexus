import React, { useState, useRef, useEffect } from 'react';
import { IncidentReport, AgencyScope } from '../../types';
import {
  exportReportToPdf,
  exportReportToExcel,
  exportReportToWord,
  exportReportToCsv,
} from '../../services/exportReportService';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileCheck,
  ChevronDown,
  Printer,
  Shield,
  Check,
} from 'lucide-react';

interface Props {
  reports: IncidentReport[];
  agencyScope: AgencyScope | 'RESIDENT';
  officerName?: string;
  badgeNumber?: string;
  filtersApplied?: {
    category?: string;
    dateRange?: string;
    status?: string;
    barangay?: string;
    municipality?: string;
    searchQuery?: string;
  };
  documentTitle?: string;
  className?: string;
  buttonLabel?: string;
}

export const ExportReportsButton: React.FC<Props> = ({
  reports,
  agencyScope,
  officerName,
  badgeNumber,
  filtersApplied,
  documentTitle,
  className = '',
  buttonLabel = 'Export Reports',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportedFormat, setLastExportedFormat] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExport = async (format: 'pdf' | 'excel' | 'word' | 'csv') => {
    if (reports.length === 0) {
      alert('No reports match the current filter selection to export.');
      return;
    }

    setIsExporting(true);
    setLastExportedFormat(format);
    setIsOpen(false);

    try {
      const exportOptions = {
        reports,
        agencyScope,
        officerName,
        badgeNumber,
        filtersApplied,
        documentTitle,
      };

      if (format === 'pdf') {
        await exportReportToPdf(exportOptions);
      } else if (format === 'excel') {
        await exportReportToExcel(exportOptions);
      } else if (format === 'word') {
        await exportReportToWord(exportOptions);
      } else if (format === 'csv') {
        exportReportToCsv(exportOptions);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setLastExportedFormat(null);
      }, 1500);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow transition cursor-pointer disabled:opacity-60"
        title="Download filtered reports in PDF, Excel, Word, or CSV format with official agency letterhead"
      >
        {isExporting ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Generating...</span>
          </>
        ) : lastExportedFormat ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>Downloaded!</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            <span>{buttonLabel}</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">
              {reports.length}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 ring-1 ring-slate-900/5">
          <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Official Agency Download
            </span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-600" />
              <span>{agencyScope} Header · {reports.length} Records</span>
            </span>
          </div>

          <div className="space-y-1">
            {/* PDF Format */}
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-50 text-left transition flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-rose-700 cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-200 transition">
                <Printer className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="block leading-tight">Official PDF Report</span>
                <span className="block text-[10px] text-slate-400 font-normal">
                  Letterhead & sign-off printout
                </span>
              </div>
            </button>

            {/* Excel Format */}
            <button
              type="button"
              onClick={() => handleExport('excel')}
              className="w-full px-2.5 py-2 rounded-xl hover:bg-emerald-50 text-left transition flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 transition">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="block leading-tight">Excel Spreadsheet (.xls)</span>
                <span className="block text-[10px] text-slate-400 font-normal">
                  Formatted spreadsheet with headers
                </span>
              </div>
            </button>

            {/* Word Document */}
            <button
              type="button"
              onClick={() => handleExport('word')}
              className="w-full px-2.5 py-2 rounded-xl hover:bg-blue-50 text-left transition flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-blue-700 cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-200 transition">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="block leading-tight">Word Document (.doc)</span>
                <span className="block text-[10px] text-slate-400 font-normal">
                  MS Word document with agency seal
                </span>
              </div>
            </button>

            {/* CSV Format */}
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-100 text-left transition flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition">
                <FileCheck className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="block leading-tight">CSV Spreadsheet (.csv)</span>
                <span className="block text-[10px] text-slate-400 font-normal">
                  Universal raw data format
                </span>
              </div>
            </button>
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-slate-100 px-2 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Includes official agency seal</span>
            <span className="font-mono">A4 standard</span>
          </div>
        </div>
      )}
    </div>
  );
};

