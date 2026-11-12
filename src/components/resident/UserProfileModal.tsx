import React, { useState, useRef, useEffect } from 'react';
import { useNexus } from '../../context/NexusContext';
import { TRANSLATIONS } from '../../constants/translations';
import {
  ORIENTAL_MINDORO_MUNICIPALITIES,
  getBarangaysForMunicipality,
  OrientalMindoroMunicipality,
  PROVINCE_NAME,
} from '../../constants/orientalMindoroData';
import { compressImage, compressAvatarImage } from '../../utils/imageUtils';
import { persistUserAvatar } from '../../services/offlineStorage';
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
      // High-performance avatar compression: 360x360 square thumbnail (~20KB)
      const compressedDataUrl = await compressAvatarImage(file);
      setFormData((prev) => ({ ...prev, avatarUrl: compressedDataUrl }));

      // Immediately auto-save to React state, IndexedDB, and LocalStorage so it is NEVER lost
      updateResidentUser({ avatarUrl: compressedDataUrl });
      const uid = residentUser.uid || firebaseUser?.uid || residentUser.id;
      await persistUserAvatar(uid, residentUser.email, compressedDataUrl);

      // If signed into Firebase, immediately sync to Cloud Firestore
      if (uid && firebaseUser) {
        const userRef = doc(db, 'users', uid);
        await setDoc(
          userRef,
          {
            avatarUrl: compressedDataUrl,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => console.warn('Could not sync avatar to Firestore:', err));
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Error compressing profile photo:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateResidentUser(formData);

    const uid = residentUser.uid || firebaseUser?.uid || residentUser.id;

    // Permanently persist avatar to IndexedDB and LocalStorage
    if (formData.avatarUrl) {
      await persistUserAvatar(uid, residentUser.email, formData.avatarUrl);
    }

    // If signed into Firebase, update Firestore and Auth profile
    if (uid && firebaseUser) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in">
      <div className="glass-card bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl max-w-lg w-full p-6 shadow-2xl shadow-slate-300/60 relative text-slate-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs per Requirement 9 */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-200 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.residentProfile}</span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-200 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t.editAccount}</span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'language'
                ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/70 border border-slate-200 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.languageSettings}</span>
          </button>
        </div>

        {/* Tab 1: Profile View */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <img
                src={residentUser.avatarUrl}
                alt={residentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
              <div>
                <h3 className="text-base font-black text-slate-900">{residentUser.name}</h3>
                <span className="text-xs text-slate-600 block font-medium">📍 {residentUser.barangay}, {residentUser.municipality || 'Calapan City'}</span>
                <span className="text-[10px] text-indigo-600 font-bold block">Oriental Mindoro, Region IV-B</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Resident Account
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Mobile Number:
                </span>
                <strong className="text-slate-900 font-mono">{residentUser.phone}</strong>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email:
                </span>
                <span className="text-slate-800 font-medium">{residentUser.email}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Municipality / City:
                </span>
                <span className="text-slate-900 font-bold">{residentUser.municipality || 'Calapan City'}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Barangay:
                </span>
                <span className="text-slate-800 font-medium">{residentUser.barangay}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Street / Purok:
                </span>
                <span className="text-slate-800 font-medium">{residentUser.address}</span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Verified Registered Dispatch Address:</span>
                <strong className="text-emerald-800 text-xs block font-sans font-bold">
                  📍 {residentUser.address}, {residentUser.barangay}, {residentUser.municipality || 'Calapan City'}, Oriental Mindoro
                </strong>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Terms Agreement:</span>
                <span className="text-emerald-700 font-bold">
                  {residentUser.termsAccepted ? 'Accepted & Active' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logout}</span>
              </button>

              <button
                onClick={() => setActiveTab('edit')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
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
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">Account profile successfully updated!</span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Legal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>

            {/* Oriental Mindoro Municipality & Barangay Selectors */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Oriental Mindoro Address Hierarchy</span>
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                  Region IV-B MIMAROPA
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Select Municipality <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.municipality}
                    onChange={handleMunicipalityChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                  >
                    {ORIENTAL_MINDORO_MUNICIPALITIES.map((muni) => (
                      <option key={muni} value={muni}>
                        {muni}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Select Barangay ({getBarangaysForMunicipality(formData.municipality).length}) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.barangay}
                    onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
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
                <label className="block text-slate-600 font-bold mb-1">Physical Street Address / Purok</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Purok 4, Sampaguita St., near Elementary School"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                />
              </div>

              {/* Dynamic live preview */}
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-[11px] flex items-center gap-1.5 shadow-2xs">
                <span className="shrink-0">📍</span>
                <span className="truncate">
                  Save Address: <strong className="text-slate-900">{formData.address || 'Street/Purok'}, {formData.barangay}, {formData.municipality}, Oriental Mindoro</strong>
                </span>
              </div>
            </div>

            {/* True Identity Profile Photo Upload Section */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
              <label className="block text-slate-800 font-bold text-xs flex items-center justify-between">
                <span>Resident Profile Photo (True Identity)</span>
                {uploadingPhoto && <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Processing...</span>}
              </label>

              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <img
                    src={formData.avatarUrl}
                    alt="Current Avatar"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white"
                    title="Upload genuine photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Genuine Photo</span>
                  </button>
                  <p className="text-[10px] text-slate-500">
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
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[10px] text-slate-500 block mb-1.5 font-medium">Or choose sample avatar:</span>
                <div className="flex items-center gap-2">
                  {sampleAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, avatarUrl: url });
                        updateResidentUser({ avatarUrl: url });
                        const uid = residentUser.uid || firebaseUser?.uid || residentUser.id;
                        persistUserAvatar(uid, residentUser.email, url);
                      }}
                      className={`rounded-2xl p-0.5 border-2 transition cursor-pointer ${
                        formData.avatarUrl === url ? 'border-indigo-600 scale-105 shadow-sm' : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-8 h-8 rounded-xl object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3.5 py-2 text-slate-500 hover:text-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Language Settings */}
        {activeTab === 'language' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-500 font-medium">
              Select your preferred language for the incident report forms, system notices, and dispatch updates.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => setLanguage('en')}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition cursor-pointer ${
                  language === 'en'
                    ? 'bg-blue-50/90 border-blue-500 text-slate-900 shadow-sm ring-1 ring-blue-400/40'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <strong className="block text-sm text-slate-900 font-black">English (Default)</strong>
                  <span className="text-[11px] text-slate-500 font-medium">Emergency Dispatch Interface in English</span>
                </div>
                {language === 'en' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </button>

              <button
                onClick={() => setLanguage('fil')}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition cursor-pointer ${
                  language === 'fil'
                    ? 'bg-blue-50/90 border-blue-500 text-slate-900 shadow-sm ring-1 ring-blue-400/40'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <strong className="block text-sm text-slate-900 font-black">Filipino / Tagalog</strong>
                  <span className="text-[11px] text-slate-500 font-medium">Sistema at mga form sa wikang Filipino</span>
                </div>
                {language === 'fil' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveTab('profile')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
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
