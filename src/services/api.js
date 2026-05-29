import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh: refreshToken });
                    const newAccessToken = res.data.access;
                    
                    localStorage.setItem('access_token', newAccessToken);
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    
                    processQueue(null, newAccessToken);
                    isRefreshing = false;
                    
                    return api(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (username, password) => api.post('/auth/login/', { username, password }),
    register: (userData) => api.post('/register/', userData), 
    verifyOTP: (email, otp) => api.post('/auth/verify-otp/', { email, otp }),
};

export const doctorAPI = {
    getApprovedDoctors: () => api.get('/doctors/'),
    getMySlots: () => api.get('/slots/'),
    addSlot: (slotData) => api.post('/slots/', slotData), 
    deleteSlot: (id) => api.delete(`/slots/${id}/`),
    
    getAvailableSlots: (doctorId) => {
        const url = doctorId ? `/slots/available/?doctor_id=${doctorId}` : '/slots/available/';
        return api.get(url);
    },
};

export const appointmentAPI = {
    getMyAppointments: () => api.get('/appointments/'),
    getAppointmentDetail: (id) => api.get(`/appointments/${id}/`),
    book: (bookingData) => api.post('/appointments/book/', bookingData),
    updateAppointment: (id, data) => api.patch(`/appointments/${id}/`, data), 
    cancelAppointment: (id, reason) => api.post(`/appointments/${id}/cancel/`, { reason }), 
    approveAppointment: (appId) => api.post(`/appointments/${appId}/approve/`), 
    completeAppointment: (appId) => api.post(`/appointments/${appId}/complete/`),
};

export const specialtyAPI = {
    getSpecialties: () => api.get('/specialties/'),
    addSpecialty: (data) => api.post('/specialties/', data), 
};

export const profileAPI = {
    getProfile: () => api.get('/users/me/'),
    saveProfile: (userData) => api.patch('/users/me/', userData), 
    getDoctorProfile: () => api.get('/doctor-profiles/me/'),
    saveDoctorProfile: (docData) => api.patch('/doctor-profiles/me/', docData),
};

export default api;