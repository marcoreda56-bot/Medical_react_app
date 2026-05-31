import axiosInstance from './axios';

export default axiosInstance;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
    // ✅ login with email field
    login: (email, password) =>
        axiosInstance.post('/auth/login/', { email, password }),

    register: (userData) =>
        axiosInstance.post('/register/', userData),

    verifyOTP: (email, otp) =>
        axiosInstance.post('/auth/verify-otp/', { email, otp }),
};

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const doctorAPI = {
    getApprovedDoctors: () => axiosInstance.get('/doctors/'),
    getAvailableSlots: (doctorId) =>
        axiosInstance.get('/slots/available/', {
            params: doctorId ? { doctor_id: doctorId } : {},
        }),
    getMySlots: () => axiosInstance.get('/slots/'),
    addSlot: (slotData) => axiosInstance.post('/slots/', slotData),
    deleteSlot: (slotId) => axiosInstance.delete(`/slots/${slotId}/`),
};

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentAPI = {
    getMyAppointments: () => axiosInstance.get('/appointments/'),
    getUpcoming: () => axiosInstance.get('/appointments/upcoming/'),
    getPast: () => axiosInstance.get('/appointments/past/'),
    book: (data) => axiosInstance.post('/appointments/book/', data),
    approve: (id, doctorNotes = '') =>
        axiosInstance.post(`/appointments/${id}/approve/`, { doctor_notes: doctorNotes }),
    reject: (id, doctorNotes = '') =>
        axiosInstance.post(`/appointments/${id}/reject/`, { doctor_notes: doctorNotes }),
    cancel: (id, reason = '') =>
        axiosInstance.post(`/appointments/${id}/cancel/`, { reason }),
    complete: (id, data) =>
        axiosInstance.post(`/appointments/${id}/complete/`, data),
};

// ─── Specialties ──────────────────────────────────────────────────────────────
export const specialtyAPI = {
    getSpecialties: () => axiosInstance.get('/specialties/'),
};

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profileAPI = {
    getDoctorProfile: () => axiosInstance.get('/doctor-profiles/me/'),
    saveDoctorProfile: (data) => axiosInstance.patch('/doctor-profiles/me/', data),
    getPatientProfile: () => axiosInstance.get('/patient-profiles/me/'),
    savePatientProfile: (data) => axiosInstance.patch('/patient-profiles/me/', data),
};