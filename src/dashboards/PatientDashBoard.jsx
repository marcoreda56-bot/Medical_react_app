import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorAPI, appointmentAPI, specialtyAPI } from '../services/api';
import Swal from 'sweetalert2';

const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getSpecialtyName = (doctorProfile) => {
    return doctorProfile?.specialty_name || 'Specialist';
};

const getSpecialtyId = (doctorProfile) => {
    const sp = doctorProfile?.specialty;
    if (!sp) return null;
    if (typeof sp === 'object') return Number(sp.id);
    return Number(sp);
};

export const PatientDashBoard = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    const [doctors, setDoctors] = useState([]);
    const [allSlots, setAllSlots] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);

    const [selectedDayForDoc, setSelectedDayForDoc] = useState({});
    const [openSlotDropdown, setOpenSlotDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [openModal, setOpenModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [doctorModalOpen, setDoctorModalOpen] = useState(false);
    const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [specialties, setSpecialties] = useState([]);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayStr = toLocalDateStr(new Date());

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpenSlotDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadPatientData = async () => {
        if (!currentUser) return;
        try {
            const [specRes, docRes, slotRes, appRes] = await Promise.all([
                specialtyAPI.getSpecialties(),
                doctorAPI.getApprovedDoctors(),
                doctorAPI.getAvailableSlots(),
                appointmentAPI.getMyAppointments(),
            ]);

            setSpecialties(specRes.data);
            setDoctors(docRes.data);
            setAllSlots(slotRes.data);

            const initialDays = {};
            docRes.data.forEach((docItem) => {
                const docSlots = slotRes.data.filter((s) => {
                    const sDocId = s.doctor && typeof s.doctor === 'object'
                        ? Number(s.doctor.id)
                        : Number(s.doctor || s.doctor_id);
                    return sDocId === Number(docItem.id);
                });
                if (docSlots.length > 0) {
                    const todaySlot = docSlots.find(s => s.date === todayStr);
                    initialDays[docItem.id] = todaySlot ? todayStr : docSlots[0].date;
                }
            });
            setSelectedDayForDoc(initialDays);

            const unique = Object.values(
                (appRes.data || []).reduce((acc, app) => { acc[app.id] = app; return acc; }, {})
            );
            setMyAppointments(unique);
        } catch (err) {
            console.error('Error loading data:', err);
            Toast.fire({ icon: 'error', title: 'Failed to fetch data from server.' });
        }
    };

    useEffect(() => { loadPatientData(); }, [currentUser]);

    const handleBookSlot = async (doctor, slot) => {
        const doctorName = `${doctor.first_name} ${doctor.last_name}`.trim() || 'Doctor';
        const amount = Number(doctor.doctor_profile?.consultation_fee) || 250;
        const dayLabel = slot.date;
        const displayTime = slot.start_time || slot.time?.split(' - ')[0] || slot.time;

        const result = await Swal.fire({
            title: 'Pay & Book Appointment',
            html: `
                <div style="text-align:left;" class="space-y-4 text-sm text-gray-700 font-sans">
                    <div style="margin-bottom: 12px; line-height: 1.6;">
                        <p style="margin: 0; color: #1e293b;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
                        <p style="margin: 0; color: #1e293b;"><strong>Appointment:</strong> ${dayLabel} at ${displayTime}</p>
                    </div>

                    <div style="background-color: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                        <p style="font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Fee Breakdown:</p>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                            <span style="color: #64748b;">Consultation Fee:</span>
                            <span style="font-weight: 600; color: #0f172a;">${amount.toFixed(2)} EGP</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                            <span style="color: #64748b;">Website Share (10%):</span>
                            <span style="font-weight: 600; color: #64748b;">${(amount * 0.1).toFixed(2)} EGP</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                            <span style="color: #64748b;">Doctor Payout (90%):</span>
                            <span style="font-weight: 600; color: #64748b;">${(amount * 0.9).toFixed(2)} EGP</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 6px;">
                            <span style="color: #0f172a;">Total Amount to Pay:</span>
                            <span style="color: #0f172a; font-size: 15px;">${amount.toFixed(2)} EGP</span>
                        </div>
                    </div>
                    

                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />

                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div>
                            <label style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Cardholder Name</label>
                            <input id="payment-card-name" class="swal2-input" placeholder="Cardholder name" value="John Doe" style="width:100%; margin: 0; padding: 10px; height: auto; box-sizing: border-box;" />
                        </div>
                        <div>
                            <label style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Card Number</label>
                            <input id="payment-card-number" class="swal2-input" placeholder="Card number" value="4242 4242 4242 4242" maxlength="19" style="width:100%; margin: 0; padding: 10px; height: auto; box-sizing: border-box;" />
                        </div>
                        <div style="display:flex; gap:8px;">
                            <div style="flex:1;">
                                <label style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Expiry Date</label>
                                <input id="payment-card-expiry" class="swal2-input" placeholder="MM/YY" value="12/30" maxlength="5" style="width:100%; margin: 0; padding: 10px; height: auto; box-sizing: border-box;" />
                            </div>
                            <div style="flex:1;">
                                <label style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">CVV</label>
                                <input id="payment-card-cvv" class="swal2-input" placeholder="CVV" value="123" maxlength="4" type="password" style="width:100%; margin: 0; padding: 10px; height: auto; box-sizing: border-box;" />
                            </div>
                        </div>
                    </div>

                    <p style="font-size: 11px; color: #64748b; margin-top: 12px; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                        <span>💡</span> Test details are pre-filled for offline mock payment validation.
                    </p>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: `Pay ${amount} EGP & Book`,
            cancelButtonText: 'Cancel',
            focusConfirm: false,
            preConfirm: () => {
                const cardName = document.getElementById('payment-card-name')?.value.trim();
                const cardNumber = document.getElementById('payment-card-number')?.value.replace(/\s/g, '');
                const expiry = document.getElementById('payment-card-expiry')?.value.trim();
                const cvv = document.getElementById('payment-card-cvv')?.value.trim();
                if (!cardName || !cardNumber || !expiry || !cvv) {
                    Swal.showValidationMessage('Please complete all payment fields.');
                    return false;
                }
                return { last4: cardNumber.slice(-4) };
            },
        });

        if (result.isConfirmed) {
            try {
                await appointmentAPI.book({
                    slot_id: slot.id,
                    doctor_id: doctor.id,
                    consultation_fee: amount,
                    payment_card_last4: result.value?.last4 || '',
                });
                Swal.fire('Booked!', 'Your appointment has been successfully booked.', 'success');
                setOpenSlotDropdown(null);
                loadPatientData();
            } catch (err) {
                Swal.fire('Booking Failed', err.response?.data?.error || err.message || 'This slot might already be taken.', 'error');
            }
        }
    };

    const handleCancelAppointment = async (app) => {
        const result = await Swal.fire({
            title: 'Cancel Appointment?',
            text: `Are you sure you want to cancel your reservation with Dr. ${app.doctor_name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, cancel it',
            cancelButtonText: 'Go Back',
        });
        if (!result.isConfirmed) return;
        try {
            await appointmentAPI.cancelAppointment(app.id, 'Cancelled by patient.');
            Toast.fire({ icon: 'success', title: 'Appointment cancelled successfully.' });
            loadPatientData();
        } catch (err) {
            Toast.fire({ icon: 'error', title: err.response?.data?.error || 'Failed to cancel the appointment.' });
        }
    };

    const filteredDoctors = doctors.filter((docItem) => {
        const fullName = `${docItem.first_name} ${docItem.last_name}`.toLowerCase();
        const matchesSearch =
            fullName.includes(searchQuery.toLowerCase()) ||
            (docItem.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = !selectedSpecialty ||
            getSpecialtyId(docItem.doctor_profile) === Number(selectedSpecialty);
        return matchesSearch && matchesSpecialty;
    });

    const statusStyles = {
        Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        Confirmed: 'bg-sky-50 text-sky-700 border border-sky-100',
        Pending: 'bg-amber-50 text-amber-700 border border-amber-100',
        Cancelled: 'bg-red-50 text-red-600 border border-red-100',
        Rejected:  'bg-red-50 text-red-600 border border-red-100',
    };

    const fmtDate = (ds) => {
        if (!ds) return 'N/A';
        const d = new Date(ds + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const DocDayStrip = ({ docItem, uniqueDates, currentSelectedDate }) => (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {uniqueDates.map((dateVal) => {
                const d = new Date(dateVal + 'T00:00:00');
                const isActive = currentSelectedDate === dateVal;
                const isToday = dateVal === todayStr;
                return (
                    <button
                        key={dateVal}
                        onClick={() => setSelectedDayForDoc(prev => ({ ...prev, [docItem.id]: dateVal }))}
                        className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer min-w-[52px]
                            ${isActive
                                ? 'bg-[#0f172a] border-[#0f172a]'
                                : 'bg-[#f8f9fb] border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                            }`}
                    >
                        <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                            {isToday ? 'Today' : DAY_ABBR[d.getDay()]}
                        </span>
                        <span className={`text-base font-bold leading-tight ${isActive ? 'text-white' : 'text-[#0f172a]'}`}>
                            {d.getDate()}
                        </span>
                        <span className={`text-[10px] ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                            {d.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                    </button>
                );
            })}
        </div>
    );

    const SlotDropdown = ({ docItem, slotsForSelectedDay }) => {
        const isOpen = openSlotDropdown === docItem.id;
        const available = slotsForSelectedDay.length;

        return (
            <div className="relative" ref={isOpen ? dropdownRef : null}>
                <button
                    onClick={() => setOpenSlotDropdown(isOpen ? null : docItem.id)}
                    disabled={available === 0}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer
                        ${available === 0
                            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                            : isOpen
                                ? 'bg-[#0f172a] border-[#0f172a] text-white'
                                : 'bg-white border-slate-200 text-[#0f172a] hover:border-slate-300 hover:bg-slate-50'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <span>🕐</span>
                        {available === 0 ? 'No slots available' : `${available} slot${available > 1 ? 's' : ''} available`}
                    </span>
                    {available > 0 && (
                        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </button>

                {isOpen && available > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                        <div className="p-2 max-h-52 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
                            {slotsForSelectedDay.map((slot) => {
                                const displayTime = slot.start_time || slot.time?.split(' - ')[0] || slot.time;
                                const endTime = slot.end_time || slot.time?.split(' - ')[1] || '';
                                return (
                                    <button
                                        key={slot.id}
                                        onClick={() => handleBookSlot(docItem, slot)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#0f172a] hover:text-white group transition-all cursor-pointer text-left"
                                    >
                                        <span className="text-sm font-semibold text-[#0f172a] group-hover:text-white">
                                            {displayTime}
                                            {endTime && <span className="font-normal text-slate-400 group-hover:text-slate-300"> – {endTime}</span>}
                                        </span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-white/20 group-hover:text-white border border-emerald-100 group-hover:border-transparent transition-all">
                                            Book
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[#1e293b] antialiased">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-7 border-b border-slate-200">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Patient Center</h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium">Book appointments and manage your health records.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                        Welcome back, {currentUser?.first_name || 'Patient'}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 gap-7">
                    {[
                        { label: 'Book Appointment', icon: '🏥' },
                        { label: 'My Bookings', icon: '📅' },
                    ].map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`pb-3.5 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 ${activeTab === i
                                    ? 'text-[#0f172a] border-b-2 border-[#0f172a]'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab 0: Book Appointment ── */}
                {activeTab === 0 && (
                    <div className="space-y-6">
                        {/* Search & Filter */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-sm">🔍</span>
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all placeholder:text-slate-400 font-medium"
                                    placeholder="Search doctor by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-60">
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-slate-600 cursor-pointer font-medium"
                                    value={selectedSpecialty}
                                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                                >
                                    <option value="">All Specialties</option>
                                    {specialties.map((spec) => (
                                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Doctors Grid */}
                        {filteredDoctors.length === 0 ? (
                            <div className="bg-white border border-slate-200/60 rounded-2xl py-20 text-center shadow-sm">
                                <p className="text-slate-500 text-sm font-semibold">No doctors found matching your search.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {filteredDoctors.map((docItem) => {
                                    const doctorSlots = allSlots.filter((s) => {
                                        const sDocId = s.doctor && typeof s.doctor === 'object'
                                            ? Number(s.doctor.id)
                                            : Number(s.doctor || s.doctor_id);
                                        return sDocId === Number(docItem.id);
                                    });

                                    const uniqueDates = [...new Set(doctorSlots.map((s) => s.date))].sort();
                                    const currentSelectedDate = selectedDayForDoc[docItem.id] || uniqueDates[0];
                                    const slotsForSelectedDay = doctorSlots
                                        .filter((s) => s.date === currentSelectedDate)
                                        .sort((a, b) => (a.start_time || a.time || '').localeCompare(b.start_time || b.time || ''));

                                    const specialtyName = getSpecialtyName(docItem.doctor_profile);
                                    const fee = Number(docItem.doctor_profile?.consultation_fee) || 250;
                                    const initials = (docItem.first_name?.charAt(0) || '') + (docItem.last_name?.charAt(0) || '');

                                    return (
                                        <div key={docItem.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col overflow-visible">
                                            {/* Doctor header */}
                                            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-13 h-13 rounded-xl bg-[#0f172a] flex items-center justify-center text-white text-base font-bold shrink-0 select-none" style={{ width: 52, height: 52 }}>
                                                        {initials.toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h3 className="text-sm font-bold text-[#0f172a] leading-tight">
                                                                    Dr. {docItem.first_name} {docItem.last_name}
                                                                </h3>
                                                                <span className="inline-block text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg mt-1">
                                                                    {specialtyName}
                                                                </span>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-base font-bold text-[#0f172a]">{fee} <span className="text-xs font-normal text-slate-400">EGP</span></p>
                                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">per session</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => { setSelectedDoctorProfile(docItem); setDoctorModalOpen(true); }}
                                                            className="text-[11px] text-slate-400 hover:text-[#0f172a] font-semibold mt-2 inline-flex items-center gap-1 transition-all cursor-pointer"
                                                        >
                                                            <span>ℹ️</span> View profile & bio
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Day strip */}
                                            <div className="px-5 pt-4 pb-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Select a date</p>
                                                {uniqueDates.length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic">No available dates.</p>
                                                ) : (
                                                    <DocDayStrip docItem={docItem} uniqueDates={uniqueDates} currentSelectedDate={currentSelectedDate} />
                                                )}
                                            </div>

                                            {/* Slot Dropdown */}
                                            <div className="px-5 pb-5 pt-1 relative">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Available times</p>
                                                <SlotDropdown docItem={docItem} slotsForSelectedDay={slotsForSelectedDay} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab 1: My Bookings ── */}
                {activeTab === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your booking history</p>
                            <span className="text-xs text-slate-500 font-semibold bg-white border border-slate-200 px-3 py-1 rounded-lg">
                                {myAppointments.length} total
                            </span>
                        </div>

                        {myAppointments.length === 0 ? (
                            <div className="bg-white border border-slate-200/60 rounded-2xl py-20 text-center shadow-sm">
                                <p className="text-slate-500 text-sm font-semibold">You haven't booked any appointments yet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {myAppointments.map((app) => {
                                    const slotDate = app.slot_details?.date;
                                    const slotTime = app.slot_details?.start_time || app.slot_details?.time;
                                    const canCancel = app.status === 'Pending' || app.status === 'Confirmed';

                                    return (
                                        <div key={app.id} className="bg-white border border-slate-200/60 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:border-slate-300 transition-all">
                                            {/* Date block */}
                                            <div className="min-w-[80px] text-center sm:text-left">
                                                <p className="text-base font-bold text-[#0f172a]">
                                                    {slotDate ? new Date(slotDate + 'T00:00:00').getDate() : '—'}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium leading-tight">
                                                    {slotDate ? new Date(slotDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                                                </p>
                                                {slotTime && <p className="text-xs font-bold text-[#0f172a] mt-1">{slotTime}</p>}
                                            </div>

                                            <div className="w-px h-10 bg-slate-100 hidden sm:block" />

                                            {/* Doctor info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-[#0f172a]">Dr. {app.doctor_name}</p>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    {fmtDate(slotDate)}{slotTime ? ` · ${slotTime}` : ''}
                                                </p>
                                            </div>

                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusStyles[app.status] || statusStyles.Pending}`}>
                                                {app.status}
                                            </span>

                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 border border-slate-200 whitespace-nowrap">
                                                {app.payment_status} · {app.consultation_fee} EGP
                                            </span>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {app.prescription ? (
                                                    <button
                                                        onClick={() => { setSelectedRecord(app); setOpenModal(true); }}
                                                        className="px-3 py-1.5 bg-[#0f172a] text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                                                    >
                                                        View Rx
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300 text-xs italic">No prescription</span>
                                                )}
                                                {canCancel && (
                                                    <button
                                                        onClick={() => handleCancelAppointment(app)}
                                                        className="px-3 py-1.5 bg-white text-red-500 border border-red-100 font-semibold text-xs rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Prescription Modal */}
            {openModal && selectedRecord && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-slate-100">
                        <h3 className="text-base font-bold text-[#0f172a] border-b border-slate-100 pb-3">Medical Prescription</h3>
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3 bg-[#fafafa] p-3 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-[11px] text-slate-500 block font-bold uppercase tracking-wide mb-1">Doctor</span>
                                    <span className="font-semibold text-slate-800">Dr. {selectedRecord.doctor_name}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block font-bold uppercase tracking-wide mb-1">Date</span>
                                    <span className="font-semibold text-slate-800">{fmtDate(selectedRecord.slot_details?.date)}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Prescription</span>
                                <div className="p-4 bg-emerald-50/40 border border-emerald-100/60 rounded-xl text-emerald-900 font-mono text-xs whitespace-pre-line leading-relaxed">
                                    {selectedRecord.prescription}
                                </div>
                            </div>
                            {selectedRecord.diagnosis && (
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Diagnosis</span>
                                    <p className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-700 text-xs leading-relaxed font-medium">
                                        {selectedRecord.diagnosis}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button onClick={() => setOpenModal(false)} className="px-5 py-2 bg-[#0f172a] text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer transition-all shadow-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Doctor Profile Modal */}
            {doctorModalOpen && selectedDoctorProfile && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-slate-100">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#0f172a] flex items-center justify-center text-white text-sm font-bold select-none">
                                {(selectedDoctorProfile.first_name?.charAt(0) || '') + (selectedDoctorProfile.last_name?.charAt(0) || '')}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#0f172a]">
                                    Dr. {selectedDoctorProfile.first_name} {selectedDoctorProfile.last_name}
                                </h3>
                                <span className="text-xs text-slate-500 font-semibold">
                                    {getSpecialtyName(selectedDoctorProfile.doctor_profile)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#fafafa] p-3 rounded-xl border border-slate-100 text-center">
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">Consultation Fee</p>
                                    <p className="text-lg font-bold text-[#0f172a]">{Number(selectedDoctorProfile.doctor_profile?.consultation_fee) || 250}</p>
                                    <p className="text-[11px] text-slate-500 font-medium">EGP / session</p>
                                </div>
                                <div className="bg-[#fafafa] p-3 rounded-xl border border-slate-100 text-center">
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">Contact</p>
                                    <p className="text-xs font-semibold text-[#0f172a] break-all">{selectedDoctorProfile.phone || selectedDoctorProfile.email || '—'}</p>
                                </div>
                            </div>

                            {selectedDoctorProfile.doctor_profile?.clinic_address && (
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">📍 Clinic Address</span>
                                    <p className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-700 text-xs leading-relaxed font-medium">
                                        {selectedDoctorProfile.doctor_profile.clinic_address}
                                    </p>
                                </div>
                            )}

                            <div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">📋 Biography</span>
                                <p className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-700 text-xs leading-relaxed font-medium">
                                    {selectedDoctorProfile.doctor_profile?.bio || 'No biography provided by the doctor.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button onClick={() => setDoctorModalOpen(false)} className="px-5 py-2 bg-[#0f172a] text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer transition-all shadow-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};