import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api'; 
import Swal from 'sweetalert2';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false); 

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  const validateForm = () => {
    if (name.trim().length < 3) {
      Toast.fire({ icon: 'error', title: t('register.toast.invalidName') });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.fire({ icon: 'error', title: t('register.toast.invalidEmail') });
      return false;
    }
    if (password.length < 6) {
      Toast.fire({ icon: 'error', title: t('register.toast.invalidPassword') });
      return false;
    }
    if (password !== confirmPassword) {
      Toast.fire({ icon: 'error', title: t('register.toast.passwordMismatch') });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || loading) return;

    setLoading(true);

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const userData = {
      username: email, 
      email: email,
      password: password,
      role: role,
      first_name: firstName,
      last_name: lastName,
      phone: ''
    };

    try {
      await authAPI.register(userData);
      
      Swal.fire({
        title: 'Account Registered',
        text: 'Please check your email. We have sent a verification code (OTP) to activate your account.',
        icon: 'success',
        confirmButtonColor: '#00796b',
        confirmButtonText: 'Enter OTP',
      }).then(() => {
        navigate('/verify-otp', { state: { email: email } });
      });
    } catch (err) {
      console.error(err);
      Toast.fire({ 
        icon: 'error', 
        title: err.response?.data?.error || err.message || t('register.toast.failed') 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
      
      <div 
        className="hidden sm:flex sm:w-4/12 md:w-7/12 bg-cover bg-center relative items-center justify-center p-12"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-hospital-dark/85 to-hospital/60" />
        <div className="relative z-10 max-w-xl text-white text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-xs">
            {t('register.title')}
          </h1>
          <p className="text-base md:text-lg text-white/95 leading-relaxed font-normal">
            {t('register.subtitle')}
          </p>
        </div>
      </div>

      <div className="w-full sm:w-8/12 md:w-5/12 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 flex flex-col items-center my-auto">
          
          <div className="w-14 h-14 rounded-2xl bg-hospital-light border-2 border-hospital flex items-center justify-center mb-3 text-hospital shadow-xs">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-hospital tracking-tight">{t('register.title')}</h2>
          <p className="text-sm text-gray-400 mt-1 mb-6 text-center font-medium">{t('register.subtitle')}</p>

          <form onSubmit={handleSubmit} noValidate className="w-full space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block pl-1">{t('register.fullName')}</label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-hospital focus:bg-white transition-all text-sm font-medium text-gray-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block pl-1">{t('register.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-hospital focus:bg-white transition-all text-sm font-medium text-gray-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block pl-1">{t('register.password')}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-hospital focus:bg-white transition-all text-sm font-medium text-gray-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block pl-1">{t('register.confirmPassword')}</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-hospital focus:bg-white transition-all text-sm font-medium text-gray-800"
              />
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-hospital block uppercase tracking-wider">{t('register.roleLabel')}</span>
              <div className="flex gap-6 pl-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={role === 'patient'}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-4 h-4 text-hospital border-gray-300 focus:ring-hospital"
                  />
                  {t('register.patient')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                  <input
                    type="radio"
                    name="role"
                    value="doctor"
                    checked={role === 'doctor'}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-4 h-4 text-hospital border-gray-300 focus:ring-hospital"
                  />
                  {t('register.doctor')}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-hospital hover:bg-hospital-dark text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-teal-700/10 hover:shadow-lg hover:shadow-teal-800/20 transition-all text-base cursor-pointer transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Subscribing...' : t('register.signUp')}
            </button>

            <div className="pt-2 text-center">
              <p className="text-sm text-gray-500 font-medium">
                {t('register.existingAccount')}{' '}
                <Link to="/login" className="text-hospital hover:text-hospital-dark font-bold transition-colors ml-1">
                  {t('register.signIn')}
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};

export default Register;