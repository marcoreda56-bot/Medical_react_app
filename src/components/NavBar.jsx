import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';

export const Navbar = () => {
    const { currentUser, userRole, userName, logout } = useAuth();
    const { t, toggleLanguage, language } = useLanguage();
    const navigate = useNavigate();
    const { notifications, markAsRead } = useNotifications();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed: ', err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentUser) return null;

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleNotificationSelect = async (n) => {
        if (!n.read) await markAsRead(n.id);
        setDropdownOpen(false);
    };

    return (
        <nav className="bg-[#00796b] text-white shadow-md select-none relative z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    
                    {/* Left Section: Brand & Panel Tag */}
                    <div className="flex items-center gap-3">
                        <span
                            onClick={() => navigate(currentUser ? '/home' : '/')}
                            className="text-lg font-black tracking-wider cursor-pointer flex items-center gap-1 select-none"
                        >
                            {t('nav.brand')} 🩺
                        </span>
                        <span className="bg-white/20 text-[10px] md:text-xs px-2 py-0.5 rounded-md uppercase font-extrabold tracking-wide">
                            {t(`roles.${userRole}`)} {t('nav.panel')}
                        </span>
                    </div>

                    {/* Right Section: User Info & Actions */}
                    <div className="flex items-center gap-2 md:gap-5">
                        
                        {/* Welcome Message (Displays Username/Email from Context) */}
                        <span className="text-sm font-medium hidden sm:inline-block">
                            {t('nav.hello')},{' '}
                            <strong className="font-black text-teal-100">
                                {userName || t('common.unknown')}
                            </strong>
                        </span>

                        {/* Language Switcher */}
                        <button
                            onClick={toggleLanguage}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-transparent hover:bg-white/10 transition-all cursor-pointer"
                        >
                            {language === 'en' ? t('nav.changeLanguage') : t('nav.changeLanguage')}
                        </button>

                        {/* Notifications Icon & Badge Dropdown Container */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="p-2 rounded-full hover:bg-white/10 transition-all relative flex items-center justify-center cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-[#00796b]">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown Card */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 text-gray-800 py-2 overflow-hidden">
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            navigate('/notifications');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm font-bold text-[#00796b] hover:bg-gray-50 block transition-colors cursor-pointer"
                                    >
                                        View all notifications
                                    </button>
                                    <div className="border-b border-gray-100 my-1"></div>
                                    
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-gray-400 text-center font-medium">
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => handleNotificationSelect(n)}
                                                    className={`px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 text-left transition-colors ${!n.read ? 'bg-teal-50/40' : ''}`}
                                                >
                                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{n.title}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-2">{n.body}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Button */}
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-white/10 transition-all cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            <span className="hidden md:inline">{t('nav.profile')}</span>
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs md:text-sm font-black bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer transform active:scale-98"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                            </svg>
                            {t('nav.logout')}
                        </button>

                    </div>
                </div>
            </div>
        </nav>
    );
};