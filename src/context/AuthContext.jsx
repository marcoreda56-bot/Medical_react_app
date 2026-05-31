import { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole,    setUserRole]    = useState(null);
    const [userStatus,  setUserStatus]  = useState(null);
    const [userName,    setUserName]    = useState(null);
    const [loading,     setLoading]     = useState(true);

    // ── Restore session on page reload ───────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { setLoading(false); return; }

        axiosInstance.get('/users/me/')
            .then((res) => applyUser(res.data))
            .catch(() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            })
            .finally(() => setLoading(false));
    }, []);

    // ── Helper ────────────────────────────────────────────────────────────────
    const applyUser = (user) => {
        setCurrentUser(user);
        setUserRole(user.role);
        setUserStatus(user.is_active ? 'approved' : 'pending');
        setUserName(user.full_name || user.username);
    };

    const saveTokens = (access, refresh) => {
        localStorage.setItem('access_token',  access);
        localStorage.setItem('refresh_token', refresh);
    };

    // ── Register (email) ──────────────────────────────────────────────────────
    const register = async ({ email, password, name = '', role, phone = '' }) => {
        const [first_name, ...rest] = name.trim().split(' ');
        const last_name = rest.join(' ');
        const res = await axiosInstance.post('/register/', {
            email, password, role, phone, first_name, last_name,
        });
        return res.data;
    };

    // ── Login (email + password) ──────────────────────────────────────────────
    const login = async (email, password) => {
        const res = await axiosInstance.post('/auth/login/', { email, password });
        saveTokens(res.data.access, res.data.refresh);
        const meRes = await axiosInstance.get('/users/me/');
        applyUser(meRes.data);
        return meRes.data;
    };

    // ── Login (Google OAuth) ──────────────────────────────────────────────────
    /**
     * @param {string} credential  - Google ID token from @react-oauth/google
     * @param {string} role        - 'patient' | 'doctor'  (used only on first login)
     */
    const loginWithGoogle = async (credential, role = 'patient') => {
        const res = await axiosInstance.post('/auth/google/', { credential, role });
        saveTokens(res.data.access, res.data.refresh);
        const meRes = await axiosInstance.get('/users/me/');
        applyUser(meRes.data);
        return meRes.data;
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setCurrentUser(null);
        setUserRole(null);
        setUserStatus(null);
        setUserName(null);
    };

    return (
        <AuthContext.Provider value={{
            currentUser, userRole, userStatus, userName, loading,
            register, login, loginWithGoogle, logout,
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);