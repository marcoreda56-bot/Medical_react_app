import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = useCallback(async () => {
        if (!currentUser) return;
        try {
            const res = await axiosInstance.get('/notifications/');
            const sorted = res.data.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
            setNotifications(sorted);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            return;
        }
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [currentUser, fetchNotifications]);

    const markAsRead = async (notificationId) => {
        try {
            await axiosInstance.patch(`/notifications/${notificationId}/`, {
                read: true,
            });
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (err) {
            console.error('Failed to mark notification read', err);
        }
    };

    const sendNotification = async (userId, title, body, data = {}) => {
        try {
            await axiosInstance.post('/notifications/', {
                user: userId,
                title,
                body,
                data,
            });
        } catch (err) {
            console.error('Failed to send notification', err);
        }
    };

    return (
        <NotificationsContext.Provider
            value={{
                notifications,
                sendNotification,
                markAsRead,
                fetchNotifications,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationsContext);
