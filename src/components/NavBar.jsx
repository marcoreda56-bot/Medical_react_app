import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Navbar = () => {
    const { currentUser, userRole, userName, logout } = useAuth();
    const { t, toggleLanguage, language } = useLanguage();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed: ', err);
        }
    };

    if (!currentUser) return null;

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
                        
                        {/* Welcome Message */}
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