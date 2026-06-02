import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Swal from 'sweetalert2';
import { 
    Paper, Avatar, Typography, TextField, Button, 
    RadioGroup, FormControlLabel, Radio, FormLabel 
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('patient');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [registeredEmail, setRegisteredEmail] = useState('');

    const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
    });

    const validateForm = () => {
        if (name.trim().length < 3) { Toast.fire({ icon: 'error', title: t('register.toast.invalidName') }); return false; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { Toast.fire({ icon: 'error', title: t('register.toast.invalidEmail') }); return false; }
        if (password.length < 6) { Toast.fire({ icon: 'error', title: t('register.toast.invalidPassword') }); return false; }
        if (password !== confirmPassword) { Toast.fire({ icon: 'error', title: t('register.toast.passwordMismatch') }); return false; }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            const [first_name, ...rest] = name.trim().split(' ');
            const last_name = rest.join(' ');
            const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
            await axiosInstance.post('/register/', { username, email, password, role, first_name, last_name });
            setRegisteredEmail(email);
            setOtpSent(true);
        } catch (err) {
            Toast.fire({ icon: 'error', title: t('register.toast.failed') });
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/auth/verify-otp/', { email: registeredEmail, otp });
            Swal.fire({ title: t('register.toast.successTitle'), icon: 'success', confirmButtonText: t('login.signIn') })
                .then(() => navigate('/login'));
        } catch (err) {
            Toast.fire({ icon: 'error', title: 'Invalid or expired OTP.' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Paper elevation={4} className="w-full max-w-5xl flex overflow-hidden rounded-3xl min-h-[600px]">
                
                <div className="hidden md:flex md:w-5/12 bg-teal-900 relative p-12 flex-col justify-center text-white">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-40"></div>
                    <div className="relative z-10">
                        <LocalHospitalIcon sx={{ fontSize: 60 }} />
                        <h2 className="text-4xl font-bold mt-4 mb-6">{t('register.title')}</h2>
                        <p className="text-lg text-teal-100">{t('register.subtitle')}</p>
                    </div>
                </div>

                <div className="w-full md:w-7/12 p-8 lg:p-14 bg-white flex flex-col justify-center">
                    {!otpSent ? (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-3xl font-extrabold text-teal-900">Create an account</h2>
                            <form onSubmit={handleRegister} className="flex flex-col gap-5">
                                <TextField fullWidth label={t('register.fullName')} variant="outlined" onChange={(e) => setName(e.target.value)} />
                                <TextField fullWidth label={t('register.email')} variant="outlined" onChange={(e) => setEmail(e.target.value)} />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <TextField fullWidth label={t('register.password')} type="password" variant="outlined" onChange={(e) => setPassword(e.target.value)} />
                                    <TextField fullWidth label={t('register.confirmPassword')} type="password" variant="outlined" onChange={(e) => setConfirmPassword(e.target.value)} />
                                </div>
                                
                                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                                    <FormLabel className="text-teal-800 font-bold mb-2 block">{t('register.roleLabel')}</FormLabel>
                                    <RadioGroup row value={role} onChange={(e) => setRole(e.target.value)}>
                                        <FormControlLabel value="patient" control={<Radio color="success" />} label={t('register.patient')} />
                                        <FormControlLabel value="doctor" control={<Radio color="success" />} label={t('register.doctor')} />
                                    </RadioGroup>
                                </div>

                                <Button type="submit" fullWidth variant="contained" className="!bg-teal-700 !py-4 !rounded-xl !text-lg !normal-case !mt-2 shadow-lg hover:!bg-teal-800">
                                    {t('register.signUp')}
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <div className="text-center p-6 flex flex-col gap-8">
                            <h2 className="text-3xl font-bold text-teal-900">Activate your account</h2>
                            <p className="text-slate-500">A verification code has been sent to <strong>{registeredEmail}</strong></p>
                            
                            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-8">
                                <div className="w-full">
                                    <TextField 
                                        fullWidth 
                                        label="Enter 6-Digit Code" 
                                        inputProps={{ 
                                            maxLength: 6, 
                                            style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' } 
                                        }} 
                                        onChange={(e) => setOtp(e.target.value)} 
                                    />
                                </div>
                                <Button type="submit" fullWidth variant="contained" className="!bg-teal-700 !py-4 !rounded-xl !text-lg !normal-case">
                                    Activate and Continue
                                </Button>
                            </form>
                        </div>
                    )}

                    <div className="mt-10 text-center text-slate-600">
                        {t('register.existingAccount')}{' '}
                        <Link to="/login" className="text-teal-700 font-bold hover:underline">
                            {t('login.signIn')}
                        </Link>
                    </div>
                </div>
            </Paper>
        </div>
    );
};

export default Register;