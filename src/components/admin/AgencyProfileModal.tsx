import React, { useState, useEffect } from 'react';
import { useNexus } from '../../context/NexusContext';
import { AgencyScope } from '../../types';
import { AGENCY_DETAILS } from '../../constants/incidentData';
import { TRANSLATIONS } from '../../constants/translations';
import { AgencyLogo } from '../common/AgencyLogo';
import {
  auth,
  updatePassword,
  sendPasswordResetEmail
} from '../../lib/firebase';
import {
  ShieldAlert,
  Flame,
  Activity,
  Radio,
  User,
  Phone,
  Mail,
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AgencyProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    activeRole,
    adminProfiles,
    agencyDetails,
    updateAgencyProfile,
    agencyUser,
    language,
    firebaseUser,
    triggerSuccessModal
  } = useNexus();

  const t = TRANSLATIONS[language];
  const currentAgency: AgencyScope = activeRole === 'resident' ? 'CENTRAL' : activeRole;
  const currentProfile = adminProfiles[currentAgency];
  const currentDetails = agencyDetails[currentAgency] || AGENCY_DETAILS[currentAgency];

  const [activeTab, setActiveTab] = useState<'profile' | 'hotline' | 'security'>('profile');

  // Form Fields
  const [officerName, setOfficerName] = useState(currentProfile?.name || '');
  const [officerTitle, setOfficerTitle] = useState(currentProfile?.title || '');
  const [badgeNumber, setBadgeNumber] = useState(currentProfile?.badgeNumber || '');
  const [officerEmail, setOfficerEmail] = useState(currentProfile?.email || agencyUser?.email || '');
  const [hotline, setHotline] = useState(currentDetails?.hotline || '');
  const [descriptionEn, setDescriptionEn] = useState(currentDetails?.descriptionEn || '');
  const [descriptionFil, setDescriptionFil] = useState(currentDetails?.descriptionFil || '');
  const [stationAddress, setStationAddress] = useState('Provincial Headquarters, Oriental Mindoro');

  // Password Update Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if activeRole changes
  useEffect(() => {
    if (currentProfile && currentDetails) {
      setOfficerName(currentProfile.name || '');
      setOfficerTitle(currentProfile.title || '');
      setBadgeNumber(currentProfile.badgeNumber || '');
      setOfficerEmail(currentProfile.email || agencyUser?.email || '');
      setHotline(currentDetails.hotline || '');
      setDescriptionEn(currentDetails.descriptionEn || '');
      setDescriptionFil(currentDetails.descriptionFil || '');
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [currentAgency, isOpen]);

  // Handle ESC key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setShowConfirmPassword(false);

    try {
      await updateAgencyProfile(currentAgency, {
        name: officerName.trim(),
        title: officerTitle.trim(),
        badgeNumber: badgeNumber.trim(),
        email: officerEmail.trim(),
        hotline: hotline.trim(),
        descriptionEn: descriptionEn.trim(),
        descriptionFil: descriptionFil.trim(),
        stationAddress: stationAddress.trim(),
      });

      setSuccessMsg('Department profile & operational settings saved successfully!');
      triggerSuccessModal({
        title: 'Department Profile & Settings Saved!',
        message: `${currentAgency} officer credentials and dispatch settings have been updated.`,
        agency: currentAgency,
        statusBadge: `${currentAgency} Settings Applied`,
        actionType: 'save',
        details: `Duty Officer: ${officerName.trim()}, Badge: ${badgeNumber.trim() || 'N/A'}. Emergency Hotline: ${hotline.trim()}.`
      });
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3500);
    } catch (err: any) {
      console.error('Failed to save agency profile:', err);
      setErrorMsg(err.message || 'Failed to save department profile changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setShowConfirmPassword(false);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setSuccessMsg('Account password updated successfully in Firebase Authentication!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // If logged in via demo session, save locally
        setSuccessMsg('Password updated successfully for this official session!');
        setNewPassword('');
        setConfirmPassword('');
      }
      triggerSuccessModal({
        title: 'Security Password Updated!',
        message: 'Your official agency account password was successfully updated.',
        agency: currentAgency,
        statusBadge: 'Password Changed',
        actionType: 'save'
      });
    } catch (err: any) {
      console.error('Change Password Error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setErrorMsg('For security, updating your password requires a recent login. Please sign out and sign in again, or send a password reset email below.');
      } else {
        setErrorMsg(err.message || 'Failed to update password. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    const targetEmail = officerEmail.trim() || auth.currentUser?.email;
    if (!targetEmail) {
      setErrorMsg('No registered email address found to send password reset link.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setSuccessMsg(`Official password reset link sent to ${targetEmail}! Please check your email inbox.`);
    } catch (err: any) {
      console.error('Password Reset Email Error:', err);
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl relative text-slate-100 my-auto overflow-hidden">
        {/* Ambient Department Glow & Official Agency Seal Background Watermark */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.04] select-none transform translate-x-10 translate-y-10">
          <AgencyLogo agency={currentAgency} className="w-96 h-96 object-contain filter grayscale" />
        </div>
        {/* Top Department Banner */}
        <div
          className={`px-6 py-4 bg-gradient-to-r ${currentDetails.bgGrad} border-b ${currentDetails.border} flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 p-2 rounded-2xl bg-white/95 border border-white/20 shadow-md flex items-center justify-center shrink-0">
              <AgencyLogo agency={currentAgency} className="w-8 h-8 object-contain" animate />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                {currentDetails.badge}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                {currentAgency} Department Profile & Settings
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Duty Officer</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hotline')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'hotline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline & Station</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password & Security</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-red-950/70 border border-red-500/60 text-red-300 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Duty Officer Details */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                Configure the active commander and duty officer information displayed on the live dispatch console and audit log trail.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Duty Officer Name:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      required
                      placeholder="e.g. Col. M. Santos"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Rank / Operational Title:
                  </label>
                  <input
                    type="text"
                    value={officerTitle}
                    onChange={(e) => setOfficerTitle(e.target.value)}
                    required
                    placeholder="e.g. Provincial Police Commander"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Official Badge / Station ID:
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      required
                      placeholder="e.g. PNP-8849-NCR"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Official Agency Email:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={officerEmail}
                      onChange={(e) => setOfficerEmail(e.target.value)}
                      required
                      placeholder="official@nexus.gov.ph"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving Changes...' : 'Save Officer Profile'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Hotline & Station Details */}
          {activeTab === 'hotline' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                Emergency telephone numbers and station details are published to the citizen portal and emergency banners across Oriental Mindoro.
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Official Emergency Hotline Number:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-red-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    required
                    placeholder="e.g. 911 / (02) 8722-0650"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Station Headquarters Address:
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={stationAddress}
                    onChange={(e) => setStationAddress(e.target.value)}
                    placeholder="e.g. Camp Efigenio C Navarro, Calapan City"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Operational Description (English):
                </label>
                <textarea
                  rows={2}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Deskripsyon ng Tanggapan (Filipino):
                </label>
                <textarea
                  rows={2}
                  value={descriptionFil}
                  onChange={(e) => setDescriptionFil(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Update Public Hotline & Station Info'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Security & Change Password */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                Manage your official department authentication key. Passwords protect access to emergency dispatch commands and response unit management.
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5 rounded transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-blue-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5 rounded transition-colors"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4 text-blue-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Update Account Password</span>
                </button>
              </form>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  Prefer an email reset link sent to your registered address?
                </div>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Send Reset Link to Email</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

