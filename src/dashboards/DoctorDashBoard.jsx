import { useState, useEffect } from 'react';
import { appointmentAPI, doctorAPI } from '../services/api';
import Swal from 'sweetalert2';

export const DoctorDashBoard = () => {
    const [activeTab, setActiveTab] = useState('appointments');
    const [loading, setLoading] = useState(false);

    const [slots, setSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);
    
    const [shiftForm, setShiftForm] = useState({
        date: '',
        startTime: '',
        workHours: '',
        duration: '30' 
    });

    const [openModal, setOpenModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [medicalRecord, setMedicalRecord] = useState({ diagnosis: '', prescription: '', doctor_notes: '' });

    const [searchTerm, setSearchTerm] = useState('');
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const appsRes = await appointmentAPI.getMyAppointments();
            setAppointments(appsRes.data);

            const slotsRes = await doctorAPI.getMySlots();
            setSlots(slotsRes.data);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            Toast.fire({ icon: 'error', title: 'Failed to synchronize workspace.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleApproveAppointment = async (appId) => {
    try {
        // تأكد أنك تنادي approveAppointment وليس updateAppointment
        const response = await appointmentAPI.approveAppointment(appId);
        
        // الآن التحديث سيتم بنجاح لأن الـ Action في الباكيند قامت بالحفظ
        setAppointments(prevApps => 
            prevApps.map(app => 
                app.id === appId 
                    ? { ...app, status: 'Confirmed' } // التحديث المحلي
                    : app
            )
        );

        Toast.fire({ icon: 'success', title: 'Appointment approved successfully.' });
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
            customClass: { confirmButton: 'cursor-pointer rounded-xl', cancelButton: 'cursor-pointer rounded-xl' },
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return 'You must provide a reason for the cancellation!';
                }
            }
        });

        if (!reason) return; 

        try {
            const response = await appointmentAPI.cancelAppointment(appId, reason);
            const updatedAppointmentData = response.data?.appointment || response.data;

            setAppointments(prevApps => 
                prevApps.map(app => 
                    app.id === appId 
                        ? { ...app, ...updatedAppointmentData, status: 'Cancelled' } 
                        : app
                )
            );

            Toast.fire({ icon: 'success', title: response.data.message || 'Appointment cancelled and refunded.' });
        } catch (err) {
            console.error(err);
            Toast.fire({ 
                icon: 'error', 
                title: err.response?.data?.error || 'Failed to process cancellation.' 
            });
        }
    };

    const handleOpenCompleteModal = (appointment) => {
        setSelectedAppointment(appointment);
        setOpenModal(true);
    };

    const handleCompleteAppointment = async (e) => {
        e.preventDefault();
        
        if (!medicalRecord.diagnosis.trim() || !medicalRecord.prescription.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Required Fields Missing',
                text: 'Please write down both diagnosis and prescription.',
                confirmButtonColor: '#0f172a'
            });
            return;
        }

        try {
            await appointmentAPI.completeAppointment(selectedAppointment.id, {
                diagnosis: medicalRecord.diagnosis,
                prescription: medicalRecord.prescription,
                doctor_notes: medicalRecord.doctor_notes
            });

            setAppointments(prevApps => 
                prevApps.map(app => 
                    app.id === selectedAppointment.id 
                        ? { 
                            ...app, 
                            status: 'Completed', 
                            diagnosis: medicalRecord.diagnosis, 
                            prescription: medicalRecord.prescription,
                            doctor_notes: medicalRecord.doctor_notes
                          } 
                        : app
                )
            );

            Swal.fire({
                icon: 'success',
                title: 'Session Archived',
                text: 'Medical records stored safely.',
                confirmButtonColor: '#0f172a'
            });

            setOpenModal(false);
            setMedicalRecord({ diagnosis: '', prescription: '', doctor_notes: '' });
            
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: 'Failed to archive consultation.' });
        }
    };
    const handleDeleteSlot = async (slotId) => {
        try {
            await doctorAPI.deleteSlot(slotId);
            Toast.fire({ icon: 'success', title: 'Slot removed from plan.' });
            loadDashboardData();
        } catch (err) {
            Toast.fire({ icon: 'error', title: 'Cannot delete actively booked slot.' });
        }
    };

    const handleGenerateShift = async (e) => {
    e.preventDefault();
    const { date, startTime, workHours, duration } = shiftForm;

    if (!date || !startTime || !workHours || !duration) {
        Swal.fire({
            icon: 'error',
            title: 'Incomplete Parameters',
            text: 'Please specify the Date, Start Time, Working Hours, and Slot Duration.',
            confirmButtonColor: '#0f172a',
            customClass: { confirmButton: 'cursor-pointer rounded-xl' }
        });
        return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (date < todayStr) {
        Swal.fire({ 
            icon: 'error', 
            title: 'Past Date Forbidden', 
            text: 'Schedule generation must target today or future dates.', 
            confirmButtonColor: '#0f172a', 
            customClass: { confirmButton: 'cursor-pointer rounded-xl' } 
        });
        return;
    }

    try {
        const options = { weekday: 'long' };
        const dayName = new Date(date).toLocaleDateString('en-US', options);

        const [startH, startM] = startTime.split(':').map(Number);
        let startTotalMinutes = startH * 60 + startM;
        const endTotalMinutes = startTotalMinutes + parseInt(workHours) * 60;
        const slotDurationMinutes = parseInt(duration);

        let skippedPastSlots = 0;
        let skippedDuplicateSlots = 0;
        const slotsToCreate = [];

        // Helper function to check overlaps numerically
        const isOverlapping = (newStart, newEnd) => {
            return slots.some(ex => {
                if (ex.date !== date) return false;
                const [exStart, exEnd] = ex.time.split(' - ');
                const [exStartM, exEndM] = [
                    exStart.split(':').map(Number).reduce((h, m) => h * 60 + m),
                    exEnd.split(':').map(Number).reduce((h, m) => h * 60 + m)
                ];
                return newStart < exEndM && newEnd > exStartM;
            });
        };

        while (startTotalMinutes + slotDurationMinutes <= endTotalMinutes) {
            const currentH = Math.floor(startTotalMinutes / 60) % 24;
            const currentM = startTotalMinutes % 60;

            if (date === todayStr) {
                if (currentH < now.getHours() || (currentH === now.getHours() && currentM <= now.getMinutes())) {
                    startTotalMinutes += slotDurationMinutes;
                    skippedPastSlots++;
                    continue;
                }
            }

            const slotStart = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
            const newStartM = startTotalMinutes;
            startTotalMinutes += slotDurationMinutes;
            const nextH = Math.floor(startTotalMinutes / 60) % 24;
            const nextM = startTotalMinutes % 60;
            const slotEnd = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
            const newEndM = startTotalMinutes;

            if (isOverlapping(newStartM, newEndM)) {
                skippedDuplicateSlots++;
                continue;
            }

            slotsToCreate.push({
                date: date,
                day: dayName,
                time: `${slotStart} - ${slotEnd}`,
                is_booked: false
            });
        }

        if (slotsToCreate.length === 0) {
            let msg = 'No new timelines generated.';
            if (skippedDuplicateSlots > 0) msg = 'All calculated slots overlap with existing ones.';
            if (skippedPastSlots > 0) msg = 'The designated time hours are located in the past window.';
            
            Swal.fire({ icon: 'warning', title: 'Timeline Interrupted', text: msg, confirmButtonColor: '#0f172a', customClass: { confirmButton: 'cursor-pointer rounded-xl' } });
        } else {
            await Promise.all(slotsToCreate.map(slot => doctorAPI.addSlot(slot)));

            let successMsg = `Successfully deployed ${slotsToCreate.length} consultation slots.`;
            if (skippedDuplicateSlots > 0) successMsg += ` (${skippedDuplicateSlots} overlaps avoided)`;
            Toast.fire({ icon: 'success', title: successMsg });
        }

        setShiftForm({ date: '', startTime: '', workHours: '', duration: '30' });
        loadDashboardData();
    } catch (err) {
        console.error("Full Error Details:", err);
        const serverError = err.response?.data?.time?.[0] || err.response?.data?.detail || "Failed to sync with server.";
        Toast.fire({ icon: 'error', title: serverError });
    }
};

    const completedAppointments = appointments.filter((app) => {
        const isCompleted = app.status === 'Completed';
        const matchesSearch = (app.patient_name || 'Patient').toLowerCase().includes(searchTerm.toLowerCase());
        return isCompleted && matchesSearch;
    });

    const groupedSlots = slots.reduce((acc, slot) => {
        const key = slot.date ? `${slot.day} (${slot.date})` : slot.day;
        if (!acc[key]) acc[key] = [];
        acc[key].push(slot);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-[#fafafa] py-12 px-8 font-sans text-left text-[#1e293b] antialiased">
            <div className="max-w-5xl mx-auto space-y-10">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight">Clinical Operations</h1>
                        <p className="text-slate-400 text-sm mt-1">Control your digital clinic scheduler, prescriptions, and timeline blocks.</p>
                    </div>
                    <button onClick={loadDashboardData} className="px-4 py-2 bg-white border border-slate-200/60 text-slate-600 font-medium rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all text-xs cursor-pointer shadow-sm">
                        Synchronize Workspace
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200/60 gap-8">
                    {['appointments', 'schedule', 'history'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3.5 font-medium text-sm capitalize transition-all relative cursor-pointer ${activeTab === tab ? 'text-[#0f172a] font-semibold border-b-2 border-[#0f172a]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab === 'history' ? 'Case Archive' : tab}
                        </button>
                    ))}
                </div>

                {/* TAB 1: APPOINTMENTS */}
                {activeTab === 'appointments' && (
                    <div className="bg-white rounded-2xl border border-slate-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#fcfcfc] text-slate-400 font-medium text-xs uppercase tracking-wider border-b border-slate-100">
                                        <th className="p-4 pl-6">Patient</th>
                                        <th className="p-4">Schedule Point</th>
                                        <th className="p-4">Allocated Window</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-center pr-6">Management</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                    {appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-20 text-slate-400 font-medium">No active patient queues waiting.</td>
                                        </tr>
                                    ) : (
                                        appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').map((app) => (
                                            <tr key={app.id} className="hover:bg-[#fafafa]/50 transition-all">
                                                <td className="p-4 pl-6 font-medium text-[#0f172a]">{app.patient_name || "Anonymous"}</td>
                                                <td className="p-4 text-slate-500">{app.slot_details?.day} ({app.slot_details?.date})</td>
                                                <td className="p-4 font-medium text-[#0f172a]">{app.slot_details?.time}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${app.status === 'Confirmed' ? 'bg-emerald-50/60 text-emerald-700 border border-emerald-100/40' : 'bg-amber-50/60 text-amber-700 border border-amber-100/40'}`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 flex justify-center gap-2">
                                                    {app.status === 'Pending' && (
                                                        <>
                                                            <button type="button" onClick={() => handleApproveAppointment(app.id)} className="px-3 py-1.5 bg-[#0f172a] text-white font-medium rounded-xl hover:bg-slate-800 text-xs transition-all cursor-pointer">Accept</button>
                                                            <button type="button" onClick={() => handleCancelAppointment(app.id)} className="px-3 py-1.5 bg-white text-slate-500 border border-slate-200 font-medium rounded-xl hover:bg-slate-50 text-xs transition-all cursor-pointer">Dismiss</button>
                                                        </>
                                                    )}
                                                    {app.status === 'Confirmed' && (
                                                        <>
                                                            <button type="button" onClick={() => handleOpenCompleteModal(app)} className="px-3 py-1.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 text-xs transition-all cursor-pointer">Complete Session</button>
                                                            <button type="button" onClick={() => handleCancelAppointment(app.id)} className="px-3 py-1.5 bg-white text-slate-400 border border-slate-200 font-medium rounded-xl hover:bg-slate-50 text-xs transition-all cursor-pointer">Cancel</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 2: SCHEDULE PLANNER */}
                {activeTab === 'schedule' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Form Panel */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-fit space-y-4">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configure Timeline</h3>
                            <form onSubmit={handleGenerateShift} className="space-y-4" noValidate>
                                <div className="space-y-1"><label className="text-xs text-slate-500">Date Point</label><input type="date" value={shiftForm.date} onChange={(e) => setShiftForm({...shiftForm, date: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none cursor-pointer" /></div>
                                <div className="space-y-1"><label className="text-xs text-slate-500">Trigger Time</label><input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({...shiftForm, startTime: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none cursor-pointer" /></div>
                                <div className="space-y-1"><label className="text-xs text-slate-500">Total Hours</label>
                                    <select value={shiftForm.workHours} onChange={(e) => setShiftForm({...shiftForm, workHours: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none cursor-pointer bg-white">
                                        <option value="">Select Hours</option>
                                        {[...Array(8)].map((_, i) => <option key={i+1} value={i+1}>{i+1} Hours</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1"><label className="text-xs text-slate-500">Slot Duration</label>
                                    <select value={shiftForm.duration} onChange={(e) => setShiftForm({...shiftForm, duration: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none cursor-pointer bg-white">
                                        <option value="15">15 Minutes</option>
                                        <option value="30">30 Minutes</option>
                                        <option value="45">45 Minutes</option>
                                        <option value="60">60 Minutes</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-2.5 bg-[#0f172a] text-white text-sm rounded-xl hover:bg-slate-800 transition-all cursor-pointer">Deploy Slots</button>
                            </form>
                        </div>

                        {/* Visual Timeline Panel */}
                        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Calendar Streams</h3>
                            {slots.length === 0 ? (
                                <p className="text-center py-20 text-slate-400 text-sm font-medium">No active streams allocated yet.</p>
                            ) : (
                                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                                    {Object.entries(groupedSlots).map(([dateLabel, daySlots]) => (
                                        <div key={dateLabel} className="p-4 bg-[#fbfbfb] rounded-xl border border-slate-200/40 space-y-3">
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                <span className="font-semibold text-slate-800 text-xs">📅 {dateLabel}</span>
                                                <span className="px-2.5 py-0.5 text-[11px] font-medium bg-white border border-slate-200/60 text-slate-500 rounded-lg">{daySlots.length} Windows</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {daySlots.map(s => (
                                                    <div key={s.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${s.is_booked ? 'bg-red-50/40 text-red-600 border-red-100/50' : 'bg-white text-slate-600 border-slate-200/70'}`}>
                                                        <span>{s.time}</span>
                                                        {!s.is_booked && (
                                                            <button onClick={() => handleDeleteSlot(s.id)} className="text-slate-400 hover:text-red-500 font-normal ml-1 cursor-pointer transition-all text-sm">×</button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: CASE ARCHIVE */}
                {activeTab === 'history' && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient Records Dossier</h3>
                            <input 
                                type="text" 
                                placeholder="Filter records by name..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs w-full sm:w-64 focus:ring-1 focus:ring-slate-400 focus:outline-none font-medium transition-all"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#fcfcfc] text-slate-400 font-medium text-xs uppercase border-b border-slate-100">
                                        <th className="p-4 pl-6">Patient Identifier</th>
                                        <th className="p-4">Archived Event Date</th>
                                        <th className="p-4">Primary Pathology</th>
                                        <th className="p-4 text-center pr-6">Dossier Access</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                    {completedAppointments.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-20 text-slate-400 font-medium">No archived logs matched current filters.</td>
                                        </tr>
                                    ) : (
                                        completedAppointments.map((app) => (
                                            <tr key={app.id} className="hover:bg-[#fafafa]/50 transition-all">
                                                <td className="p-4 pl-6 font-medium text-[#0f172a]">{app.patient_name || "Patient Log"}</td>
                                                <td className="p-4 text-slate-400">{app.paid_at ? new Date(app.paid_at).toLocaleDateString() : 'N/A'}</td>
                                                <td className="p-4 max-w-xs truncate text-slate-500 font-normal">{app.diagnosis}</td>
                                                <td className="p-4 text-center pr-6">
                                                    <button 
                                                        onClick={() => { setSelectedHistoryRecord(app); setHistoryModalOpen(true); }}
                                                        className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 font-medium text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                                                    >
                                                        Review Prescription
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

            {/* MODAL 1: WRITE PRESCRIPTION */}
            {openModal && (
                <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100">
                        <div>
                            <h3 className="text-lg font-semibold text-[#0f172a]">Archive Consultation</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Patient Record Stream: {selectedAppointment?.patient_name}</p>
                        </div>
                        <form onSubmit={handleCompleteAppointment} className="space-y-4" noValidate>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-500">Pathological Diagnosis</label>
                                <textarea rows="2" value={medicalRecord.diagnosis} onChange={(e) => setMedicalRecord({...medicalRecord, diagnosis: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none text-slate-800 transition-all" placeholder="Enter findings..."></textarea>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-500">Therapeutic Formulation (Prescription)</label>
                                <textarea rows="3" value={medicalRecord.prescription} onChange={(e) => setMedicalRecord({...medicalRecord, prescription: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none text-slate-800 transition-all" placeholder="List drugs and frequencies..."></textarea>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-500">Internal Reference Notes (Optional)</label>
                                <textarea rows="2" value={medicalRecord.doctor_notes} onChange={(e) => setMedicalRecord({...medicalRecord, doctor_notes: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none text-slate-800 transition-all" placeholder="Notes for next visit..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setOpenModal(false)} className="px-4 py-2 bg-slate-50 text-slate-500 font-medium rounded-xl text-xs hover:bg-slate-100 cursor-pointer transition-all">Close</button>
                                <button type="submit" className="px-4 py-2 bg-[#0f172a] text-white font-medium rounded-xl text-xs hover:bg-slate-800 cursor-pointer transition-all">Save To File</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ARCHIVE DOSSIER VIEW */}
            {historyModalOpen && selectedHistoryRecord && (
                <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100">
                        <h3 className="text-base font-semibold text-[#0f172a] border-b border-slate-100 pb-3">Consultation Overview</h3>
                        
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-2 bg-[#fafafa] p-3 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-[11px] text-slate-400 block font-medium uppercase">Patient Name</span>
                                    <span className="font-semibold text-slate-800">{selectedHistoryRecord.patient_name || 'Anonymous'}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 block font-medium uppercase">Session Date</span>
                                    <span className="font-semibold text-slate-800">
                                        {selectedHistoryRecord.paid_at ? new Date(selectedHistoryRecord.paid_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase block">Diagnosis</span>
                                <p className="bg-slate-50/60 p-3 rounded-xl border border-slate-200/40 text-slate-700 leading-relaxed text-xs">
                                    {selectedHistoryRecord.diagnosis || 'No diagnosis logged.'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase block">Prescription / Medication</span>
                                <p className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50 text-emerald-950 font-mono leading-relaxed text-xs whitespace-pre-line">
                                    {selectedHistoryRecord.prescription || 'No medication formulated.'}
                                </p>
                            </div>

                            {selectedHistoryRecord.doctor_notes && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase block">Internal Doctor Notes</span>
                                    <p className="bg-amber-50/30 p-3 rounded-xl border border-amber-100/50 text-amber-900 leading-relaxed text-xs">
                                        {selectedHistoryRecord.doctor_notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button 
                                type="button" 
                                onClick={() => { setHistoryModalOpen(false); setSelectedHistoryRecord(null); }} 
                                className="px-5 py-2 bg-[#0f172a] text-white font-medium rounded-xl text-xs hover:bg-slate-800 cursor-pointer transition-all shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};