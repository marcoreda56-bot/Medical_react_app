import { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    const [userName, setUserName] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setLoading(false);
            return;
        }
        axiosInstance
            .get('/users/me/')
            .then((res) => {
                const user = res.data;
                setCurrentUser(user);
                setUserRole(user.role);
                setUserStatus(user.is_active ? 'approved' : 'pending');
                setUserName(user.full_name || user.username);
            })
            .catch(() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            })
            .finally(() => setLoading(false));
    }, []);

    const register = async (email, password, name, role) => {
        const [first_name, ...rest] = name.trim().split(' ');
        const last_name = rest.join(' ');
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        const res = await axiosInstance.post('/register/', {
            username,
            email,
            password,
            role,
            first_name,
            last_name,
        });
        return res.data;
    };

    const login = async (email, password) => {
        const res = await axiosInstance.post('/auth/login/', {
            email,
            password,
        });
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);

        const meRes = await axiosInstance.get('/users/me/');
        const user = meRes.data;
        setCurrentUser(user);
        setUserRole(user.role);
        setUserStatus(user.is_active ? 'approved' : 'pending');
        setUserName(user.full_name || user.username);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setCurrentUser(null);
        setUserRole(null);
        setUserStatus(null);
        setUserName(null);
    };

    const value = {
        currentUser,
        userRole,
        userStatus,
        userName,
        loading,
        register,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
