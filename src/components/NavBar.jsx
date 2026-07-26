import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Navbar = () => {
    const { currentUser, userRole, userName, userPicture, logout } = useAuth();
    const { t, toggleLanguage } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const baseUrl = 'http://localhost:8000';
    const avatarUrl = userPicture?.startsWith('/media/') ? `${baseUrl}${userPicture}` : userPicture;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed: ', err);
        }
    };

    if (!currentUser) {
        if (location.pathname === '/login' || location.pathname === '/register')
            return null;

        return (
            <nav className="bg-white border-b border-gray-100 py-4 fixed w-full top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <span
                        onClick={() => navigate('/')}
                        className="text-2xl font-black cursor-pointer text-[#006d77]"
                    >
                        CarePulse 🩺
                    </span>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={toggleLanguage}
                            className="px-3 py-2 border border-[#006d77]/20 rounded-lg text-sm font-bold text-[#006d77] hover:bg-[#006d77]/10 transition-all"
                            aria-label={t('nav.languageLabel')}
                        >
                            {t('nav.changeLanguage')}
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="font-bold text-gray-600 hover:text-[#006d77]"
                        >
                            {t('login.signIn')}
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-5 py-2 bg-[#006d77] text-white rounded-xl font-bold hover:bg-[#004f57] transition-all"
                        >
                            {t('register.signUp')}
                        </button>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-[#00796b] text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-3">
                        <span
                            onClick={() => navigate('/')}
                            className="text-lg font-black cursor-pointer flex items-center gap-1"
                        >
                            CarePulse 🩺
                        </span>
                        <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-md uppercase font-extrabold">
                            {t(`roles.${userRole}`, userRole)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {userRole === 'doctor' && (
                            <button
                                onClick={() => navigate('/doctor')}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-all"
                            >
                                {t('nav.panel')}
                            </button>
                        )}

                        <span className="text-sm font-medium hidden sm:block">
                            {t('nav.hello')},{' '}
                            <strong className="text-teal-100">
                                {userName}
                            </strong>
                        </span>

                        <button
                            type="button"
                            onClick={toggleLanguage}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
                            aria-label={t('nav.languageLabel')}
                        >
                            {t('nav.changeLanguage')}
                        </button>

                        <button
                            onClick={() => navigate('/profile')}
                            className="p-0.5 hover:bg-white/10 rounded-full transition-all overflow-hidden"
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold shadow-md transition-all"
                        >
                            {t('nav.logout')}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
