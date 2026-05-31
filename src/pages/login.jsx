import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toast.fire({
                icon: 'error',
                title: t(
                    'login.toast.invalidEmail',
                    'Please enter a valid email address.'
                ),
            });
            return false;
        }
        if (password.length < 6) {
            Toast.fire({
                icon: 'error',
                title: t('login.toast.invalidPassword'),
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            // username in the backend IS the email (set during registration)
            await login(email, password);
            Toast.fire({
                icon: 'success',
                title: t('login.toast.success'),
            });
        } catch (err) {
            Toast.fire({
                icon: 'error',
                title: err.message || t('login.toast.invalidCredentials'),
            });
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
            <div
                className="hidden sm:flex sm:w-4/12 md:w-7/12 bg-cover bg-center relative items-center justify-center p-12"
                style={{
                    backgroundImage:
                        'url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80)',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-hospital-dark/85 to-hospital/60" />

                <div className="relative z-10 max-w-xl text-white text-left">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-xs">
                        {t('login.portalTitle')}
                    </h1>
                    <p className="text-base md:text-lg text-white/95 leading-relaxed font-normal">
                        Empowering healthcare teams and patient coordination
                        through advanced real-time medical insights and seamless
                        schedule automation.
                    </p>
                </div>
            </div>

            <div className="w-full sm:w-8/12 md:w-5/12 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-hospital-light border-2 border-hospital flex items-center justify-center mb-4 text-hospital shadow-xs">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-9 h-9"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-black text-hospital tracking-tight">
                        {t('login.title')}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 mb-8 text-center font-medium">
                        {t('login.subtitle')}
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="w-full space-y-5"
                    >
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block pl-1">
                                {t('login.email', 'Email Address')}
                            </label>
                            <input
                                type="email"
                                required
                                autoFocus
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-hospital focus:bg-white transition-all text-sm font-medium text-gray-800"
                                placeholder="Enter your email address"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block pl-1">
                                {t('login.password')}
                            </label>
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-hospital focus:bg-white transition-all text-sm font-medium text-gray-800"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-6 bg-hospital hover:bg-hospital-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-teal-700/10 hover:shadow-lg hover:shadow-teal-800/20 transition-all text-base cursor-pointer transform active:scale-98"
                        >
                            {t('login.signIn')}
                        </button>

                        <div className="pt-4 text-center">
                            <p className="text-sm text-gray-500 font-medium">
                                {t('login.noAccount')}{' '}
                                <Link
                                    to="/register"
                                    className="text-hospital hover:text-hospital-dark font-bold transition-colors ml-1"
                                >
                                    {t('login.createAccount')}
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
