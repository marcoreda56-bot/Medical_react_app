import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Swal from 'sweetalert2';
import {
    Grid,
    Box,
    Paper,
    Avatar,
    Typography,
    TextField,
    Button,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormLabel,
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
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    const validateForm = () => {
        if (name.trim().length < 3) {
            Toast.fire({
                icon: 'error',
                title: t('register.toast.invalidName'),
            });
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toast.fire({
                icon: 'error',
                title: t('register.toast.invalidEmail'),
            });
            return false;
        }
        if (password.length < 6) {
            Toast.fire({
                icon: 'error',
                title: t('register.toast.invalidPassword'),
            });
            return false;
        }
        if (password !== confirmPassword) {
            Toast.fire({
                icon: 'error',
                title: t('register.toast.passwordMismatch'),
            });
            return false;
        }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            const [first_name, ...rest] = name.trim().split(' ');
            const last_name = rest.join(' ');
            const username =
                email.split('@')[0] + Math.floor(Math.random() * 1000);
            await axiosInstance.post('/register/', {
                username,
                email,
                password,
                role,
                first_name,
                last_name,
            });
            setRegisteredEmail(email);
            setOtpSent(true);
            Toast.fire({ icon: 'success', title: 'OTP sent to your email!' });
        } catch (err) {
            const msg =
                err.response?.data?.error || err.response?.data?.email?.[0];
            if (msg?.toLowerCase().includes('email')) {
                Toast.fire({
                    icon: 'error',
                    title: t('register.toast.emailInUse'),
                });
            } else {
                Toast.fire({
                    icon: 'error',
                    title: t('register.toast.failed'),
                });
            }
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp.trim()) {
            Toast.fire({ icon: 'error', title: 'Please enter the OTP code.' });
            return;
        }
        try {
            await axiosInstance.post('/auth/verify-otp/', {
                email: registeredEmail,
                otp,
            });
            Swal.fire({
                title: t('register.toast.successTitle'),
                text: t('register.toast.successText'),
                icon: 'success',
                confirmButtonColor: '#00796b',
                confirmButtonText: t('login.signIn'),
            }).then(() => navigate('/login'));
        } catch (err) {
            Toast.fire({
                icon: 'error',
                title: err.response?.data?.error || 'Invalid or expired OTP.',
            });
        }
    };

    if (otpSent) {
        return (
            <Grid container component="main" sx={{ height: '100vh' }}>
                <Grid
                    item
                    xs={12}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#fafafa',
                    }}
                >
                    <Box
                        sx={{
                            p: 4,
                            bgcolor: '#fff',
                            borderRadius: 4,
                            boxShadow: '0px 10px 30px rgba(0,0,0,0.08)',
                            width: '100%',
                            maxWidth: '420px',
                        }}
                    >
                        <Avatar
                            sx={{
                                m: '0 auto 16px',
                                bgcolor: '#e0f2f1',
                                width: 60,
                                height: 60,
                                border: '2px solid #00796b',
                            }}
                        >
                            <LocalHospitalIcon
                                sx={{ color: '#00796b', fontSize: 32 }}
                            />
                        </Avatar>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 'bold',
                                color: '#00796b',
                                textAlign: 'center',
                                mb: 1,
                            }}
                        >
                            Verify Your Email
                        </Typography>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ textAlign: 'center', mb: 3 }}
                        >
                            We sent a 6-digit code to{' '}
                            <strong>{registeredEmail}</strong>
                        </Typography>
                        <Box
                            component="form"
                            onSubmit={handleVerifyOTP}
                            noValidate
                        >
                            <TextField
                                fullWidth
                                required
                                label="OTP Code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                inputProps={{ maxLength: 6 }}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00796b',
                                        },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#00796b',
                                    },
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{
                                    py: 1.4,
                                    bgcolor: '#00796b',
                                    '&:hover': { bgcolor: '#004d40' },
                                    fontWeight: 'bold',
                                    borderRadius: 2.5,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                }}
                            >
                                Verify & Continue
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        );
    }

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>
            <Grid
                item
                xs={false}
                sm={4}
                md={7}
                sx={{
                    backgroundImage:
                        'url(https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80)',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                            ? theme.palette.grey[50]
                            : theme.palette.grey[900],
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background:
                            'linear-gradient(135deg, rgba(0, 77, 64, 0.85) 0%, rgba(0, 121, 107, 0.6) 100%)',
                    },
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        color: '#fff',
                        px: 6,
                        textAlign: 'left',
                        maxWidth: '600px',
                    }}
                >
                    <Typography
                        variant="h3"
                        component="h1"
                        sx={{ fontWeight: 'bold', mb: 2, letterSpacing: 1 }}
                    >
                        {t('register.title')}
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            opacity: 0.9,
                            fontWeight: 'normal',
                            lineHeight: 1.6,
                        }}
                    >
                        {t('register.subtitle')}
                    </Typography>
                </Box>
            </Grid>

            <Grid
                item
                xs={12}
                sm={8}
                md={5}
                component={Paper}
                elevation={0}
                square
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#fafafa',
                    overflowY: 'auto',
                }}
            >
                <Box
                    sx={{
                        my: 4,
                        mx: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '420px',
                        p: 3,
                        bgcolor: '#fff',
                        borderRadius: 4,
                        boxShadow: '0px 10px 30px rgba(0,0,0,0.04)',
                    }}
                >
                    <Avatar
                        sx={{
                            m: 1,
                            bgcolor: '#e0f2f1',
                            width: 60,
                            height: 60,
                            border: '2px solid #00796b',
                        }}
                    >
                        <LocalHospitalIcon
                            sx={{ color: '#00796b', fontSize: 32 }}
                        />
                    </Avatar>
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{ fontWeight: '800', color: '#00796b', mt: 1 }}
                    >
                        {t('register.title')}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mb: 2, mt: 0.5 }}
                    >
                        {t('register.subtitle')}
                    </Typography>

                    <Box
                        component="form"
                        onSubmit={handleRegister}
                        noValidate
                        sx={{ width: '100%' }}
                    >
                        {[
                            {
                                label: t('register.fullName'),
                                value: name,
                                setter: setName,
                                type: 'text',
                            },
                            {
                                label: t('register.email'),
                                value: email,
                                setter: setEmail,
                                type: 'email',
                            },
                            {
                                label: t('register.password'),
                                value: password,
                                setter: setPassword,
                                type: 'password',
                            },
                            {
                                label: t('register.confirmPassword'),
                                value: confirmPassword,
                                setter: setConfirmPassword,
                                type: 'password',
                            },
                        ].map((field) => (
                            <TextField
                                key={field.label}
                                margin="dense"
                                required
                                fullWidth
                                label={field.label}
                                type={field.type}
                                value={field.value}
                                onChange={(e) => field.setter(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00796b',
                                        },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#00796b',
                                    },
                                }}
                            />
                        ))}

                        <Box
                            sx={{
                                mt: 2,
                                mb: 1,
                                p: 1.5,
                                borderRadius: 2,
                                border: '1px solid #e0e0e0',
                                textAlign: 'left',
                            }}
                        >
                            <FormLabel
                                component="legend"
                                sx={{
                                    color: '#00796b',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    mb: 0.5,
                                }}
                            >
                                {t('register.roleLabel')}
                            </FormLabel>
                            <RadioGroup
                                row
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <FormControlLabel
                                    value="patient"
                                    control={
                                        <Radio
                                            sx={{
                                                color: '#00796b',
                                                '&.Mui-checked': {
                                                    color: '#00796b',
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography
                                            sx={{
                                                fontSize: '0.95rem',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {t('register.patient')}
                                        </Typography>
                                    }
                                />
                                <FormControlLabel
                                    value="doctor"
                                    control={
                                        <Radio
                                            sx={{
                                                color: '#00796b',
                                                '&.Mui-checked': {
                                                    color: '#00796b',
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography
                                            sx={{
                                                fontSize: '0.95rem',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {t('register.doctor')}
                                        </Typography>
                                    }
                                />
                            </RadioGroup>
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                mb: 2,
                                padding: 1.4,
                                bgcolor: '#00796b',
                                '&:hover': { bgcolor: '#004d40' },
                                fontWeight: 'bold',
                                borderRadius: 2.5,
                                textTransform: 'none',
                                fontSize: '1rem',
                            }}
                        >
                            {t('register.signUp')}
                        </Button>
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">
                                {t('register.existingAccount')}{' '}
                                <Link
                                    to="/login"
                                    style={{
                                        color: '#00796b',
                                        textDecoration: 'none',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {t('register.signIn')}
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Register;
