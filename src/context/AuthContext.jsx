import { createContext, useContext, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => {
        const token = localStorage.getItem('access_token');
        const username = localStorage.getItem('username');
        const uid = localStorage.getItem('user_uid');
        return token ? { token, username, uid } : null;
    });

    const [userRole, setUserRole] = useState(() => {
        return localStorage.getItem('user_role') || null;
    });

    const [loading, setLoading] = useState(false); 

    const login = async (username, password) => {
        setLoading(true);
        try {
            const response = await authAPI.login(username, password);
            const { access, refresh, role, username: resUsername, uid } = response.data;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user_role', role);
            localStorage.setItem('username', resUsername);
            localStorage.setItem('user_uid', uid);

            setCurrentUser({ token: access, username: resUsername, uid });
            setUserRole(role);
            setLoading(false);
            return { success: true, role };
        } catch (error) {
            setLoading(false);
            console.error('Login error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.detail || 'Invalid username or password.', { cause: error });
        }
    };

    const register = async (userData) => {
        setLoading(true);
        try {
            await authAPI.register(userData);
            setLoading(false);
            return await login(userData.username, userData.password);
        } catch (error) {
            setLoading(false);
            console.error('Registration error:', error.response?.data || error.message);
            
            const errorData = error.response?.data;
            let errorMsg = 'Registration failed. Please try again.';

            if (errorData) {
                // تحويل الداتا لنص صغير عشان نعمل فحص ذكي وسريع على الكلمات المفتاحية
                const dataString = JSON.stringify(errorData).toLowerCase();
                
                if (dataString.includes('already exists') || dataString.includes('already registered') || dataString.includes('unique')) {
                    errorMsg = 'This email or username is already registered. Please use another one or sign in.';
                } else if (typeof errorData === 'object') {
                    // لو فيه أخطاء تانية مجمعة (زي إن الباسورد ضعيف أو الحقول ناقصة) بيعرضها بشكل منسق
                    errorMsg = Object.values(errorData).flat().join(' | ');
                }
            } else if (error.message.includes('Network Error')) {
                errorMsg = 'Network error. Please check your internet connection or server status.';
            }

            // بنرمي الخطأ بالرسالة المفهومة والنظيفة لصفحة الـ Register
            throw new Error(errorMsg, { cause: error });
        }
    };

    const logout = () => {
        localStorage.clear();
        setCurrentUser(null);
        setUserRole(null);
    };

    const value = { 
        currentUser, 
        userRole, 
        userName: currentUser?.username || '', 
        loading, 
        login, 
        register, 
        logout 
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);