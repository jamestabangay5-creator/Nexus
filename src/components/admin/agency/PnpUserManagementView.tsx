import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { UserProfile } from '../../../types';
import { BONGABONG_BARANGAYS, PILOT_MUNICIPALITY, PROVINCE_NAME } from '../../../constants/orientalMindoroData';
import { AgencyLogo } from '../../common/AgencyLogo';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  ExternalLink,
  MapPin,
  Lock,
  UserX
} from 'lucide-react';

export const PnpUserManagementView: React.FC = () => {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barangayFilter, setBarangayFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [selectedUserForDossier, setSelectedUserForDossier] = useState<UserProfile | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Real-time listener for Firestore /users collection
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    try {
      setLoading(true);
      const usersColRef = collection(db, 'users');
      unsubscribe = onSnapshot(
        usersColRef,
        (snapshot) => {
          const list: UserProfile[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              uid: docSnap.id,
              name: data.name || 'Anonymous Citizen',
              email: data.email || '',
              phone: data.phone || '0917-000-0000',
              province: data.province || PROVINCE_NAME,
              municipality: data.municipality || PILOT_MUNICIPALITY,
              barangay: data.barangay || 'Poblacion',
              address: data.address || 'Poblacion, Bongabong',
              avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
              role: data.role || 'resident',
              termsAccepted: data.termsAccepted ?? true,
              termsAcceptedAt: data.termsAcceptedAt || new Date().toISOString(),
              isVerifiedIdentity: Boolean(data.isVerifiedIdentity),
              authProvider: data.authProvider || 'password',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
            });
          });

          // Sort by newest
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setUsersList(list);
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore users collection snapshot notice:', error);
          // Fallback to local default user if firestore rules prevent read
          try {
            const localUsersStr = localStorage.getItem('nexus_registered_users_cache');
            if (localUsersStr) {
              setUsersList(JSON.parse(localUsersStr));
            }
          } catch {}
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('Users listener init warning:', e);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter((user) => {
      // Verification status filter
      if (verificationFilter === 'VERIFIED' && !user.isVerifiedIdentity) return false;
      if (verificationFilter === 'UNVERIFIED' && user.isVerifiedIdentity) return false;

      // Barangay filter
      if (barangayFilter !== 'ALL' && user.barangay !== barangayFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = user.name.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchPhone = user.phone.toLowerCase().includes(q);
        const matchUid = (user.uid || user.id).toLowerCase().includes(q);
        const matchBrgy = (user.barangay || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchUid && !matchBrgy) return false;
      }

      return true;
    });
  }, [usersList, verificationFilter, barangayFilter, searchQuery]);

  // Pagination calculations
  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, startIndex, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, barangayFilter, verificationFilter]);

  // Toggle user verification status (PNP Exclusive authority)
  const handleToggleVerification = async (user: UserProfile) => {
    setUpdatingUserId(user.uid || user.id);
    const newStatus = !user.isVerifiedIdentity;
    try {
      const userRef = doc(db, 'users', user.uid || user.id);
      await updateDoc(userRef, {
        isVerifiedIdentity: newStatus,
        verifiedByAgency: 'PNP',
        verifiedAt: new Date().toISOString(),
      });

      // Update local state immediately
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isVerifiedIdentity: newStatus } : u))
      );

      setActionNotice(`Citizen ${user.name} was successfully ${newStatus ? 'VERIFIED' : 'UNVERIFIED'} by PNP Admin.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.warn('User status update error, attempting setDoc merge:', err);
      try {
        const userRef = doc(db, 'users', user.uid || user.id);
        await setDoc(userRef, { isVerifiedIdentity: newStatus, verifiedByAgency: 'PNP' }, { merge: true });
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isVerifiedIdentity: newStatus } : u))
        );
        setActionNotice(`Citizen ${user.name} verification updated.`);
        setTimeout(() => setActionNotice(null), 4000);
      } catch (finalErr) {
        alert('Could not update user in Cloud Firestore. Check network or security rules.');
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Export User Registry as Excel / Word / CSV
  const handleExportUsers = (format: 'xls' | 'csv' | 'doc') => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const headers = ['UID', 'Full Name', 'Email', 'Phone', 'Municipality', 'Barangay', 'Address', 'Verified Status', 'Provider', 'Registered At'];
    const rows = filteredUsers.map((u) => [
      u.uid || u.id,
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.phone}"`,
      `"${u.municipality || PILOT_MUNICIPALITY}"`,
      `"${u.barangay}"`,
      `"${u.address}"`,
      u.isVerifiedIdentity ? 'Verified Identity' : 'Pending Verification',
      u.authProvider || 'password',
      u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
    ]);

    if (format === 'csv') {
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `PNP_Bongabong_Citizen_Registry_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Formatted HTML table for Excel/Word
      const tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8"/>
          <title>PNP Bongabong Citizen User Registry</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11px; }
            th { background-color: #1e3a8a; color: white; font-weight: bold; }
            .header-banner { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h2 style="margin: 0; color: #1e3a8a;">PHILIPPINE NATIONAL POLICE · BONGABONG MUNICIPAL POLICE STATION</h2>
            <h4 style="margin: 4px 0; color: #475569;">OFFICIAL REGISTERED CITIZEN IDENTITY DIRECTORY</h4>
            <p style="font-size: 10px; color: #64748b;">Pilot Municipality: Bongabong, Oriental Mindoro | Generated: ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map((r) => `<tr>${r.map((c) => `<td>${c.replace(/"/g, '')}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      const blob = new Blob([tableHtml], { type: format === 'xls' ? 'application/vnd.ms-excel' : 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PNP_Bongabong_Citizen_Registry_${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Metrics calculation
  const totalRegistered = usersList.length;
  const verifiedCount = usersList.filter((u) => u.isVerifiedIdentity).length;
  const unverifiedCount = totalRegistered - verifiedCount;
  const bongabongResidents = usersList.filter((u) => (u.municipality || '').toLowerCase() === 'bongabong').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: PNP Exclusive User Management Authority */}
      <div className="glass-card bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-700/60 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/20 flex items-center justify-center shrink-0">
              <AgencyLogo agency="PNP" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  PNP Exclusive Authority
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  Bongabong MPS · Security Division
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                Citizen Account & Identity Management Console
              </h2>
              <p className="text-xs text-blue-200/80 max-w-2xl font-medium">
                Mandated under PNP security governance to review citizen identities, verify registered residents in Bongabong, and maintain authentic emergency reporting integrity.
              </p>
            </div>
          </div>

          {/* Action notices & Export buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleExportUsers('xls')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-900/40"
              title="Download Excel spreadsheet of registered citizens"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExportUsers('doc')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-900/40"
              title="Download Word document of registered citizens"
            >
              <FileText className="w-4 h-4" />
              <span>Export Word</span>
            </button>
            <button
              onClick={() => handleExportUsers('csv')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionNotice && (
          <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Registered Citizens</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalRegistered}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Cloud Firestore & Local</div>
        </div>

        <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Verified Identity</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{verifiedCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Police Confirmed ({totalRegistered > 0 ? Math.round((verifiedCount / totalRegistered) * 100) : 0}%)</div>
        </div>

        <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Review</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">{unverifiedCount}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Awaiting Identity Verification</div>
        </div>

        <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Bongabong Residents</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 font-mono">{bongabongResidents}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">Pilot Area Confirmed</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card bg-white/85 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search citizen by name, email, phone, UID or barangay..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Verification status filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Identity Statuses</option>
            <option value="VERIFIED">Verified Identity Only</option>
            <option value="UNVERIFIED">Pending / Unverified</option>
          </select>

          {/* Barangay filter in Bongabong */}
          <select
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL">All 32 Bongabong Barangays</option>
            {BONGABONG_BARANGAYS.map((brgy) => (
              <option key={`pnp-usr-brgy-${brgy}`} value={brgy}>
                {brgy}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="glass-card bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Citizen Profile</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Location in Bongabong</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">PNP Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="font-semibold text-xs">Loading registered citizen accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    No registered citizens match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/40 transition">
                    {/* Profile */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 truncate flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.isVerifiedIdentity && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-50 shrink-0" title="PNP Verified Citizen" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            UID: {user.uid || user.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{user.email || 'No email provided'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone || '0917-000-0000'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{user.barangay}</span>
                        </div>
                        <span className="text-xs text-slate-500 block truncate">
                          {user.address || 'Poblacion, Bongabong'}
                        </span>
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4">
                      {user.isVerifiedIdentity ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <XCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending Verification</span>
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-500 font-mono">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Verification Button */}
                        <button
                          onClick={() => handleToggleVerification(user)}
                          disabled={updatingUserId === user.id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs ${
                            user.isVerifiedIdentity
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          }`}
                          title={user.isVerifiedIdentity ? 'Revoke verification status' : 'Verify citizen identity'}
                        >
                          {updatingUserId === user.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : user.isVerifiedIdentity ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Verify Citizen</span>
                            </>
                          )}
                        </button>

                        {/* View Dossier Button */}
                        <button
                          onClick={() => setSelectedUserForDossier(user)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                          title="View citizen full dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalUsers > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-slate-900 font-bold">{startIndex + 1}</strong> to{' '}
                <strong className="text-slate-900 font-bold">{Math.min(startIndex + pageSize, totalUsers)}</strong> of{' '}
                <strong className="text-slate-900 font-bold">{totalUsers}</strong> registered citizens
              </span>
              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 font-bold cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                  currentPage === 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="font-bold text-slate-800 px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                  currentPage === totalPages
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Citizen Dossier Modal */}
      {selectedUserForDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-base">
                  PNP Citizen Identity Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserForDossier(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={selectedUserForDossier.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={selectedUserForDossier.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-md shrink-0"
              />
              <div>
                <h4 className="text-lg font-black text-slate-900">{selectedUserForDossier.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {selectedUserForDossier.isVerifiedIdentity ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Verified Citizen Identity
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Verification
                    </span>
                  )}
                  <span className="text-xs text-slate-400 uppercase font-mono">
                    {selectedUserForDossier.authProvider || 'password'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Account UID:</span>
                <span className="font-mono font-bold text-slate-900 select-all">{selectedUserForDossier.uid || selectedUserForDossier.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Email Address:</span>
                <span className="font-semibold text-slate-900">{selectedUserForDossier.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Phone Contact:</span>
                <span className="font-mono font-bold text-slate-900">{selectedUserForDossier.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Barangay:</span>
                <span className="font-bold text-slate-900">{selectedUserForDossier.barangay}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Municipality & Province:</span>
                <span className="font-semibold text-slate-900">{selectedUserForDossier.municipality || 'Bongabong'}, Oriental Mindoro</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-bold">Specific Address:</span>
                <span className="font-semibold text-slate-900 text-right">{selectedUserForDossier.address}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  handleToggleVerification(selectedUserForDossier);
                  setSelectedUserForDossier((prev) => prev ? { ...prev, isVerifiedIdentity: !prev.isVerifiedIdentity } : null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md"
              >
                {selectedUserForDossier.isVerifiedIdentity ? 'Revoke Verification' : 'Verify Identity Now'}
              </button>
              <button
                onClick={() => setSelectedUserForDossier(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
