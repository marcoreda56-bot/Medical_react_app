import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    orderBy,
    serverTimestamp,
    getDoc,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!currentUser?.uid) {
            setNotifications([]);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setNotifications(items);
        });

        return () => unsub();
    }, [currentUser]);

    const sendNotification = async (userId, title, body, data = {}) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                userId,
                title,
                body,
                data,
                read: false,
                createdAt: serverTimestamp(),
            });
        } catch (err) {
            console.error('Failed to send notification', err);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const ref = doc(db, 'notifications', notificationId);
            await updateDoc(ref, { read: true });
        } catch (err) {
            console.error('Failed to mark notification read', err);
        }
    };

    return (
        <NotificationsContext.Provider
            value={{ notifications, sendNotification, markAsRead }}
        >
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationsContext);
