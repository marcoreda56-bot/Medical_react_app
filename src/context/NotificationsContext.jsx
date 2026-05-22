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
    serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!currentUser?.uid) {
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid)
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                // sort client-side by createdAt descending when available
                items.sort((a, b) => {
                    const ta = a.createdAt?.toDate
                        ? a.createdAt.toDate().getTime()
                        : a.createdAt?.seconds
                          ? a.createdAt.seconds * 1000
                          : 0;
                    const tb = b.createdAt?.toDate
                        ? b.createdAt.toDate().getTime()
                        : b.createdAt?.seconds
                          ? b.createdAt.seconds * 1000
                          : 0;
                    return tb - ta;
                });
                setNotifications(items);
            },
            (err) => {
                console.error('Notifications listener error:', err);
            }
        );

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
            value={{ notifications: currentUser?.uid ? notifications : [], sendNotification, markAsRead }}
        >
            {children}
        </NotificationsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationsContext);
