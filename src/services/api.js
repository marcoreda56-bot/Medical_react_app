import axiosInstance from '../api/axios';

export default axiosInstance;

export const authAPI = {
    login: (email, password) =>
        axiosInstance.post('/auth/login/', { email, password }),
    register: (userData) => axiosInstance.post('/register/', userData),
    verifyOTP: (email, otp) =>
        axiosInstance.post('/auth/verify-otp/', { email, otp }),
};

export const doctorAPI = {
    getApprovedDoctors: () => axiosInstance.get('/doctors/'),
    getAvailableSlots: () => axiosInstance.get('/slots/available/'),
    getMySlots: () => axiosInstance.get('/slots/'),
    addSlot: (slotData) => axiosInstance.post('/slots/', slotData),
    deleteSlot: (slotId) => axiosInstance.delete(`/slots/${slotId}/`),
};

export const appointmentAPI = {
    getMyAppointments: () => axiosInstance.get('/appointments/'),
    book: (data) => axiosInstance.post('/appointments/book/', data),
    approveAppointment: (id) =>
        axiosInstance.post(`/appointments/${id}/approve/`),
    cancelAppointment: (id, reason) =>
        axiosInstance.post(`/appointments/${id}/cancel/`, { reason }),
    completeAppointment: (id, data) =>
        axiosInstance.post(`/appointments/${id}/complete/`, data),
};

export const specialtyAPI = {
    getSpecialties: () => axiosInstance.get('/specialties/'),
};

export const profileAPI = {
    getDoctorProfile: () => axiosInstance.get('/doctor-profiles/me/'),
    saveDoctorProfile: (data) =>
        axiosInstance.patch('/doctor-profiles/me/', data),
    getPatientProfile: () => axiosInstance.get('/patient-profiles/me/'),
    savePatientProfile: (data) =>
        axiosInstance.patch('/patient-profiles/me/', data),
};
