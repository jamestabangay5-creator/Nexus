import React, { useState, useRef, useEffect } from 'react';
import { useNexus } from '../../context/NexusContext';
import { TRANSLATIONS } from '../../constants/translations';
import {
  ORIENTAL_MINDORO_MUNICIPALITIES,
  getBarangaysForMunicipality,
  OrientalMindoroMunicipality,
  PROVINCE_NAME,
} from '../../constants/orientalMindoroData';
import { compressImage } from '../../utils/imageUtils';
import {
  auth,
  db,
  doc,
  updateDoc,
  setDoc,
  firebaseSignOut,
  updateProfile,
  sanitizeForFirestore
} from '../../lib/firebase';
import {
  User,
  Edit3,
  Globe,
  LogOut,
  X,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Camera,
  ShieldCheck,
  UploadCloud,
  RefreshCw,
  Sparkles,
  Building2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, onOpenAuth }) => {
  const {
    residentUser,
    updateResidentUser,
    language,
    setLanguage,
    setActiveRole,
    firebaseUser,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'language'>('profile');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state with Oriental Mindoro municipality & auto-generated barangay
  const [formData, setFormData] = useState({
    name: residentUser.name,
    phone: residentUser.phone,
    email: residentUser.email,
    province: residentUser.province || PROVINCE_NAME,
    municipality: (residentUser.municipality || 'Calapan City') as OrientalMindoroMunicipality,
    barangay: residentUser.barangay || 'Ibaba East',
    address: residentUser.address,
    avatarUrl: residentUser.avatarUrl,
  });

  // Sync form data if residentUser changes
  useEffect(() => {
    setFormData({
      name: residentUser.name,
      phone: residentUser.phone,
      email: residentUser.email,
      province: residentUser.province || PROVINCE_NAME,
      municipality: (residentUser.municipality || 'Calapan City') as OrientalMindoroMunicipality,
      barangay: residentUser.barangay || 'Ibaba East',
      address: residentUser.address,
      avatarUrl: residentUser.avatarUrl,
    });
  }, [residentUser]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMuni = e.target.value as OrientalMindoroMunicipality;
    const brgys = getBarangaysForMunicipality(newMuni);
    setFormData((prev) => ({
      ...prev,
      municipality: newMuni,
      barangay: brgys[0] || '',
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle uploading and compressing a real profile photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const compressedDataUrl = await compressImage(file, 500, 500, 0.85);
      setFormData((prev) => ({ ...prev, avatarUrl: compressedDataUrl }));
    } catch (err) {
      console.error('Error compressing profile photo:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateResidentUser(formData);

    // If signed into Firebase, update Firestore and Auth profile
    const uid = residentUser.uid || firebaseUser?.uid;
    if (uid) {
      try {
        const cleanPayload = sanitizeForFirestore({
          ...formData,
          isVerifiedIdentity: true,
          updatedAt: new Date().toISOString(),
        });
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, cleanPayload).catch(async () => {
          // Fallback if doc didn't exist yet
          await setDoc(userRef, {
            ...sanitizeForFirestore(residentUser),
            ...cleanPayload,
            id: uid,
            uid,
            isVerifiedIdentity: true,
            updatedAt: new Date().toISOString(),
          });
        });

        if (auth.currentUser) {
          const authUpdate: { displayName: string; photoURL?: string } = {
            displayName: formData.name,
          };
          if (formData.avatarUrl && (formData.avatarUrl.startsWith('http://') || formData.avatarUrl.startsWith('https://'))) {
            authUpdate.photoURL = formData.avatarUrl;
          }
          await updateProfile(auth.currentUser, authUpdate).catch(() => null);
        }
      } catch (err) {
        console.warn('Could not sync user profile to Firestore:', err);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('profile');
    }, 1200);
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase signout error:', err);
    }
    onClose();
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs per Requirement 9 */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.residentProfile}</span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'edit'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t.editAccount}</span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'language'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.languageSettings}</span>
          </button>
        </div>

        {/* Tab 1: Profile View */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <img
                src={residentUser.avatarUrl}
                alt={residentUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-lg"
              />
              <div>
                <h3 className="text-base font-bold text-white">{residentUser.name}</h3>
                <span className="text-xs text-slate-300 block font-medium">📍 {residentUser.barangay}, {residentUser.municipality || 'Calapan City'}</span>
                <span className="text-[10px] text-purple-400 font-semibold block">Oriental Mindoro, Region IV-B</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full mt-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Resident Account
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Mobile Number:
                </span>
                <strong className="text-white font-mono">{residentUser.phone}</strong>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email:
                </span>
                <span className="text-slate-200">{residentUser.email}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Municipality / City:
                </span>
                <span className="text-white font-semibold">{residentUser.municipality || 'Calapan City'}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Barangay:
                </span>
                <span className="text-slate-200">{residentUser.barangay}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Street / Purok:
                </span>
                <span className="text-slate-200">{residentUser.address}</span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Verified Registered Dispatch Address:</span>
                <strong className="text-emerald-300 text-xs block font-sans">
                  📍 {residentUser.address}, {residentUser.barangay}, {residentUser.municipality || 'Calapan City'}, Oriental Mindoro
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Terms Agreement:</span>
                <span className="text-emerald-400 font-bold">
                  {residentUser.termsAccepted ? 'Accepted & Active' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl border border-rose-900/60 flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logout}</span>
              </button>

              <button
                onClick={() => setActiveTab('edit')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow"
              >
                {t.editAccount}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Edit Account */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            {savedSuccess && (
              <div className="p-2.5 bg-emerald-950 border border-emerald-500/60 text-emerald-300 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Account profile successfully updated!</span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-bold mb-1">Full Legal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            {/* Oriental Mindoro Municipality & Barangay Selectors */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Oriental Mindoro Address Hierarchy</span>
                </span>
                <span className="text-[10px] bg-purple-900/40 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                  Region IV-B MIMAROPA
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Select Municipality <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.municipality}
                    onChange={handleMunicipalityChange}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {ORIENTAL_MINDORO_MUNICIPALITIES.map((muni) => (
                      <option key={muni} value={muni}>
                        {muni}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Select Barangay ({getBarangaysForMunicipality(formData.municipality).length}) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.barangay}
                    onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {getBarangaysForMunicipality(formData.municipality).map((b, idx) => (
                      <option key={`upm-b-${formData.municipality}-${b}-${idx}`} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Physical Street Address / Purok</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Purok 4, Sampaguita St., near Elementary School"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Dynamic live preview */}
              <div className="p-2 bg-purple-950/40 border border-purple-500/30 rounded-lg text-purple-200 text-[11px] flex items-center gap-1.5">
                <span className="shrink-0">📍</span>
                <span className="truncate">
                  Save Address: <strong className="text-white">{formData.address || 'Street/Purok'}, {formData.barangay}, {formData.municipality}, Oriental Mindoro</strong>
                </span>
              </div>
            </div>

            {/* True Identity Profile Photo Upload Section */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-slate-300 font-bold text-xs flex items-center justify-between">
                <span>Resident Profile Photo (True Identity)</span>
                {uploadingPhoto && <span className="text-[10px] text-purple-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Processing...</span>}
              </label>

              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <img
                    src={formData.avatarUrl}
                    alt="Current Avatar"
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white"
                    title="Upload genuine photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Genuine Photo</span>
                  </button>
                  <p className="text-[10px] text-slate-400">
                    JPG, PNG or WebP. Uploading your real photograph provides verified identity for 911 dispatch.
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Quick Preset Avatars Alternative */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 block mb-1.5">Or choose sample avatar:</span>
                <div className="flex items-center gap-2">
                  {sampleAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: url })}
                      className={`rounded-full p-0.5 border-2 transition cursor-pointer ${
                        formData.avatarUrl === url ? 'border-purple-500 scale-110 shadow-sm' : 'border-transparent hover:border-slate-600'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-8 h-8 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Language Settings */}
        {activeTab === 'language' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400">
              Select your preferred language for the incident report forms, system notices, and dispatch updates.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => setLanguage('en')}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                  language === 'en'
                    ? 'bg-blue-950/60 border-blue-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <strong className="block text-sm text-white">English (Default)</strong>
                  <span className="text-[11px] text-slate-400">Emergency Dispatch Interface in English</span>
                </div>
                {language === 'en' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
              </button>

              <button
                onClick={() => setLanguage('fil')}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                  language === 'fil'
                    ? 'bg-blue-950/60 border-blue-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <strong className="block text-sm text-white">Filipino / Tagalog</strong>
                  <span className="text-[11px] text-slate-400">Sistema at mga form sa wikang Filipino</span>
                </div>
                {language === 'fil' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveTab('profile')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
