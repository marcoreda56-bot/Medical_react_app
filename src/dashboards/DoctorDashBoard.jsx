import { useState, useEffect } from 'react';
import { appointmentAPI, doctorAPI } from '../services/api';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DoctorReviews } from '../components/DoctorReviews';

const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const asArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
};

const normalizeStatus = (status) => {
    const value = String(status || 'Pending').toLowerCase();
    if (value === 'confirmed' || value === 'approved') return 'Confirmed';
    if (value === 'cancelled' || value === 'canceled' || value === 'rejected')
        return 'Cancelled';
    if (value === 'completed') return 'Completed';
    return 'Pending';
};

const buildSlotTime = (slot) => {
    if (!slot) return '';
    if (slot.time) return slot.time;
    if (slot.start_time && slot.end_time)
        return `${slot.start_time} - ${slot.end_time}`;
    return slot.start_time || '';
};

const getSlotDetails = (appointment) => {
    const slot = appointment.slot_details || appointment.slot || {};
    return {
        date:
            slot.date || appointment.date || appointment.appointment_date || '',
        day: slot.day || appointment.day || '',
        time: buildSlotTime(slot) || appointment.time || '',
    };
};

const getPatientName = (appointment) => {
    if (appointment.patient_name) return appointment.patient_name;
    const patient = appointment.patient_details || appointment.patient || {};
    const fullName =
        `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    return fullName || patient.name || patient.email || 'Anonymous Patient';
};

const normalizeAppointment = (appointment) => ({
    ...appointment,
    status: normalizeStatus(appointment.status),
    patient_name: getPatientName(appointment),
    slot_details: getSlotDetails(appointment),
});

export const DoctorDashBoard = () => {
    const [activeTab, setActiveTab] = useState('appointments');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();
    const [slots, setSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() =>
        toLocalDateStr(new Date())
    );
    const [selectedScheduleDate, setSelectedScheduleDate] = useState(() =>
        toLocalDateStr(new Date())
    );
    const [shiftForm, setShiftForm] = useState({
        date: '',
        startTime: '',
        workHours: '',
        duration: '30',
    });
    const [openModal, setOpenModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [medicalRecord, setMedicalRecord] = useState({
        diagnosis: '',
        prescription: '',
        doctor_notes: '',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);
    const { currentUser } = useAuth();

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = toLocalDateStr(today);

    const calendarDays = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
    });

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const appsRes = await appointmentAPI.getMyAppointments();
            const unique = Object.values(
                asArray(appsRes.data)
                    .map(normalizeAppointment)
                    .reduce((acc, app) => {
                        acc[app.id] = app;
                        return acc;
                    }, {})
            );
            const filtered = unique.filter((app) => {
                const appDate = getSlotDetails(app).date;
                return (
                    app.status === 'Completed' ||
                    !appDate ||
                    appDate >= todayStr
                );
            });
            setAppointments(filtered);

            const slotsRes = await doctorAPI.getMySlots();
            const filteredSlots = asArray(slotsRes.data).filter(
                (s) => !s.date || s.date >= todayStr
            );
            setSlots(filteredSlots);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            Toast.fire({
                icon: 'error',
                title: 'Failed to synchronize workspace.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleApproveAppointment = async (appId) => {
        try {
            await appointmentAPI.approveAppointment(appId);
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === appId ? { ...a, status: 'Confirmed' } : a
                )
            );
            Toast.fire({
                icon: 'success',
                title: 'Appointment approved successfully.',
            });
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: 'Action failed.' });
        }
    };

    const handleCancelAppointment = async (appId) => {
        const { value: reason } = await Swal.fire({
            title: 'Cancel Appointment?',
            text: 'Please provide a reason for cancellation. This will be emailed to the patient along with their refund confirmation.',
            input: 'textarea',
            inputPlaceholder: 'Enter cancellation reason here...',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, cancel & refund',
            cancelButtonText: 'Go Back',
            customClass: {
                confirmButton: 'cursor-pointer rounded-xl',
                cancelButton: 'cursor-pointer rounded-xl',
            },
            inputValidator: (v) =>
                !v || !v.trim()
                    ? 'You must provide a reason for cancellation!'
                    : undefined,
        });
        if (!reason) return;
        try {
            const response = await appointmentAPI.cancelAppointment(
                appId,
                reason
            );
            const updatedData = response.data?.appointment || response.data;
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === appId
                        ? { ...a, ...updatedData, status: 'Cancelled' }
                        : a
                )
            );
            Toast.fire({
                icon: 'success',
                title:
                    response.data.message ||
                    'Appointment cancelled and refunded.',
            });
        } catch (err) {
            console.error(err);
            Toast.fire({
                icon: 'error',
                title:
                    err.response?.data?.error ||
                    'Failed to process cancellation.',
            });
        }
    };

    const handleOpenCompleteModal = (appointment) => {
        setSelectedAppointment(appointment);
        setOpenModal(true);
    };

    const handleCompleteAppointment = async (e) => {
        e.preventDefault();
        if (
            !medicalRecord.diagnosis.trim() ||
            !medicalRecord.prescription.trim()
        ) {
            Swal.fire({
                icon: 'error',
                title: 'Required Fields Missing',
                text: 'Please fill in both diagnosis and prescription.',
                confirmButtonColor: '#0f172a',
            });
            return;
        }
        try {
            await appointmentAPI.completeAppointment(selectedAppointment.id, {
                diagnosis: medicalRecord.diagnosis,
                prescription: medicalRecord.prescription,
                doctor_notes: medicalRecord.doctor_notes,
            });
            setOpenModal(false);
            setMedicalRecord({
                diagnosis: '',
                prescription: '',
                doctor_notes: '',
            });
            Swal.fire({
                icon: 'success',
                title: 'Session Archived',
                text: 'Medical records stored successfully.',
                confirmButtonColor: '#0f172a',
            });
            await loadDashboardData();
        } catch (err) {
            console.error(err);
            Toast.fire({
                icon: 'error',
                title: 'Failed to archive consultation.',
            });
        }
    };

    const handleDeleteSlot = async (slotId) => {
        try {
            await doctorAPI.deleteSlot(slotId);
            Toast.fire({ icon: 'success', title: 'Slot removed.' });
            loadDashboardData();
        } catch {
            Toast.fire({
                icon: 'error',
                title: 'Cannot delete an actively booked slot.',
            });
        }
    };

    const handleGenerateShift = async (e) => {
        e.preventDefault();
        const { date, startTime, workHours, duration } = shiftForm;
        if (!date || !startTime || !workHours || !duration) {
            Swal.fire({
                icon: 'error',
                title: 'Incomplete Parameters',
                text: 'Please specify Date, Start Time, Working Hours, and Slot Duration.',
                confirmButtonColor: '#0f172a',
            });
            return;
        }
        if (date < todayStr) {
            Swal.fire({
                icon: 'error',
                title: 'Past Date',
                text: 'Schedule generation must target today or a future date.',
                confirmButtonColor: '#0f172a',
            });
            return;
        }
        try {
            const now = new Date();
            const dayName = new Date(date + 'T00:00:00').toLocaleDateString(
                'en-US',
                { weekday: 'long' }
            );
            const [startH, startM] = startTime.split(':').map(Number);
            let startMins = startH * 60 + startM;
            const endMins = startMins + parseInt(workHours) * 60;
            const slotDur = parseInt(duration);
            let skippedPast = 0,
                skippedDup = 0;
            const toCreate = [];

            const isOverlapping = (ns, ne) =>
                slots.some((ex) => {
                    if (ex.date !== date) return false;
                    const [es, ee] = ex.time.split(' - ');
                    const esm = es
                        .split(':')
                        .map(Number)
                        .reduce((h, m) => h * 60 + m);
                    const eem = ee
                        .split(':')
                        .map(Number)
                        .reduce((h, m) => h * 60 + m);
                    return ns < eem && ne > esm;
                });

            while (startMins + slotDur <= endMins) {
                const h = Math.floor(startMins / 60) % 24;
                const m = startMins % 60;
                if (
                    date === todayStr &&
                    (h < now.getHours() ||
                        (h === now.getHours() && m <= now.getMinutes()))
                ) {
                    startMins += slotDur;
                    skippedPast++;
                    continue;
                }
                const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                const ns = startMins;
                startMins += slotDur;
                const nh = Math.floor(startMins / 60) % 24;
                const nm = startMins % 60;
                const slotEnd = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
                if (isOverlapping(ns, startMins)) {
                    skippedDup++;
                    continue;
                }
                toCreate.push({
                    date,
                    day: dayName,
                    time: `${slotStart} - ${slotEnd}`,
                    is_booked: false,
                });
            }

            if (toCreate.length === 0) {
                let msg = 'No new slots generated.';
                if (skippedDup > 0)
                    msg = 'All slots overlap with existing ones.';
                if (skippedPast > 0) msg = 'The time range is in the past.';
                Swal.fire({
                    icon: 'warning',
                    title: 'No Slots Created',
                    text: msg,
                    confirmButtonColor: '#0f172a',
                });
            } else {
                await Promise.all(
                    toCreate.map((slot) => doctorAPI.addSlot(slot))
                );
                let msg = `Successfully created ${toCreate.length} slot${toCreate.length > 1 ? 's' : ''}.`;
                if (skippedDup > 0)
                    msg += ` (${skippedDup} overlap(s) skipped)`;
                Toast.fire({ icon: 'success', title: msg });
                setSelectedScheduleDate(date);
            }

            setShiftForm({
                date: '',
                startTime: '',
                workHours: '',
                duration: '30',
            });
            loadDashboardData();
        } catch (err) {
            const serverError =
                err.response?.data?.time?.[0] ||
                err.response?.data?.detail ||
                'Failed to sync with server.';
            Toast.fire({ icon: 'error', title: serverError });
        }
    };

    const appointmentsForDate = appointments.filter(
        (a) =>
            getSlotDetails(a).date === selectedDate && a.status !== 'Cancelled'
    );
    const countApptForDate = (ds) =>
        appointments.filter(
            (a) => getSlotDetails(a).date === ds && a.status !== 'Cancelled'
        ).length;

    const todayAppts = appointments.filter(
        (a) => getSlotDetails(a).date === todayStr && a.status !== 'Cancelled'
    );
    const pendingTotal = appointments.filter((a) => a.status === 'Pending');
    const confirmedToday = todayAppts.filter((a) => a.status === 'Confirmed');

    const slotsByDate = slots.reduce((acc, s) => {
        if (!s.date) return acc;
        if (!acc[s.date]) acc[s.date] = [];
        acc[s.date].push(s);
        return acc;
    }, {});

    const scheduleDates = Object.keys(slotsByDate).sort();
    const countSlotsForDate = (ds) => (slotsByDate[ds] || []).length;

    const slotsForScheduleDate = (slotsByDate[selectedScheduleDate] || [])
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time));

    const completedAppointments = appointments.filter((app) => {
        const isCompleted = app.status === 'Completed';
        const matchesSearch = (app.patient_name || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        return isCompleted && matchesSearch;
    });

    const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const statusBadge = (status) =>
        ({
            Pending: 'bg-amber-50 text-amber-700 border border-amber-100',
            Confirmed:
                'bg-emerald-50 text-emerald-700 border border-emerald-100',
            Cancelled: 'bg-red-50 text-red-600 border border-red-100',
            Completed: 'bg-slate-100 text-slate-500 border border-slate-200',
        })[status] || 'bg-slate-100 text-slate-500';

    const fmtDateLabel = (ds) => {
        const d = new Date(ds + 'T00:00:00');
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    };

    const DayStrip = ({
        days,
        selected,
        onSelect,
        countFn,
        isDateStr = false,
    }) => (
        <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
        >
            {days.map((item) => {
                const ds = isDateStr ? item : toLocalDateStr(item);
                const d = isDateStr ? new Date(ds + 'T00:00:00') : item;
                const cnt = countFn(ds);
                const isActive = ds === selected;
                const isToday = ds === todayStr;
                return (
                    <button
                        key={ds}
                        onClick={() => onSelect(ds)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border transition-all cursor-pointer min-w-[68px]
                            ${
                                isActive
                                    ? 'bg-[#0f172a] border-[#0f172a]'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        <span
                            className={`text-[11px] font-semibold tracking-wide ${isActive ? 'text-slate-400' : 'text-slate-500'}`}
                        >
                            {isToday ? 'Today' : DAY_ABBR[d.getDay()]}
                        </span>
                        <span
                            className={`text-lg font-bold leading-none ${isActive ? 'text-white' : 'text-[#0f172a]'}`}
                        >
                            {d.getDate()}
                        </span>
                        {cnt > 0 ? (
                            <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}
                            >
                                {cnt}
                            </span>
                        ) : (
                            <span className="h-[18px]" />
                        )}
                    </button>
                );
            })}
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
                .doctor-dashboard * { font-family: 'DM Sans', sans-serif; }
                .doctor-dashboard .mono { font-family: 'ui-monospace', 'SFMono-Regular', monospace; }
            `}</style>

            <div className="doctor-dashboard min-h-screen bg-[#f8f9fb] py-10 px-6 text-[#1e293b] antialiased">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-7">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
                                {t('doctorDashboard.clinicalOps')}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1 font-medium">
                                {t('doctorDashboard.manageSchedule')}
                            </p>
                        </div>
                        <button
                            onClick={loadDashboardData}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-xs cursor-pointer shadow-sm"
                        >
                            {loading ? t('doctorDashboard.syncing') : t('doctorDashboard.syncWorkspace')}
                        </button>
                    </div>

                    <div className="flex border-b border-slate-200 gap-7">
                        {['appointments', 'reviews', 'schedule', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3.5 font-semibold text-sm capitalize transition-all relative cursor-pointer ${
                                    activeTab === tab
                                        ? 'text-[#0f172a] border-b-2 border-[#0f172a]'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab === 'history'
                                    ? t('doctorDashboard.caseArchive')
                                    : tab === 'appointments'
                                      ? t('doctorDashboard.appointments')
                                      : tab === 'reviews'
                                        ? t('doctorDashboard.reviews')
                                        : t('doctorDashboard.schedule')}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'appointments' && (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    {
                                        label: t('doctorDashboard.todaysAppointments'),
                                        value: todayAppts.length,
                                    },
                                    {
                                        label: t('doctorDashboard.awaitingApproval'),
                                        value: pendingTotal.length,
                                    },
                                    {
                                        label: t('doctorDashboard.confirmedToday'),
                                        value: confirmedToday.length,
                                    },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm"
                                    >
                                        <p className="text-xs text-slate-500 font-semibold mb-1">
                                            {s.label}
                                        </p>
                                        <p className="text-2xl font-bold text-[#0f172a]">
                                            {s.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Day strip */}
                            <DayStrip
                                days={calendarDays}
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                countFn={countApptForDate}
                                isDateStr={false}
                            />

                            {/* Appointment list */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    {fmtDateLabel(selectedDate)}
                                </p>

                                {appointmentsForDate.length === 0 ? (
                                    <div className="bg-white border border-slate-200/60 rounded-2xl py-16 text-center shadow-sm">
                                        <p className="text-slate-500 text-sm font-semibold">
                                            {t('doctorDashboard.noAppointmentsDay')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {appointmentsForDate
                                            .sort((a, b) =>
                                                getSlotDetails(
                                                    a
                                                ).time.localeCompare(
                                                    getSlotDetails(b).time
                                                )
                                            )
                                            .map((app) => {
                                                const slotDetails =
                                                    getSlotDetails(app);
                                                const [tStart, tEnd] = (
                                                    slotDetails.time || ' - '
                                                ).split(' - ');
                                                return (
                                                    <div
                                                        key={app.id}
                                                        className="bg-white border border-slate-200/60 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm hover:border-slate-300 transition-all"
                                                    >
                                                        {/* Time */}
                                                        <div className="min-w-[72px] text-center">
                                                            <p className="text-base font-bold text-[#0f172a]">
                                                                {tStart}
                                                            </p>
                                                            <p className="text-xs text-slate-500 font-medium">
                                                                {tEnd}
                                                            </p>
                                                        </div>
                                                        <div className="w-px h-10 bg-slate-100" />
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-[#0f172a] text-sm truncate">
                                                                {app.patient_name ||
                                                                    'Anonymous Patient'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                                {slotDetails.day ||
                                                                    slotDetails.date}
                                                            </p>
                                                        </div>
                                                        {/* Status */}
                                                        <span
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadge(app.status)}`}
                                                        >
                                                            {app.status}
                                                        </span>
                                                        {/* Actions */}
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            {app.status ===
                                                                'Pending' && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleApproveAppointment(
                                                                                app.id
                                                                            )
                                                                        }
                                                                        className="px-3 py-1.5 bg-[#0f172a] text-white font-semibold rounded-xl hover:bg-slate-800 text-xs transition-all cursor-pointer"
                                                                    >
                                                                        {t('doctorDashboard.accept')}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleCancelAppointment(
                                                                                app.id
                                                                            )
                                                                        }
                                                                        className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 font-semibold rounded-xl hover:bg-slate-50 text-xs transition-all cursor-pointer"
                                                                    >
                                                                        {t('doctorDashboard.decline')}
                                                                    </button>
                                                                </>
                                                            )}
                                                            {app.status ===
                                                                'Confirmed' && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleOpenCompleteModal(
                                                                                app
                                                                            )
                                                                        }
                                                                        className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 text-xs transition-all cursor-pointer"
                                                                    >
                                                                        {t('doctorDashboard.complete')}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleCancelAppointment(
                                                                                app.id
                                                                            )
                                                                        }
                                                                        className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 font-semibold rounded-xl hover:bg-slate-50 text-xs transition-all cursor-pointer"
                                                                    >
                                                                        {t('doctorDashboard.cancel')}
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* ── Form Panel ── */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm h-fit space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {t('doctorDashboard.configureShift')}
                                </h3>
                                <form
                                    onSubmit={handleGenerateShift}
                                    className="space-y-4"
                                    noValidate
                                >
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600 font-semibold">
                                            {t('doctorDashboard.date')}
                                        </label>
                                        <input
                                            type="date"
                                            min={todayStr}
                                            value={shiftForm.date}
                                            onChange={(e) =>
                                                setShiftForm({
                                                    ...shiftForm,
                                                    date: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer text-slate-700 font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600 font-semibold">
                                            {t('doctorDashboard.startTime')}
                                        </label>
                                        <input
                                            type="time"
                                            value={shiftForm.startTime}
                                            onChange={(e) =>
                                                setShiftForm({
                                                    ...shiftForm,
                                                    startTime: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer text-slate-700 font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600 font-semibold">
                                            {t('doctorDashboard.workingHours')}
                                        </label>
                                        <select
                                            value={shiftForm.workHours}
                                            onChange={(e) =>
                                                setShiftForm({
                                                    ...shiftForm,
                                                    workHours: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer bg-white text-slate-700 font-medium"
                                        >
                                            <option value="">
                                                {t('doctorDashboard.selectHours')}
                                            </option>
                                            {[...Array(8)].map((_, i) => (
                                                <option
                                                    key={i + 1}
                                                    value={i + 1}
                                                >
                                                    {i + 1}{' '}
                                                    {i === 0 ? t('doctorDashboard.hour') : t('doctorDashboard.hours')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600 font-semibold">
                                            {t('doctorDashboard.slotDuration')}
                                        </label>
                                        <select
                                            value={shiftForm.duration}
                                            onChange={(e) =>
                                                setShiftForm({
                                                    ...shiftForm,
                                                    duration: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer bg-white text-slate-700 font-medium"
                                        >
                                            <option value="15">
                                                {t('doctorDashboard.minutes15')}
                                            </option>
                                            <option value="30">
                                                {t('doctorDashboard.minutes30')}
                                            </option>
                                            <option value="45">
                                                {t('doctorDashboard.minutes45')}
                                            </option>
                                            <option value="60">
                                                {t('doctorDashboard.minutes60')}
                                            </option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 bg-[#0f172a] text-white text-sm rounded-xl hover:bg-slate-800 transition-all cursor-pointer font-bold"
                                    >
                                        {t('doctorDashboard.generateSlots')}
                                    </button>
                                </form>
                            </div>

                            <div className="md:col-span-2 space-y-5">
                                {scheduleDates.length === 0 ? (
                                    <div className="bg-white border border-slate-200/60 rounded-2xl py-20 text-center shadow-sm">
                                        <p className="text-slate-500 text-sm font-semibold">
                                            {t('doctorDashboard.noSlotsCreated')}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <DayStrip
                                            days={scheduleDates}
                                            selected={selectedScheduleDate}
                                            onSelect={setSelectedScheduleDate}
                                            countFn={countSlotsForDate}
                                            isDateStr={true}
                                        />

                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    {fmtDateLabel(
                                                        selectedScheduleDate
                                                    )}
                                                </p>
                                                {slotsForScheduleDate.length >
                                                    0 && (
                                                    <span className="text-xs text-slate-600 font-semibold">
                                                        {
                                                            slotsForScheduleDate.filter(
                                                                (s) =>
                                                                    s.is_booked
                                                            ).length
                                                        }{' '}
                                                        {t('doctorDashboard.booked')}
                                                        {' / '}
                                                        {
                                                            slotsForScheduleDate.filter(
                                                                (s) =>
                                                                    !s.is_booked
                                                            ).length
                                                        }{' '}
                                                        {t('doctorDashboard.available')}
                                                    </span>
                                                )}
                                            </div>

                                            {slotsForScheduleDate.length ===
                                            0 ? (
                                                <div className="bg-white border border-slate-200/60 rounded-2xl py-14 text-center shadow-sm">
                                                    <p className="text-slate-500 text-sm font-semibold">
                                                        {t('doctorDashboard.noSlotsDay')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {slotsForScheduleDate.map(
                                                        (s) => {
                                                            const [
                                                                tStart,
                                                                tEnd,
                                                            ] =
                                                                s.time.split(
                                                                    ' - '
                                                                );
                                                            return (
                                                                <div
                                                                    key={s.id}
                                                                    className={`bg-white border rounded-2xl px-4 py-3.5 flex flex-col gap-2 shadow-sm transition-all
                                                                    ${
                                                                        s.is_booked
                                                                            ? 'border-red-100 bg-red-50/30'
                                                                            : 'border-slate-200/60 hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <p
                                                                                className={`text-sm font-bold ${s.is_booked ? 'text-red-600' : 'text-[#0f172a]'}`}
                                                                            >
                                                                                {
                                                                                    tStart
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                                                {
                                                                                    tEnd
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                        {s.is_booked ? (
                                                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-500 border border-red-100">
                                                                                Booked
                                                                            </span>
                                                                        ) : (
                                                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                                Open
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {!s.is_booked && (
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteSlot(
                                                                                    s.id
                                                                                )
                                                                            }
                                                                            className="w-full mt-1 py-1 text-[11px] font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all cursor-pointer"
                                                                        >
                                                                            {t('doctorDashboard.remove')}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('doctorDashboard.patientReviews')}</h3>
                            <DoctorReviews doctorId={currentUser?.id} />
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {t('doctorDashboard.patientRecords')}
                                </h3>
                                <input
                                    type="text"
                                    placeholder={t('doctorDashboard.searchPatient')}
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs w-full sm:w-64 focus:ring-1 focus:ring-slate-300 focus:outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#fcfcfc] text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                                            <th className="p-4 pl-6">
                                                {t('doctorDashboard.patient')}
                                            </th>
                                            <th className="p-4">
                                                {t('doctorDashboard.sessionDate')}
                                            </th>
                                            <th className="p-4">{t('doctorDashboard.diagnosis')}</th>
                                            <th className="p-4 text-center pr-6">
                                                {t('doctorDashboard.records')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {completedAppointments.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="text-center py-20 text-slate-500 font-semibold"
                                                >
                                                    {t('doctorDashboard.noCompleted')}
                                                </td>
                                            </tr>
                                        ) : (
                                            completedAppointments.map((app) => (
                                                <tr
                                                    key={app.id}
                                                    className="hover:bg-[#fafafa] transition-all"
                                                >
                                                    <td className="p-4 pl-6 font-semibold text-[#0f172a]">
                                                        {app.patient_name ||
                                                            'Anonymous'}
                                                    </td>
                                                    <td className="p-4 text-slate-600 font-medium">
                                                        {app.paid_at
                                                            ? new Date(
                                                                  app.paid_at
                                                              ).toLocaleDateString(
                                                                  'en-US',
                                                                  {
                                                                      year: 'numeric',
                                                                      month: 'short',
                                                                      day: 'numeric',
                                                                  }
                                                              )
                                                            : 'N/A'}
                                                    </td>
                                                    <td className="p-4 max-w-xs truncate text-slate-600 font-medium">
                                                        {app.diagnosis || '—'}
                                                    </td>
                                                            <td className="p-4 text-center pr-6">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedHistoryRecord(
                                                                            app
                                                                        );
                                                                        setHistoryModalOpen(
                                                                            true
                                                                        );
                                                                    }}
                                                                    className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                                                                >
                                                                    {t('doctorDashboard.viewRecord')}
                                                                </button>
                                                            </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {openModal && (
                    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-[#0f172a]">
                                    {t('doctorDashboard.completeSession')}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    {t('doctorDashboard.patient')}: {selectedAppointment?.patient_name}
                                </p>
                            </div>
                            <form
                                onSubmit={handleCompleteAppointment}
                                className="space-y-4"
                                noValidate
                            >
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">
                                        {t('doctorDashboard.diagnosis')}{' '}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        rows="2"
                                        value={medicalRecord.diagnosis}
                                        onChange={(e) =>
                                            setMedicalRecord({
                                                ...medicalRecord,
                                                diagnosis: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-slate-300 focus:outline-none text-slate-800 transition-all resize-none font-medium placeholder:text-slate-400 placeholder:font-normal"
                                        placeholder={t('doctorDashboard.enterFindings')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">
                                        {t('doctorDashboard.prescription')}{' '}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={medicalRecord.prescription}
                                        onChange={(e) =>
                                            setMedicalRecord({
                                                ...medicalRecord,
                                                prescription: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-slate-300 focus:outline-none text-slate-800 transition-all resize-none font-medium placeholder:text-slate-400 placeholder:font-normal"
                                        placeholder={t('doctorDashboard.listMeds')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">
                                        {t('doctorDashboard.doctorNotes')}{' '}
                                        <span className="text-slate-400 font-normal">
                                            (optional)
                                        </span>
                                    </label>
                                    <textarea
                                        rows="2"
                                        value={medicalRecord.doctor_notes}
                                        onChange={(e) =>
                                            setMedicalRecord({
                                                ...medicalRecord,
                                                doctor_notes: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-slate-300 focus:outline-none text-slate-800 transition-all resize-none font-medium placeholder:text-slate-400 placeholder:font-normal"
                                        placeholder={t('doctorDashboard.internalNotes')}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpenModal(false)}
                                        className="px-4 py-2 bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-100 cursor-pointer transition-all"
                                    >
                                        {t('doctorDashboard.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#0f172a] text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer transition-all"
                                    >
                                        {t('doctorDashboard.saveRecord')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {historyModalOpen && selectedHistoryRecord && (
                    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-slate-100">
                            <h3 className="text-base font-bold text-[#0f172a] border-b border-slate-100 pb-3">
                                {t('doctorDashboard.consultationRecord')}
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-3 bg-[#fafafa] p-3 rounded-xl border border-slate-100">
                                    <div>
                                        <span className="text-[11px] text-slate-500 block font-bold uppercase tracking-wide mb-1">
                                            {t('doctorDashboard.patient')}
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {selectedHistoryRecord.patient_name ||
                                                'Anonymous'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block font-bold uppercase tracking-wide mb-1">
                                            {t('doctorDashboard.sessionDate')}
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {selectedHistoryRecord.paid_at
                                                ? new Date(
                                                      selectedHistoryRecord.paid_at
                                                  ).toLocaleDateString(
                                                      'en-US',
                                                      {
                                                          year: 'numeric',
                                                          month: 'short',
                                                          day: 'numeric',
                                                      }
                                                  )
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                                        {t('doctorDashboard.diagnosis')}
                                    </span>
                                    <p className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-slate-700 leading-relaxed text-xs font-medium">
                                        {selectedHistoryRecord.diagnosis ||
                                            t('doctorDashboard.noDiagnosis')}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                                        {t('doctorDashboard.prescription')}
                                    </span>
                                    <p className="mono bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60 text-emerald-900 leading-relaxed text-xs whitespace-pre-line">
                                        {selectedHistoryRecord.prescription ||
                                            t('doctorDashboard.noPrescription')}
                                    </p>
                                </div>
                                {selectedHistoryRecord.doctor_notes && (
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                                            {t('doctorDashboard.doctorNotes')}
                                        </span>
                                        <p className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/60 text-amber-900 leading-relaxed text-xs font-medium">
                                            {selectedHistoryRecord.doctor_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHistoryModalOpen(false);
                                        setSelectedHistoryRecord(null);
                                    }}
                                    className="px-5 py-2 bg-[#0f172a] text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer transition-all shadow-sm"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
