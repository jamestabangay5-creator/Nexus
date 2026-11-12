import React, { useState, useEffect } from 'react';
import { useNexus } from '../../../context/NexusContext';
import { PatrolUnit, FireApparatus, MedicalUnit, AgencyScope } from '../../../types';
import {
  Car,
  Truck,
  Activity,
  Ambulance,
  Phone,
  Radio,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  X,
  Save,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agencyType: 'PNP' | 'BFP' | 'MDRRMO';
  unitToEdit?: PatrolUnit | FireApparatus | MedicalUnit | null;
}

export const ResourceEditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  agencyType,
  unitToEdit,
}) => {
  const {
    savePatrolUnit,
    deletePatrolUnit,
    saveFireApparatus,
    deleteFireApparatus,
    saveMedicalUnit,
    deleteMedicalUnit,
  } = useNexus();

  const isEditing = !!unitToEdit;

  // Form Fields
  const [callSign, setCallSign] = useState('');
  const [divisionOrStation, setDivisionOrStation] = useState('');
  const [sectorOrBase, setSectorOrBase] = useState('');
  const [status, setStatus] = useState<string>('Standby');
  const [officerInCharge, setOfficerInCharge] = useState('');
  const [driverName, setDriverName] = useState('');
  const [crewMembers, setCrewMembers] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [shift, setShift] = useState('Morning Duty (06:00 - 14:00)');
  const [scheduledDispatch, setScheduledDispatch] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [waterLevelPercent, setWaterLevelPercent] = useState<number>(100);
  const [specificType, setSpecificType] = useState<string>('');

  // Sync state with unitToEdit
  useEffect(() => {
    if (unitToEdit) {
      setCallSign(unitToEdit.callSign || '');
      if (agencyType === 'PNP') {
        const u = unitToEdit as PatrolUnit;
        setDivisionOrStation(u.division || '');
        setSectorOrBase(u.sector || '');
        setStatus(u.status || 'On Patrol');
        setOfficerInCharge(u.officerInCharge || '');
        setDriverName(u.driverName || '');
        setCrewMembers(u.crewMembers || '');
        setContactNumber(u.contactNumber || '');
        setShift(u.shift || 'Morning Duty (06:00 - 14:00)');
        setScheduledDispatch(u.scheduledDispatch || '');
        setVehiclePlate(u.vehiclePlate || '');
      } else if (agencyType === 'BFP') {
        const u = unitToEdit as FireApparatus;
        setDivisionOrStation(u.station || '');
        setSpecificType(u.type || 'Pumper Engine');
        setStatus(u.status || 'In Station');
        setWaterLevelPercent(u.waterLevelPercent !== undefined ? u.waterLevelPercent : 100);
        setOfficerInCharge(u.officerInCharge || '');
        setDriverName(u.driverName || '');
        setCrewMembers(u.crewMembers || '');
        setContactNumber(u.contactNumber || '');
        setShift(u.shift || '24-Hour Duty Shift A');
        setScheduledDispatch(u.scheduledDispatch || '');
        setVehiclePlate(u.vehiclePlate || '');
      } else if (agencyType === 'MDRRMO') {
        const u = unitToEdit as MedicalUnit;
        setSectorOrBase(u.base || '');
        setSpecificType(u.type || 'Type-1 Ambulance');
        setStatus(u.status || 'Available');
        setOfficerInCharge(u.paramedicLead || '');
        setDriverName(u.driverName || '');
        setCrewMembers(u.crewMembers || '');
        setContactNumber(u.contactNumber || '');
        setShift(u.shift || 'Morning Shift (06:00 - 14:00)');
        setScheduledDispatch(u.scheduledDispatch || '');
        setVehiclePlate(u.vehiclePlate || '');
      }
    } else {
      // Defaults for adding new unit
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      if (agencyType === 'PNP') {
        setCallSign(`Mobile Unit Alpha-${randomSuffix}`);
        setDivisionOrStation('Calapan City Police Station');
        setSectorOrBase('Poblacion Commercial Sector');
        setStatus('On Patrol');
        setOfficerInCharge('PO3 Responding Officer');
        setDriverName('PO1 Unit Driver');
        setCrewMembers('2 Field Patrolmen');
        setContactNumber('0917-889-0000 / VHF 142.50 MHz');
        setShift('Morning Duty (06:00 - 14:00)');
        setScheduledDispatch('Scheduled: High-visibility patrol & rapid dispatch response');
        setVehiclePlate(`PNP-${randomSuffix}`);
      } else if (agencyType === 'BFP') {
        setCallSign(`Engine ${randomSuffix}`);
        setSpecificType('Pumper Engine');
        setDivisionOrStation('Calapan Central Fire Station');
        setStatus('In Station');
        setWaterLevelPercent(100);
        setOfficerInCharge('SFO1 Fire Ground Commander');
        setDriverName('FO1 Pump Driver');
        setCrewMembers('4 Hose & Nozzle Crew');
        setContactNumber('0920-554-0000 / VHF 145.20 MHz');
        setShift('24-Hour Duty Shift A');
        setScheduledDispatch('Ready: Immediate dispatch on fire incident report');
        setVehiclePlate(`BFP-${randomSuffix}`);
      } else if (agencyType === 'MDRRMO') {
        setCallSign(`Rescue Medic-${randomSuffix}`);
        setSpecificType('Type-1 Ambulance');
        setSectorOrBase('Calapan City DRRM Operations Base');
        setStatus('Available');
        setOfficerInCharge('Nurse Paramedic Lead');
        setDriverName('EMS Ambulance Driver');
        setCrewMembers('2 Emergency Medical Responders');
        setContactNumber('0918-334-0000 / VHF 148.10 MHz');
        setShift('Morning Shift (06:00 - 14:00)');
        setScheduledDispatch('Scheduled: Active trauma standby & emergency transit');
        setVehiclePlate(`MDR-${randomSuffix}`);
      }
    }
  }, [unitToEdit, agencyType, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (agencyType === 'PNP') {
      const unit: PatrolUnit = {
        id: unitToEdit?.id || `patrol-${Date.now()}`,
        callSign: callSign.trim() || 'Mobile Patrol Unit',
        division: divisionOrStation.trim() || 'Calapan Police',
        sector: sectorOrBase.trim() || 'Poblacion',
        status: status as PatrolUnit['status'],
        officerInCharge: officerInCharge.trim() || 'Officer in Charge',
        driverName: driverName.trim(),
        crewMembers: crewMembers.trim(),
        contactNumber: contactNumber.trim(),
        shift: shift.trim(),
        scheduledDispatch: scheduledDispatch.trim(),
        vehiclePlate: vehiclePlate.trim(),
      };
      savePatrolUnit(unit);
    } else if (agencyType === 'BFP') {
      const unit: FireApparatus = {
        id: unitToEdit?.id || `engine-${Date.now()}`,
        callSign: callSign.trim() || 'Fire Apparatus',
        type: (specificType || 'Pumper Engine') as FireApparatus['type'],
        station: divisionOrStation.trim() || 'Calapan Fire Station',
        status: status as FireApparatus['status'],
        waterLevelPercent: Number(waterLevelPercent) || 0,
        officerInCharge: officerInCharge.trim() || 'Fire Marshal',
        driverName: driverName.trim(),
        crewMembers: crewMembers.trim(),
        contactNumber: contactNumber.trim(),
        shift: shift.trim(),
        scheduledDispatch: scheduledDispatch.trim(),
        vehiclePlate: vehiclePlate.trim(),
      };
      saveFireApparatus(unit);
    } else if (agencyType === 'MDRRMO') {
      const unit: MedicalUnit = {
        id: unitToEdit?.id || `medic-${Date.now()}`,
        callSign: callSign.trim() || 'Medical Ambulance',
        type: (specificType || 'Type-1 Ambulance') as MedicalUnit['type'],
        base: sectorOrBase.trim() || 'DRRM Base',
        status: status as MedicalUnit['status'],
        paramedicLead: officerInCharge.trim() || 'EMT Lead',
        driverName: driverName.trim(),
        crewMembers: crewMembers.trim(),
        contactNumber: contactNumber.trim(),
        shift: shift.trim(),
        scheduledDispatch: scheduledDispatch.trim(),
        vehiclePlate: vehiclePlate.trim(),
      };
      saveMedicalUnit(unit);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!unitToEdit) return;
    if (confirm(`Are you sure you want to retire or delete ${unitToEdit.callSign}?`)) {
      if (agencyType === 'PNP') deletePatrolUnit(unitToEdit.id);
      else if (agencyType === 'BFP') deleteFireApparatus(unitToEdit.id);
      else if (agencyType === 'MDRRMO') deleteMedicalUnit(unitToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in overflow-y-auto">
      <div className="glass-card bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl shadow-slate-300/60 relative text-slate-800 my-auto overflow-hidden">
        {/* Relevant Ambient Glow and Resource Equipment Watermark */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-2 bottom-2 pointer-events-none opacity-[0.04] select-none">
          {agencyType === 'PNP' && <Car className="w-64 h-64 text-blue-900" />}
          {agencyType === 'BFP' && <Truck className="w-64 h-64 text-orange-900" />}
          {agencyType === 'MDRRMO' && <Ambulance className="w-64 h-64 text-emerald-900" />}
        </div>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
          <div className={`p-2.5 rounded-2xl ${
            agencyType === 'PNP'
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : agencyType === 'BFP'
              ? 'bg-orange-50 text-orange-600 border border-orange-200'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}>
            {agencyType === 'PNP' && <Car className="w-6 h-6" />}
            {agencyType === 'BFP' && <Truck className="w-6 h-6" />}
            {agencyType === 'MDRRMO' && <Ambulance className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {isEditing ? `Edit ${unitToEdit.callSign}` : `Add New ${agencyType} Resource`}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Configure personnel on duty, driver, emergency contact, shift schedule, and dispatch status.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit Call Sign & Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Unit Callsign / Name *
              </label>
              <input
                type="text"
                required
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                placeholder="e.g. Mobile Unit Alpha-1"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-bold shadow-2xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Vehicle Plate / Registration
              </label>
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="e.g. PNP-101-MIM"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono shadow-2xs"
              />
            </div>
          </div>

          {/* Department Specific Details (Sector, Station, Sub-type, Water Level) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agencyType === 'PNP' && (
              <>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Police Division / Station
                  </label>
                  <input
                    type="text"
                    value={divisionOrStation}
                    onChange={(e) => setDivisionOrStation(e.target.value)}
                    placeholder="e.g. Calapan City Police Station"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Assigned Sector / Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={sectorOrBase}
                    onChange={(e) => setSectorOrBase(e.target.value)}
                    placeholder="e.g. Poblacion Commercial District"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>
              </>
            )}

            {agencyType === 'BFP' && (
              <>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Apparatus Type
                  </label>
                  <select
                    value={specificType}
                    onChange={(e) => setSpecificType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs font-semibold"
                  >
                    <option value="Pumper Engine">Pumper Engine (Fire Extinguishment)</option>
                    <option value="Water Tanker">Water Tanker (10,000L Shuttle Supply)</option>
                    <option value="Ladder Truck">Ladder Truck (Aerial Rescue)</option>
                    <option value="Rescue Truck">Rescue Truck (Vehicular Extrication)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Fire Station Headquarters
                  </label>
                  <input
                    type="text"
                    value={divisionOrStation}
                    onChange={(e) => setDivisionOrStation(e.target.value)}
                    placeholder="e.g. Calapan Central Fire Station"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
              </>
            )}

            {agencyType === 'MDRRMO' && (
              <>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Medical & Rescue Unit Type
                  </label>
                  <select
                    value={specificType}
                    onChange={(e) => setSpecificType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs font-semibold"
                  >
                    <option value="Type-1 Ambulance">Type-1 Advanced Life Support Ambulance</option>
                    <option value="Rescue Boat">Rescue Boat (Flood / Riverine SAR)</option>
                    <option value="SAR Quick Response">Heavy SAR Extraction Truck</option>
                    <option value="Patient Transport">Basic Life Support Patient Transport</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Operations Base / Station
                  </label>
                  <input
                    type="text"
                    value={sectorOrBase}
                    onChange={(e) => setSectorOrBase(e.target.value)}
                    placeholder="e.g. Calapan City DRRM Operations Base"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </>
            )}
          </div>

          {/* Water level slider for BFP */}
          {agencyType === 'BFP' && (
            <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-bold text-slate-700">Water Tank Readiness Level</span>
                <span className="font-mono font-bold text-orange-600">{waterLevelPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={waterLevelPercent}
                onChange={(e) => setWaterLevelPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          )}

          {/* Section: Who uses & Scheduled to be Dispatched */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 font-bold block">
              Personnel Assignment & Active Crew
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  {agencyType === 'PNP' ? 'Officer in Charge (OIC)' : agencyType === 'BFP' ? 'Team Commander' : 'Paramedic Lead'} *
                </label>
                <input
                  type="text"
                  required
                  value={officerInCharge}
                  onChange={(e) => setOfficerInCharge(e.target.value)}
                  placeholder="e.g. Lt. D. Navarro"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Designated Driver / Operator
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. PO2 J. Ramos / Driver"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Additional Responders / Crew Members
              </label>
              <input
                type="text"
                value={crewMembers}
                onChange={(e) => setCrewMembers(e.target.value)}
                placeholder="e.g. Pat. A. Cruz, Pat. B. Reyes (2 Patrolmen)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Section: Contact & Scheduled Dispatch */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-bold block">
              Emergency Contact & Dispatch Schedule
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-red-500" />
                  <span>Contact Phone / Radio Callsign *</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 0917-889-1101 / VHF 142.50 MHz"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Duty Shift Schedule</span>
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs font-semibold"
                >
                  <option value="Morning Duty (06:00 - 14:00)">Morning Duty (06:00 - 14:00)</option>
                  <option value="Afternoon Duty (14:00 - 22:00)">Afternoon Duty (14:00 - 22:00)</option>
                  <option value="Night Duty (22:00 - 06:00)">Night Duty (22:00 - 06:00)</option>
                  <option value="Day Shift (08:00 - 17:00)">Day Shift (08:00 - 17:00)</option>
                  <option value="24-Hour Active Duty">24-Hour Active Duty</option>
                  <option value="On-Call Emergency Standby">On-Call Emergency Standby</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Scheduled Dispatch / Area Deployment Notes
              </label>
              <input
                type="text"
                value={scheduledDispatch}
                onChange={(e) => setScheduledDispatch(e.target.value)}
                placeholder="e.g. Scheduled for Calapan commercial district roving and bank escort"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* Current Operational Status */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Current Readiness Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-bold shadow-2xs"
              >
                {agencyType === 'PNP' && (
                  <>
                    <option value="On Patrol">On Patrol (Actively Roving)</option>
                    <option value="Dispatched">Dispatched (Responding to Citizen Report)</option>
                    <option value="Standby">Standby (At Station Ready to Roll)</option>
                    <option value="Maintenance">Maintenance (Service / Repair)</option>
                  </>
                )}
                {agencyType === 'BFP' && (
                  <>
                    <option value="In Station">In Station (Ready to Roll)</option>
                    <option value="En Route">En Route (Responding to Fire Alarm)</option>
                    <option value="On Scene">On Scene (Fire Ground Operations)</option>
                    <option value="Maintenance">Maintenance (Water Pump / Ladder Service)</option>
                    <option value="Standby">Standby</option>
                  </>
                )}
                {agencyType === 'MDRRMO' && (
                  <>
                    <option value="Available">Available (Operations Base Ready)</option>
                    <option value="Dispatched">Dispatched (En Route to Patient)</option>
                    <option value="Patient Transit">Patient Transit (En Route to Hospital)</option>
                    <option value="Hospital Turnover">Hospital Turnover (Handing over Patient)</option>
                    <option value="Maintenance">Maintenance</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Unit</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer ${
                  agencyType === 'PNP'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
                    : agencyType === 'BFP'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-orange-500/20'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Create Unit'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

