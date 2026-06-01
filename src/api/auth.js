import axiosInstance from './axios';

export const registerUser = async (userData) => {
    const res = await axiosInstance.post('/register/', userData);
    return res.data;
};

export const verifyOTP = async (email, otp) => {
    const res = await axiosInstance.post('/auth/verify-otp/', { email, otp });
    return res.data;
};

export const loginUser = async (email, password) => {
    const res = await axiosInstance.post('/auth/login/', {
        email,
        password,
    });
    return res.data;
};

export const refreshToken = async (refresh) => {
    const res = await axiosInstance.post('/auth/refresh/', { refresh });
    return res.data;
};