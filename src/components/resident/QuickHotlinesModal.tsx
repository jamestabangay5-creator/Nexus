import React, { useEffect } from 'react';
import { useNexus } from '../../context/NexusContext';
import { TRANSLATIONS } from '../../constants/translations';
import {
  Phone,
  PhoneCall,
  ShieldAlert,
  Flame,
  Activity,
  HeartPulse,
  Radio,
  X,
  Shield,
  LifeBuoy
} from 'lucide-react';

export const QuickHotlinesModal: React.FC = () => {
  const { isHotlinesModalOpen, closeHotlinesModal, language, agencyDetails } = useNexus();
  const t = TRANSLATIONS[language];

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHotlinesModalOpen) closeHotlinesModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHotlinesModalOpen, closeHotlinesModal]);

  if (!isHotlinesModalOpen) return null;

  const hotlines = [
    {
      agency: 'NATIONAL 911',
      name: 'National Emergency Hotline',
      number: '911',
      tel: 'tel:911',
      desc: 'All Emergencies · Centralized Voice Dispatch',
      color: 'bg-red-500/20 text-red-400 border-red-500/40',
      btnColor: 'bg-red-600 hover:bg-red-500 text-white',
      icon: Radio,
      logo: '/logos/central.png',
      pulse: true,
    },
    {
      agency: 'PNP POLICE',
      name: 'Philippine National Police',
      number: agencyDetails?.PNP?.hotline || '911 / (02) 8722-0650',
      tel: 'tel:0287220650',
      desc: 'Law Enforcement · Crime & Armed Threat',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      btnColor: 'bg-blue-600 hover:bg-blue-500 text-white',
      icon: ShieldAlert,
      logo: '/logos/pnp.svg',
      pulse: false,
    },
    {
      agency: 'BFP FIRE',
      name: 'Bureau of Fire Protection',
      number: agencyDetails?.BFP?.hotline || '160 / (02) 8426-0219',
      tel: 'tel:0284260219',
      desc: 'Fire Suppression · Hazmat · Extrication',
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      btnColor: 'bg-orange-600 hover:bg-orange-500 text-white',
      icon: Flame,
      logo: '/logos/bfp.png',
      pulse: false,
    },
    {
      agency: 'MDRRMO / RESCUE',
      name: 'Disaster Risk & Emergency Medical',
      number: agencyDetails?.MDRRMO?.hotline || '122 / (02) 8928-1111',
      tel: 'tel:0289281111',
      desc: 'Typhoon, Flood, Landslide & Paramedic Ambulance',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      icon: Activity,
      logo: '/logos/mdrrmo.svg',
      pulse: false,
    },
    {
      agency: 'RED CROSS',
      name: 'Philippine Red Cross (Oriental Mindoro)',
      number: '143 / (043) 288-2144',
      tel: 'tel:0432882144',
      desc: 'Blood Bank, First Aid & Disaster Relief',
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      btnColor: 'bg-rose-600 hover:bg-rose-500 text-white',
      icon: HeartPulse,
      pulse: false,
    },
    {
      agency: 'COAST GUARD',
      name: 'Philippine Coast Guard Calapan Station',
      number: '(02) 8527-8481',
      tel: 'tel:0285278481',
      desc: 'Maritime Search & Rescue, Sea Emergencies',
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      btnColor: 'bg-cyan-600 hover:bg-cyan-500 text-white',
      icon: LifeBuoy,
      pulse: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in">
      <div className="glass-card bg-white/95 backdrop-blur-2xl border border-white/90 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl shadow-slate-300/60 relative text-slate-800 max-h-[85vh] overflow-y-auto">
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 shadow-xs">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Oriental Mindoro Emergency Hotlines
              </h3>
              <p className="text-xs text-slate-500">
                1-tap direct voice dispatch. 24/7 active emergency lines.
              </p>
            </div>
          </div>
          <button
            onClick={closeHotlinesModal}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hotlines List */}
        <div className="space-y-3 pt-4">
          {hotlines.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 transition hover:border-slate-300 hover:bg-white shadow-2xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-1.5 rounded-xl border ${item.color} bg-white shrink-0 flex items-center justify-center w-11 h-11 shadow-2xs`}>
                    {item.logo ? (
                      <img src={item.logo} alt={item.agency} className="w-8 h-8 object-contain" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        {item.agency}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                    <span className="text-xs font-mono font-black text-rose-600 block mt-0.5">
                      {item.number}
                    </span>
                  </div>
                </div>

                <a
                  href={item.tel}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 ${item.btnColor}`}
                  title={`Call ${item.name}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            onClick={closeHotlinesModal}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Hotline Directory
          </button>
        </div>
      </div>
    </div>
  );
};

