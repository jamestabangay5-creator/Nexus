import { IncidentReport, AgencyScope, Agency } from '../types';
import { INCIDENT_TYPES } from '../constants/incidentData';

export interface ExportReportOptions {
  reports: IncidentReport[];
  agencyScope: AgencyScope | 'RESIDENT';
  officerName?: string;
  badgeNumber?: string;
  userTitle?: string;
  filtersApplied?: {
    category?: string;
    dateRange?: string;
    status?: string;
    barangay?: string;
    municipality?: string;
    searchQuery?: string;
  };
  documentTitle?: string;
}

export interface AgencyHeaderInfo {
  republicTitle: string;
  departmentTitle: string;
  agencyName: string;
  stationName: string;
  contactInfo: string;
  logoUrl: string;
  primaryColor: string;
  dutyRoleTitle: string;
  certifyingOfficerTitle: string;
}

export const getAgencyHeaderInfo = (scope: AgencyScope | 'RESIDENT'): AgencyHeaderInfo => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  switch (scope) {
    case 'PNP':
      return {
        republicTitle: 'Republic of the Philippines',
        departmentTitle: 'NATIONAL POLICE COMMISSION · PHILIPPINE NATIONAL POLICE',
        agencyName: 'POLICE REGIONAL OFFICE MIMAROPA · ORIENTAL MINDORO POLICE PROVINCIAL OFFICE',
        stationName: 'BONGABONG MUNICIPAL POLICE STATION',
        contactInfo: 'Poblacion, Bongabong, Oriental Mindoro | Emergency Hotline: 911 · (043) 283-5190',
        logoUrl: `${origin}/logos/pnp.svg`,
        primaryColor: '#1d4ed8',
        dutyRoleTitle: 'Chief of Police / Duty Dispatch Supervisor',
        certifyingOfficerTitle: 'PMAJ / Chief of Police, Bongabong MPS',
      };
    case 'BFP':
      return {
        republicTitle: 'Republic of the Philippines',
        departmentTitle: 'DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT',
        agencyName: 'BUREAU OF FIRE PROTECTION · REGION IV-B MIMAROPA',
        stationName: 'BONGABONG FIRE STATION',
        contactInfo: 'Poblacion, Bongabong, Oriental Mindoro | Emergency Hotline: 911 · 0917-814-3119',
        logoUrl: `${origin}/logos/bfp.png`,
        primaryColor: '#ea580c',
        dutyRoleTitle: 'Municipal Fire Marshal / Duty Officer',
        certifyingOfficerTitle: 'CINSP / Municipal Fire Marshal, BFP Bongabong',
      };
    case 'MDRRMO':
      return {
        republicTitle: 'Republic of the Philippines',
        departmentTitle: 'PROVINCE OF ORIENTAL MINDORO · MUNICIPALITY OF BONGABONG',
        agencyName: 'MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE',
        stationName: 'BONGABONG EMERGENCY OPERATIONS CENTER (EOC)',
        contactInfo: 'Municipal Hall Compound, Bongabong, Oriental Mindoro | Emergency Hotline: 911 · 0915-288-8880',
        logoUrl: `${origin}/logos/mdrrmo.jpg`,
        primaryColor: '#059669',
        dutyRoleTitle: 'MDRRM Officer / EOC Commander',
        certifyingOfficerTitle: 'Municipal Disaster Risk Reduction & Management Officer',
      };
    case 'CENTRAL':
      return {
        republicTitle: 'Republic of the Philippines',
        departmentTitle: 'PROVINCE OF ORIENTAL MINDORO · MUNICIPALITY OF BONGABONG',
        agencyName: 'NEXUS UNIFIED EMERGENCY RESPONSE COMMAND',
        stationName: 'INTER-AGENCY OPERATIONS CENTER (PNP · BFP · MDRRMO)',
        contactInfo: 'Bongabong Central Command Operations Center | Municipal Emergency Network',
        logoUrl: `${origin}/logos/central.png`,
        primaryColor: '#7c3aed',
        dutyRoleTitle: 'Unified Operations Commander',
        certifyingOfficerTitle: 'Joint Inter-Agency Operations Commander',
      };
    case 'RESIDENT':
    default:
      return {
        republicTitle: 'Republic of the Philippines · Province of Oriental Mindoro',
        departmentTitle: 'MUNICIPALITY OF BONGABONG · PUBLIC SAFETY & EMERGENCY SERVICES',
        agencyName: 'NEXUS CITIZEN RESIDENT PORTAL',
        stationName: 'OFFICIAL CITIZEN INCIDENT REPORT SUMMARY DOSSIER',
        contactInfo: 'Bongabong Emergency Network | Citizen Emergency Access',
        logoUrl: `${origin}/logos/central.png`,
        primaryColor: '#2563eb',
        dutyRoleTitle: 'Verified Resident Citizen',
        certifyingOfficerTitle: 'NEXUS Automated Records Verification Officer',
      };
  }
};

/**
 * Convert an image URL to a base64 Data URI so it displays natively in Word, PDF, or offline documents
 */
export const getLogoDataUri = async (url: string): Promise<string> => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return url;
  }
};

/**
 * Format date string to clean Philippine standard
 */
const formatDateTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

/**
 * Security & Data Privacy (RA 10173 Philippine Data Privacy Act):
 * When reports are exported in resident mode, mask other citizens' names and contact numbers.
 * The resident only sees their own full information.
 * Authorized agency officers (PNP, BFP, MDRRMO, CENTRAL) receive unmasked reporter info for emergency dispatch.
 */
const getMaskedReporterData = (rep: IncidentReport, options: ExportReportOptions) => {
  const isAgencyDownload = options.agencyScope !== 'RESIDENT';
  const isOwner = Boolean(
    options.officerName &&
    rep.residentName.trim().toLowerCase() === options.officerName.trim().toLowerCase()
  );
  if (isAgencyDownload || isOwner) {
    return {
      name: rep.residentName,
      phone: rep.residentPhone,
    };
  }
  return {
    name: 'Verified Citizen (Identity Protected)',
    phone: '•••••••••••• (Confidential)',
  };
};

/**
 * Generate PDF Report via browser print dialogue with clean letterhead and formatted table
 */
export const exportReportToPdf = async (options: ExportReportOptions): Promise<void> => {
  const { reports, agencyScope, officerName, badgeNumber, filtersApplied, documentTitle } = options;
  const header = getAgencyHeaderInfo(agencyScope);
  const logoDataUri = await getLogoDataUri(header.logoUrl);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const ongoingCount = reports.filter((r) => r.status === 'Ongoing').length;
  const acceptedCount = reports.filter((r) => r.status === 'Accepted').length;
  const pendingCount = reports.filter((r) => r.status === 'Pending Verification').length;
  const criticalCount = reports.filter((r) => r.category === 'RED').length;

  const docNo = `DOC-NX-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const printHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${documentTitle || 'NEXUS 911 Incident Report'}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 11px;
          line-height: 1.35;
          color: #1e293b;
          background: #ffffff;
          margin: 0;
          padding: 8px;
        }
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid ${header.primaryColor};
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .header-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .header-text {
          text-align: center;
          flex: 1;
          padding: 0 16px;
        }
        .republic-text {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
          margin: 0;
        }
        .dept-text {
          font-size: 11px;
          font-weight: 700;
          color: #1e293b;
          margin: 2px 0;
        }
        .agency-text {
          font-size: 12px;
          font-weight: 800;
          color: ${header.primaryColor};
          margin: 2px 0;
        }
        .station-text {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.05em;
          margin: 3px 0;
        }
        .contact-text {
          font-size: 9px;
          color: #64748b;
          margin: 2px 0 0 0;
        }
        .meta-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 14px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          font-size: 10px;
        }
        .meta-item strong {
          display: block;
          color: #64748b;
          font-size: 9px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .meta-item span {
          font-weight: 700;
          color: #0f172a;
        }
        .kpi-row {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }
        .kpi-chip {
          flex: 1;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          text-align: center;
        }
        .kpi-chip .num {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
        }
        .kpi-chip .lbl {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          margin-bottom: 20px;
        }
        th {
          background-color: ${header.primaryColor};
          color: #ffffff;
          font-weight: 800;
          text-align: left;
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
          vertical-align: top;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .tag-pill {
          display: inline-block;
          padding: 1.5px 5px;
          border-radius: 4px;
          font-size: 8.5px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .cat-RED { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
        .cat-ORANGE { background: #ffedd5; color: #9a3412; border: 1px solid #fb923c; }
        .cat-YELLOW { background: #fef9c3; color: #854d0e; border: 1px solid #facc15; }
        .cat-GREEN { background: #dcfce7; color: #166534; border: 1px solid #4ade80; }
        .cat-BLUE { background: #dbeafe; color: #1e40af; border: 1px solid #60a5fa; }
        .cat-WHITE { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
        .status-pill {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 9999px;
          font-size: 8.5px;
          font-weight: 800;
        }
        .stat-Resolved { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .stat-Ongoing { background: #ffedd5; color: #9a3412; border: 1px solid #fdba74; }
        .stat-Accepted { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        .stat-Pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .stat-Rejected { background: #ffe4e6; color: #9f1239; border: 1px solid #fca5a5; }
        .sign-container {
          margin-top: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          page-break-inside: avoid;
        }
        .sign-box {
          border-top: 1px solid #0f172a;
          padding-top: 4px;
          text-align: center;
        }
        .sign-name {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
        }
        .sign-title {
          font-size: 9px;
          color: #475569;
        }
        .footer-note {
          margin-top: 16px;
          text-align: center;
          font-size: 8.5px;
          color: #94a3b8;
          border-top: 1px dashed #cbd5e1;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <img src="${logoDataUri}" class="header-logo" alt="${header.agencyName} Logo" />
        <div class="header-text">
          <p class="republic-text">${header.republicTitle}</p>
          <p class="dept-text">${header.departmentTitle}</p>
          <p class="agency-text">${header.agencyName}</p>
          <h1 class="station-text">${header.stationName}</h1>
          <p class="contact-text">${header.contactInfo}</p>
        </div>
        <img src="${header.logoUrl}" class="header-logo" style="opacity: 0.9;" alt="Official Seal" />
      </div>

      <div style="text-align: center; margin-bottom: 12px;">
        <h2 style="font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; color: #0f172a;">
          ${documentTitle || 'OFFICIAL EMERGENCY INCIDENT SUMMARY REPORT'}
        </h2>
        <span style="font-size: 9.5px; color: #64748b; font-weight: 600;">
          CENTRALIZED EMERGENCY RECORDS & AUDIT DOSSIER
        </span>
      </div>

      <div class="meta-box">
        <div class="meta-item">
          <strong>Document Control No.</strong>
          <span style="font-family: monospace;">${docNo}</span>
        </div>
        <div class="meta-item">
          <strong>Date & Time Generated</strong>
          <span>${dateFormatted} · ${timeFormatted}</span>
        </div>
        <div class="meta-item">
          <strong>Generated By</strong>
          <span>${officerName || 'Duty Dispatch Officer'} ${badgeNumber ? `(${badgeNumber})` : ''}</span>
        </div>
        <div class="meta-item">
          <strong>Operating Agency</strong>
          <span style="color: ${header.primaryColor};">${agencyScope} COMMAND</span>
        </div>
        <div class="meta-item">
          <strong>Filtered Category</strong>
          <span>${filtersApplied?.category || 'ALL CATEGORIES'}</span>
        </div>
        <div class="meta-item">
          <strong>Time Window</strong>
          <span>${filtersApplied?.dateRange || 'ALL TIME'}</span>
        </div>
        <div class="meta-item">
          <strong>Status Filter</strong>
          <span>${filtersApplied?.status || 'ALL ACTIVE'}</span>
        </div>
        <div class="meta-item">
          <strong>Total Records</strong>
          <span style="color: ${header.primaryColor}; font-size: 12px;">${reports.length} Reports Found</span>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-chip">
          <div class="num">${reports.length}</div>
          <div class="lbl">Total Incidents</div>
        </div>
        <div class="kpi-chip" style="background: #fef2f2; border-color: #fecaca;">
          <div class="num" style="color: #b91c1c;">${criticalCount}</div>
          <div class="lbl" style="color: #b91c1c;">Critical (RED)</div>
        </div>
        <div class="kpi-chip" style="background: #fffbeb; border-color: #fde68a;">
          <div class="num" style="color: #b45309;">${pendingCount}</div>
          <div class="lbl" style="color: #b45309;">Pending Triage</div>
        </div>
        <div class="kpi-chip" style="background: #fff7ed; border-color: #ffedd5;">
          <div class="num" style="color: #c2410c;">${ongoingCount + acceptedCount}</div>
          <div class="lbl" style="color: #c2410c;">Active / En Route</div>
        </div>
        <div class="kpi-chip" style="background: #f0fdf4; border-color: #bbf7d0;">
          <div class="num" style="color: #15803d;">${resolvedCount}</div>
          <div class="lbl" style="color: #15803d;">Resolved Cases</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 10%;">Tracking No.</th>
            <th style="width: 13%;">Category & Type</th>
            <th style="width: 12%;">Date / Time</th>
            <th style="width: 16%;">Barangay & Location</th>
            <th style="width: 14%;">Reporting Citizen</th>
            <th style="width: 7%;">Agency</th>
            <th style="width: 10%;">Status</th>
            <th style="width: 18%;">Incident Narrative</th>
          </tr>
        </thead>
        <tbody>
          ${
            reports.length === 0
              ? `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No incident reports matched the selected filter criteria.</td></tr>`
              : reports
                  .map((rep) => {
                    const typeDef = INCIDENT_TYPES.find(
                      (t) => t.id === (rep.verifiedTypeId || rep.initialTypeId)
                    );
                    const statusClass = rep.status.startsWith('Pending') ? 'stat-Pending' : `stat-${rep.status}`;
                    const reporter = getMaskedReporterData(rep, options);
                    return `
                      <tr>
                        <td style="font-family: monospace; font-weight: 800; color: #1d4ed8;">${rep.trackingCode}</td>
                        <td>
                          <span class="tag-pill cat-${rep.category}">${rep.category}</span>
                          <div style="font-weight: 700; margin-top: 2px;">${typeDef?.en || rep.verifiedTypeId || rep.initialTypeId}</div>
                        </td>
                        <td style="font-size: 9px; color: #475569;">
                          <strong>${formatDateTime(rep.dateTime)}</strong>
                        </td>
                        <td>
                          <strong>${rep.barangay}</strong>, ${rep.municipality || 'Bongabong'}
                          <div style="font-size: 8.5px; color: #64748b;">${rep.locationDetails || ''}</div>
                        </td>
                        <td>
                          <strong>${reporter.name}</strong>
                          <div style="font-size: 8.5px; color: #64748b;">${reporter.phone}</div>
                        </td>
                        <td style="font-weight: 800; color: #0f172a; text-align: center;">${rep.selectedAgency}</td>
                        <td>
                          <span class="status-pill ${statusClass}">${rep.status}</span>
                        </td>
                        <td style="font-size: 9px; color: #334155; line-height: 1.3;">
                          ${rep.description}
                          ${rep.resolution?.notes ? `<div style="font-size: 8.5px; color: #166534; margin-top: 3px;"><em>Resolution:</em> ${rep.resolution.notes}</div>` : ''}
                        </td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>

      <div class="sign-container">
        <div class="sign-box">
          <div class="sign-name">${officerName || 'Duty Dispatch Officer'}</div>
          <div class="sign-title">Prepared by: ${header.dutyRoleTitle}</div>
          <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Electronic Verification Stamp: VERIFIED</div>
        </div>
        <div class="sign-box">
          <div class="sign-name">Official Document Seal</div>
          <div class="sign-title">${header.stationName}</div>
          <div style="font-size: 8px; color: #64748b; margin-top: 2px;">MIMAROPA Emergency Command</div>
        </div>
        <div class="sign-box">
          <div class="sign-name">Commanding Officer</div>
          <div class="sign-title">Approved by: ${header.certifyingOfficerTitle}</div>
          <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Signed on: ${dateFormatted}</div>
        </div>
      </div>

      <div class="footer-note">
        This document is an official government extraction from the NEXUS Unified Emergency Incident Database. Unauthorized alteration, forging, or tampering is strictly penalized under Republic Act No. 10175 and Revised Penal Code of the Philippines.
      </div>
    </body>
    </html>
  `;

  // Print popup window
  const printWindow = window.open('', '_blank', 'width=1100,height=850');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  }
};

/**
 * Generate Excel (.xls) file with official agency header block, styled column titles, and incident data
 */
export const exportReportToExcel = async (options: ExportReportOptions): Promise<void> => {
  const { reports, agencyScope, officerName, badgeNumber, filtersApplied, documentTitle } = options;
  const header = getAgencyHeaderInfo(agencyScope);
  const now = new Date();
  const dateFormatted = now.toLocaleString();
  const docNo = `DOC-NX-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const ongoingCount = reports.filter((r) => r.status === 'Ongoing').length;
  const pendingCount = reports.filter((r) => r.status === 'Pending Verification').length;

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Incident Reports</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        .header-title { font-size: 14pt; font-weight: bold; color: #0f172a; text-align: center; }
        .header-sub { font-size: 10pt; color: #475569; text-align: center; }
        .header-agency { font-size: 12pt; font-weight: bold; color: ${header.primaryColor}; text-align: center; }
        .meta-cell { font-size: 9pt; color: #334155; }
        .th-cell { background-color: ${header.primaryColor}; color: #ffffff; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; text-align: left; }
        .td-cell { font-size: 9pt; border: 1px solid #e2e8f0; vertical-align: top; }
        .td-code { font-family: monospace; font-weight: bold; color: #1d4ed8; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="10" class="header-sub">${header.republicTitle}</td>
        </tr>
        <tr>
          <td colspan="10" class="header-sub">${header.departmentTitle}</td>
        </tr>
        <tr>
          <td colspan="10" class="header-agency">${header.agencyName}</td>
        </tr>
        <tr>
          <td colspan="10" class="header-title">${header.stationName}</td>
        </tr>
        <tr>
          <td colspan="10" class="header-sub">${header.contactInfo}</td>
        </tr>
        <tr>
          <td colspan="10" style="text-align: center; font-weight: bold; font-size: 12pt; color: #1e3a8a; padding: 10px 0;">
            ${documentTitle || 'OFFICIAL EMERGENCY INCIDENT REPORT & AUDIT DOSSIER'}
          </td>
        </tr>
        <tr>
          <td colspan="2" class="meta-cell"><b>Control No:</b> ${docNo}</td>
          <td colspan="3" class="meta-cell"><b>Generated:</b> ${dateFormatted}</td>
          <td colspan="3" class="meta-cell"><b>Officer:</b> ${officerName || 'Duty Dispatch Officer'} ${badgeNumber ? `(${badgeNumber})` : ''}</td>
          <td colspan="2" class="meta-cell"><b>Scope:</b> ${agencyScope} COMMAND</td>
        </tr>
        <tr>
          <td colspan="2" class="meta-cell"><b>Category:</b> ${filtersApplied?.category || 'ALL'}</td>
          <td colspan="3" class="meta-cell"><b>Time Window:</b> ${filtersApplied?.dateRange || 'ALL TIME'}</td>
          <td colspan="3" class="meta-cell"><b>Status Filter:</b> ${filtersApplied?.status || 'ALL'}</td>
          <td colspan="2" class="meta-cell"><b>Total Records:</b> ${reports.length}</td>
        </tr>
        <tr>
          <td colspan="10" style="background-color: #f1f5f9; font-size: 9pt; padding: 4px;">
            <b>Summary KPIs:</b> Total: ${reports.length} | Pending: ${pendingCount} | Ongoing/Accepted: ${ongoingCount} | Resolved: ${resolvedCount}
          </td>
        </tr>
        <tr><td colspan="10"></td></tr>
        <tr>
          <th class="th-cell">Tracking Code</th>
          <th class="th-cell">Category</th>
          <th class="th-cell">Incident Type</th>
          <th class="th-cell">Date & Time</th>
          <th class="th-cell">Barangay</th>
          <th class="th-cell">Municipality</th>
          <th class="th-cell">Reporting Citizen</th>
          <th class="th-cell">Citizen Contact</th>
          <th class="th-cell">Status</th>
          <th class="th-cell">Incident Details</th>
        </tr>
        ${reports
          .map((rep) => {
            const typeDef = INCIDENT_TYPES.find((t) => t.id === (rep.verifiedTypeId || rep.initialTypeId));
            const reporter = getMaskedReporterData(rep, options);
            return `
              <tr>
                <td class="td-cell td-code">${rep.trackingCode}</td>
                <td class="td-cell"><b>${rep.category}</b></td>
                <td class="td-cell">${typeDef?.en || rep.verifiedTypeId || rep.initialTypeId}</td>
                <td class="td-cell">${formatDateTime(rep.dateTime)}</td>
                <td class="td-cell">${rep.barangay}</td>
                <td class="td-cell">${rep.municipality || 'Bongabong'}</td>
                <td class="td-cell">${reporter.name}</td>
                <td class="td-cell">${reporter.phone}</td>
                <td class="td-cell"><b>${rep.status}</b></td>
                <td class="td-cell">${rep.description}</td>
              </tr>
            `;
          })
          .join('')}
        <tr><td colspan="10"></td></tr>
        <tr>
          <td colspan="4" style="font-size: 9pt; border-top: 1px solid #000; text-align: center;">
            <b>${officerName || 'Duty Dispatch Officer'}</b><br/>Prepared by: ${header.dutyRoleTitle}
          </td>
          <td colspan="2"></td>
          <td colspan="4" style="font-size: 9pt; border-top: 1px solid #000; text-align: center;">
            <b>Commanding Officer</b><br/>Approved by: ${header.certifyingOfficerTitle}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NEXUS-Bongabong-${agencyScope}-Report-${now.toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generate Microsoft Word (.doc) document with official letterhead, table, and signature blocks
 */
export const exportReportToWord = async (options: ExportReportOptions): Promise<void> => {
  const { reports, agencyScope, officerName, badgeNumber, filtersApplied, documentTitle } = options;
  const header = getAgencyHeaderInfo(agencyScope);
  const now = new Date();
  const dateFormatted = now.toLocaleString();
  const docNo = `DOC-NX-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${documentTitle || 'Official Incident Report'}</title>
      <style>
        @page WordSection1 {
          size: 841.9pt 595.3pt; /* A4 Landscape */
          mso-page-orientation: landscape;
          margin: 36.0pt 36.0pt 36.0pt 36.0pt;
        }
        div.WordSection1 { page: WordSection1; }
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; color: #1e293b; }
        .center-header { text-align: center; margin-bottom: 15px; }
        .republic { font-size: 9pt; color: #475569; text-transform: uppercase; margin: 0; }
        .dept { font-size: 10pt; font-weight: bold; color: #1e293b; margin: 2px 0; }
        .agency { font-size: 11pt; font-weight: bold; color: ${header.primaryColor}; margin: 2px 0; }
        .station { font-size: 13pt; font-weight: bold; color: #0f172a; margin: 3px 0; }
        .contact { font-size: 8.5pt; color: #64748b; margin: 2px 0; }
        .divider { border-bottom: 2pt solid ${header.primaryColor}; margin: 10px 0 15px 0; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9pt; }
        .meta-table td { padding: 4px 8px; border: 1px solid #cbd5e1; background: #f8fafc; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; }
        .data-table th { background-color: ${header.primaryColor}; color: #ffffff; padding: 6px; border: 1px solid #94a3b8; font-weight: bold; text-align: left; }
        .data-table td { padding: 6px; border: 1px solid #cbd5e1; vertical-align: top; }
        .code { font-family: 'Courier New', monospace; font-weight: bold; color: #1d4ed8; }
        .sign-table { width: 100%; margin-top: 25px; border-collapse: collapse; }
        .sign-table td { width: 50%; text-align: center; vertical-align: top; padding: 10px; }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        <div class="center-header">
          <p class="republic">${header.republicTitle}</p>
          <p class="dept">${header.departmentTitle}</p>
          <p class="agency">${header.agencyName}</p>
          <p class="station">${header.stationName}</p>
          <p class="contact">${header.contactInfo}</p>
          <div class="divider"></div>
          <h2 style="font-size: 12pt; text-transform: uppercase; margin: 5px 0;">${documentTitle || 'OFFICIAL EMERGENCY INCIDENT SUMMARY REPORT'}</h2>
        </div>

        <table class="meta-table">
          <tr>
            <td><b>Control No:</b> ${docNo}</td>
            <td><b>Generated:</b> ${dateFormatted}</td>
            <td><b>Officer:</b> ${officerName || 'Duty Dispatch Officer'} ${badgeNumber ? `(${badgeNumber})` : ''}</td>
            <td><b>Scope:</b> ${agencyScope}</td>
          </tr>
          <tr>
            <td><b>Category:</b> ${filtersApplied?.category || 'ALL'}</td>
            <td><b>Date Filter:</b> ${filtersApplied?.dateRange || 'ALL TIME'}</td>
            <td><b>Status Filter:</b> ${filtersApplied?.status || 'ALL'}</td>
            <td><b>Total Records:</b> ${reports.length} Reports</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 12%;">Tracking Code</th>
              <th style="width: 14%;">Category & Type</th>
              <th style="width: 12%;">Date & Time</th>
              <th style="width: 16%;">Barangay & Location</th>
              <th style="width: 14%;">Reporting Citizen</th>
              <th style="width: 8%;">Agency</th>
              <th style="width: 10%;">Status</th>
              <th style="width: 14%;">Narrative Summary</th>
            </tr>
          </thead>
          <tbody>
            ${reports
              .map((rep) => {
                const typeDef = INCIDENT_TYPES.find((t) => t.id === (rep.verifiedTypeId || rep.initialTypeId));
                const reporter = getMaskedReporterData(rep, options);
                return `
                  <tr>
                    <td class="code">${rep.trackingCode}</td>
                    <td><b>[${rep.category}]</b> ${typeDef?.en || rep.verifiedTypeId || rep.initialTypeId}</td>
                    <td>${formatDateTime(rep.dateTime)}</td>
                    <td><b>${rep.barangay}</b>, ${rep.municipality || 'Bongabong'}</td>
                    <td>${reporter.name} (${reporter.phone})</td>
                    <td style="text-align: center;"><b>${rep.selectedAgency}</b></td>
                    <td><b>${rep.status}</b></td>
                    <td>${rep.description}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>

        <table class="sign-table">
          <tr>
            <td>
              <div style="border-top: 1pt solid #000; width: 80%; margin: 0 auto; padding-top: 4px;">
                <b>${officerName || 'Duty Dispatch Officer'}</b><br/>
                <span style="font-size: 8.5pt; color: #475569;">Prepared by: ${header.dutyRoleTitle}</span>
              </div>
            </td>
            <td>
              <div style="border-top: 1pt solid #000; width: 80%; margin: 0 auto; padding-top: 4px;">
                <b>Commanding Officer</b><br/>
                <span style="font-size: 8.5pt; color: #475569;">Approved by: ${header.certifyingOfficerTitle}</span>
              </div>
            </td>
          </tr>
        </table>

        <p style="text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 20px;">
          This document is an official government extraction from the NEXUS Unified Emergency Incident Database.
        </p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NEXUS-Bongabong-${agencyScope}-Report-${now.toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generate CSV export
 */
export const exportReportToCsv = (options: ExportReportOptions): void => {
  const { reports, agencyScope, officerName, filtersApplied } = options;
  const header = getAgencyHeaderInfo(agencyScope);
  const now = new Date();

  const lines: string[] = [];

  // Metadata headers
  lines.push(`"${header.republicTitle}"`);
  lines.push(`"${header.departmentTitle}"`);
  lines.push(`"${header.agencyName} - ${header.stationName}"`);
  lines.push(`"Generated On: ${now.toLocaleString()} | Generated By: ${officerName || 'Duty Officer'}"`);
  lines.push(`"Filters: Category=${filtersApplied?.category || 'ALL'}, DateRange=${filtersApplied?.dateRange || 'ALL'}, Status=${filtersApplied?.status || 'ALL'}"`);
  lines.push('');

  // Column Headers
  lines.push([
    'Tracking Code',
    'Category',
    'Incident Type',
    'Date & Time',
    'Barangay',
    'Municipality',
    'Location Details',
    'Citizen Name',
    'Contact Number',
    'Assigned Agency',
    'Status',
    'Description',
    'Resolution Notes',
  ].map((c) => `"${c}"`).join(','));

  // Rows
  reports.forEach((r) => {
    const typeDef = INCIDENT_TYPES.find((t) => t.id === (r.verifiedTypeId || r.initialTypeId));
    const reporter = getMaskedReporterData(r, options);
    lines.push([
      r.trackingCode,
      r.category,
      typeDef?.en || r.verifiedTypeId || r.initialTypeId,
      formatDateTime(r.dateTime),
      r.barangay,
      r.municipality || 'Bongabong',
      (r.locationDetails || '').replace(/"/g, '""'),
      reporter.name,
      reporter.phone,
      r.selectedAgency,
      r.status,
      (r.description || '').replace(/"/g, '""'),
      (r.resolution?.notes || '').replace(/"/g, '""'),
    ].map((val) => `"${val}"`).join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NEXUS-Bongabong-${agencyScope}-Report-${now.toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

