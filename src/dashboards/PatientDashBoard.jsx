import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorAPI, appointmentAPI, specialtyAPI } from '../services/api';
import Swal from 'sweetalert2';
import { useLanguage } from '../context/LanguageContext';

export const PatientDashBoard = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(0);

    const [doctors, setDoctors] = useState([]);
    const [allSlots, setAllSlots] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);

    const [selectedDayForDoc, setSelectedDayForDoc] = useState({});
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

    const loadPatientData = async () => {
        if (!currentUser) return;
        try {
            const specRes = await specialtyAPI.getSpecialties();
            setSpecialties(specRes.data);

            const docRes = await doctorAPI.getApprovedDoctors();
            setDoctors(docRes.data);

            const slotRes = await doctorAPI.getAvailableSlots();
            setAllSlots(slotRes.data);

            // 🛠️ الفلتر هنا معدل أيضاً بالـ Number لضمان اختيار أول يوم تلقائياً عند تحميل الصفحة
            const initialDays = {};
            docRes.data.forEach((docItem) => {
                const docSlots = slotRes.data.filter((s) => {
                    const sDocId = s.doctor && typeof s.doctor === 'object' ? Number(s.doctor.id) : Number(s.doctor || s.doctor_id);
                    return sDocId === Number(docItem.id);
                });
                if (docSlots.length > 0) {
                    initialDays[docItem.id] = docSlots[0].date;
                }
            });
            setSelectedDayForDoc(initialDays);

            const appRes = await appointmentAPI.getMyAppointments();
            setMyAppointments(appRes.data);
        } catch (err) {
            console.error('Error loading data:', err);
            Toast.fire({ icon: 'error', title: 'Failed to fetch data from backend.' });
        }
    };

    useEffect(() => {
        loadPatientData();
    }, [currentUser]);

    const handleBookSlot = async (doctor, slot) => {
        const doctorName = `${doctor.first_name} ${doctor.last_name}`.trim() || 'Doctor';
        const amount = Number(doctor.doctor_profile?.consultation_fee) || 250;
        const dayLabel = `${slot.date}`;
        const displayTime = slot.start_time || slot.time?.split(' - ')[0] || slot.time;

        const result = await Swal.fire({
            title: t('patient.payAndBookTitle', 'Pay & Book Appointment'),
            html: `
                <div style="text-align:left;" class="space-y-3 text-sm text-gray-700">
                    <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
                    <p><strong>Appointment:</strong> ${dayLabel} (${displayTime})</p>
                    <p><strong>Amount:</strong> ${amount} EGP</p>
                    <hr class="border-gray-200 my-2" />
                    <input id="payment-card-name" class="swal2-input" placeholder="Cardholder name" style="width:100%; margin: 8px 0;" />
                    <input id="payment-card-number" class="swal2-input" placeholder="Card number" maxlength="19" style="width:100%; margin: 8px 0;" />
                    <div style="display:flex; gap:8px;">
                        <input id="payment-card-expiry" class="swal2-input" placeholder="MM/YY" maxlength="5" style="width:50%;" />
                        <input id="payment-card-cvv" class="swal2-input" placeholder="CVV" maxlength="4" type="password" style="width:50%;" />
                    </div>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#00796b',
            cancelButtonColor: '#d33',
            confirmButtonText: `Pay ${amount} EGP & Book`,
            cancelButtonText: t('doctor.cancelBookBtn', 'Cancel'),
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
                    payment_card_last4: result.value?.last4 || ''
                });

                Swal.fire(t('notifications.bookedTitle', 'Booked!'), t('notifications.bookedSuccess', 'Your appointment has been successfully booked.'), 'success');
                loadPatientData();
            } catch (err) {
                Swal.fire('Booking Failed', err.message || 'This slot might have been locked or already booked.', 'error');
            }
        }
    };

    const handleCancelAppointment = async (app) => {
        const result = await Swal.fire({
            title: t('patient.cancelConfirmTitle', 'Cancel Appointment?'),
            text: t('patient.cancelConfirmText', 'Are you sure you want to cancel your reservation with Dr. ') + app.doctor_name + '?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: t('patient.yesCancel', 'Yes, cancel it'),
            cancelButtonText: t('doctor.cancelBookBtn', 'Cancel'),
            customClass: { confirmButton: 'cursor-pointer rounded-xl', cancelButton: 'cursor-pointer rounded-xl' }
        });

        if (!result.isConfirmed) return;

        try {
            await appointmentAPI.updateAppointment(app.id, { status: 'Cancelled' });
            Toast.fire({ icon: 'success', title: t('notifications.cancelSuccess', 'Appointment cancelled successfully.') });
            loadPatientData();
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            Toast.fire({ icon: 'error', title: err.message || t('notifications.cancelFailed', 'Failed to cancel the appointment.') });
        }
    };

    const filteredDoctors = doctors.filter((docItem) => {
        const fullName = `${docItem.first_name} ${docItem.last_name}`.toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || docItem.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = !selectedSpecialty || docItem.doctor_profile?.specialty === selectedSpecialty;
        return matchesSearch && matchesSpecialty;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50 text-gray-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-hospital">{t('patient.title', 'Patient Center')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('patient.subtitle', 'Stay healthy! 🛡️')}</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-xs p-1.5 flex mb-8 border border-gray-100">
                <button
                    onClick={() => setActiveTab(0)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 0 ? 'bg-hospital text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    🏥 {t('patient.tabs.0', 'Book An Appointment')}
                </button>
                <button
                    onClick={() => setActiveTab(1)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 1 ? 'bg-hospital text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    📅 {t('patient.tabs.1', 'My Bookings & Records')}
                </button>
            </div>

            {/* TAB 0: BOOK AN APPOINTMENT */}
            {activeTab === 0 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">{t('patient.availableDoctors', 'Available Doctors & Specialists')}</h2>

                    {/* Search & Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">🔍</span>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-hospital transition-all"
                                placeholder={t('patient.searchPlaceholder', 'Search doctor name...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-64">
                            <select
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-hospital transition-all text-gray-700 bg-no-repeat cursor-pointer"
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                            >
                                <option value="">{t('patient.allSpecialties', 'All Specialties')}</option>
                                {specialties.map((spec) => (
                                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Doctors Grid */}
                    {filteredDoctors.length === 0 ? (
                        <p className="text-gray-500">{t('patient.noDoctors', 'No registered doctors available right now.')}</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredDoctors.map((docItem) => {
                                
                                // 🛠️ التصليح القاتل: تحويل مقارنة الدكاترة والـ slots لنفس الـ Type (Number)
                                const doctorSlots = allSlots.filter((s) => {
                                    const sDocId = s.doctor && typeof s.doctor === 'object' ? Number(s.doctor.id) : Number(s.doctor || s.doctor_id);
                                    return sDocId === Number(docItem.id);
                                });

                                const uniqueDates = [...new Set(doctorSlots.map((s) => s.date))];
                                const currentSelectedDate = selectedDayForDoc[docItem.id] || uniqueDates[0];
                                const slotsForSelectedDay = doctorSlots.filter((s) => s.date === currentSelectedDate);

                                return (
                                    <div key={docItem.id} className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-sm transition-all p-6 flex flex-col justify-between">
                                        <div>
                                            {/* Doctor Meta Header */}
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-14 h-14 rounded-full bg-hospital-light flex items-center justify-center text-hospital text-xl font-bold shrink-0">
                                                    {docItem.first_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">Dr. {docItem.first_name} {docItem.last_name}</h3>
                                                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-teal-50 text-hospital rounded-full inline-block mt-0.5">
                                                        {specialties.find(s => s.id === docItem.doctor_profile?.specialty)?.name || t('patient.specialist', 'Specialist')}
                                                    </span>
                                                    <p className="text-sm text-gray-500 mt-1">Fee: <span className="font-bold text-gray-700">{Number(docItem.doctor_profile?.consultation_fee) || 250} EGP</span></p>
                                                </div>
                                            </div>

                                            {/* Details Link */}
                                            <button
                                                onClick={() => { setSelectedDoctorProfile(docItem); setDoctorModalOpen(true); }}
                                                className="text-xs text-hospital-hover hover:text-hospital-dark font-medium underline mb-4 inline-block cursor-pointer"
                                            >
                                                ℹ️ View Doctor Bio & Details
                                            </button>

                                            {/* Select Date Section */}
                                            <div className="mb-4">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('patient.chooseDay', 'Choose Day:')}</h4>
                                                {uniqueDates.length === 0 ? (
                                                    <span className="text-xs text-red-500">{t('doctor.noDoctorRecords', 'No working days scheduled yet.')}</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {uniqueDates.map((dateVal) => (
                                                            <button
                                                                key={dateVal}
                                                                onClick={() => setSelectedDayForDoc({ ...selectedDayForDoc, [docItem.id]: dateVal })}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${currentSelectedDate === dateVal ? 'bg-hospital border-hospital text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                                            >
                                                                {dateVal}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Available Times */}
                                        <div className="mt-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('patient.availableTimes', 'Available Times:')}</h4>
                                            {slotsForSelectedDay.length === 0 ? (
                                                <p className="text-xs text-gray-400">{t('patient.selectDay', 'Select a day to view slots.')}</p>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {slotsForSelectedDay.map((slot) => (
                                                        <button
                                                            key={slot.id}
                                                            onClick={() => handleBookSlot(docItem, slot)}
                                                            className="px-3 py-2 border border-hospital text-hospital text-xs font-semibold rounded-xl text-center hover:bg-hospital hover:text-white transition-all cursor-pointer"
                                                        >
                                                            {/* ⏱️ التعديل المرن: سحب وقت البداية فقط من الحقل المدمج (10:00) */}
                                                            ⏱️ {slot.start_time || slot.time?.split(' - ')[0] || slot.time}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 1: BOOKING HISTORY */}
            {activeTab === 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 overflow-hidden">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">{t('patient.yourHistory', 'Your Booking History')}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-hospital text-xs font-bold uppercase tracking-wider">
                                    <th className="p-4">{t('patient.doctorName', 'Doctor Name')}</th>
                                    <th className="p-4">{t('doctor.dayTime', 'Day & Time')}</th>
                                    <th className="p-4">{t('doctor.status', 'Status')}</th>
                                    <th className="p-4">Payment</th>
                                    <th className="p-4 text-center">Actions / Prescription</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100">
                                {myAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400">
                                            {t('doctor.noAppointments', "You haven't booked any appointments yet.")}
                                        </td>
                                    </tr>
                                ) : (
                                    myAppointments.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-semibold text-gray-800">Dr. {app.doctor_name}</td>
                                            <td className="p-4 text-gray-600">{app.slot_details?.date} ({app.slot_details?.start_time || app.slot_details?.time})</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${app.status === 'Completed' ? 'bg-green-50 text-green-700' : app.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-teal-50 border border-teal-100 text-hospital">
                                                    {app.payment_status} ({app.consultation_fee} EGP)
                                                </span>
                                            </td>
                                            <td className="p-4 text-center flex items-center justify-center gap-3">
                                                {app.prescription ? (
                                                    <button
                                                        onClick={() => { setSelectedRecord(app); setOpenModal(true); }}
                                                        className="text-hospital hover:text-hospital-dark font-bold hover:underline cursor-pointer"
                                                    >
                                                        {t('patient.viewPrescription', 'View Prescription')}
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">{t('patient.noPrescription', 'No prescription yet')}</span>
                                                )}

                                                {(app.status === 'Pending' || app.status === 'Confirmed') && (
                                                    <button
                                                        onClick={() => handleCancelAppointment(app)}
                                                        className="px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                                                    >
                                                        {t('patient.cancelBtn', 'Cancel')}
                                                    </button>
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

            {/* MODAL: MEDICAL PRESCRIPTION */}
            {openModal && selectedRecord && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl transition-all">
                        <h3 className="text-lg font-bold text-hospital mb-4">Medical Prescription</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p><strong>Doctor:</strong> Dr. {selectedRecord.doctor_name}</p>
                            <p><strong>Date:</strong> {selectedRecord.slot_details?.date}</p>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl mt-4 whitespace-pre-line text-gray-800 font-medium">
                                {selectedRecord.prescription}
                            </div>
                        </div>
                        <button
                            onClick={() => setOpenModal(false)}
                            className="w-full mt-6 bg-hospital hover:bg-hospital-dark text-white font-bold py-3 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL: DOCTOR BIO & DETAILS */}
            {doctorModalOpen && selectedDoctorProfile && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl transition-all">
                        <h3 className="text-lg font-bold text-hospital mb-4">Doctor Profile Details</h3>
                        <div className="space-y-3 text-sm text-gray-700">
                            <p><strong>Name:</strong> Dr. {selectedDoctorProfile.first_name} {selectedDoctorProfile.last_name}</p>
                            <p><strong>Experience:</strong> {selectedDoctorProfile.doctor_profile?.experience_years || 0} Years</p>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Biography</p>
                                <p className="text-gray-600 leading-relaxed">{selectedDoctorProfile.doctor_profile?.bio || 'No biography provided.'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDoctorModalOpen(false)}
                            className="w-full mt-6 bg-hospital hover:bg-hospital-dark text-white font-bold py-3 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};