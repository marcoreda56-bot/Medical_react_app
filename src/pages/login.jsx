import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useLanguage } from '../context/LanguageContext';
import { HospitalIcon } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const { login, loginWithGoogle } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    // ── Redirect helper ───────────────────────────────────────────────────────
    const redirectByRole = (role) => {
        navigate(
            role === 'doctor'  ? '/doctor'  :
            role === 'patient' ? '/patient' : '/admin'
        );
    };

    // ── Email / Password submit ───────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(email, password);
            Toast.fire({ icon: 'success', title: t('login.toast.success') });
            redirectByRole(user.role);
        } catch (err) {
            Toast.fire({ icon: 'error', title: t('login.toast.failed') });
        }
    };

    // ── Google login success ──────────────────────────────────────────────────
    const handleGoogleSuccess = async ({ credential }) => {
        try {
            const user = await loginWithGoogle(credential, 'patient');
            Toast.fire({ icon: 'success', title: t('login.toast.success') });
            redirectByRole(user.role);
        } catch (err) {
            Toast.fire({ icon: 'error', title: t('login.toast.googleFailed') || 'Google login failed.' });
        }
    };

    const handleGoogleError = () => {
        Toast.fire({ icon: 'error', title: t('login.toast.googleFailed') || 'Google login failed.' });
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen w-full">
            {/* Left panel */}
            <div
                className="hidden sm:flex w-0 sm:w-1/3 md:w-7/12 relative bg-cover bg-center items-center justify-center"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80)' }}
            >
                <div className="absolute inset-0 bg-teal-900 bg-opacity-70" />
                <div className="relative px-12 text-white max-w-lg">
                    <h1 className="text-5xl font-bold mb-6">{t('login.portalTitle')}</h1>
                    <p className="text-xl opacity-90 leading-relaxed">
                        Empowering healthcare teams and patient coordination through advanced real-time medical insights.
                    </p>
                </div>
            </div>

            {/* Right panel */}
            <div className="w-full sm:w-2/3 md:w-5/12 flex items-center justify-center bg-gray-50 p-8">
                <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-teal-50 p-4 rounded-full border-2 border-teal-700 mb-4">
                            <HospitalIcon className="text-teal-700 w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-teal-800">{t('login.title')}</h2>
                        <p className="text-gray-500 mt-2">{t('login.subtitle')}</p>
                    </div>

                    {/* Email / password form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 bg-teal-700 hover:bg-teal-900 text-white font-bold rounded-xl transition duration-300"
                        >
                            {t('login.signIn')}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-5 gap-3">
                        <hr className="flex-1 border-gray-200" />
                        <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
                        <hr className="flex-1 border-gray-200" />
                    </div>

                    {/* ✅ Google login button */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="outline"
                            size="large"
                            shape="rectangular"
                            width="100%"
                            text="signin_with"
                        />
                    </div>

                    {/* Register link */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        {t('login.noAccount')}{' '}
                        <Link to="/register" className="text-teal-700 font-bold hover:underline">
                            {t('login.createAccount')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;