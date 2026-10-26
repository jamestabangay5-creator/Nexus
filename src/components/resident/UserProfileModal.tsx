import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { TRANSLATIONS } from '../../constants/translations';
import { BARANGAYS } from '../../constants/incidentData';
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
  ShieldCheck
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    residentUser,
    updateResidentUser,
    language,
    setLanguage,
    setActiveRole,
  } = useNexus();

  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'language'>('profile');

  // Edit form state
  const [formData, setFormData] = useState({
    name: residentUser.name,
    phone: residentUser.phone,
    email: residentUser.email,
    barangay: residentUser.barangay,
    address: residentUser.address,
    avatarUrl: residentUser.avatarUrl,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateResidentUser(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('profile');
    }, 1000);
  };

  const handleLogout = () => {
    onClose();
    // Switch to PNP Admin or reload state
    setActiveRole('PNP');
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
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
                <span className="text-xs text-slate-400 block">{residentUser.barangay}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full mt-1">
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
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Street Address:
                </span>
                <span className="text-slate-200">{residentUser.address}</span>
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

            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-slate-400 font-bold mb-1">Barangay</label>
                <select
                  value={formData.barangay}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {BARANGAYS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            {/* Quick avatar selection */}
            <div>
              <label className="block text-slate-400 font-bold mb-1">Choose Profile Photo</label>
              <div className="flex items-center gap-2">
                {sampleAvatars.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatarUrl: url })}
                    className={`rounded-full p-0.5 border-2 transition ${
                      formData.avatarUrl === url ? 'border-blue-500 scale-110' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt="preset" className="w-9 h-9 rounded-full object-cover" />
                  </button>
                ))}
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
