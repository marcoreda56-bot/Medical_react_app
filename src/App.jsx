import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './App.css';

import Login from './pages/login';
import Register from './pages/register';
import { Profile } from './pages/Profile.jsx';
import NotificationsPage from './pages/Notifications.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import AppointmentDetail from './pages/AppointmentDetail.jsx';

import RoleRoute from './routes/RoleRoute';
import { DoctorDashBoard } from './dashboards/DoctorDashBoard';
import { PatientDashBoard } from './dashboards/PatientDashBoard';
import { AdminDashBoard } from './features/admin/AdminDashBoard';
import { VerifyOTP } from './pages/VerifyOTP';

import { useAuth } from './context/AuthContext';
import { Navbar } from './components/NavBar.jsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function AppContent() {
    const { currentUser, userRole, loading } = useAuth();
    const { t } = useLanguage();

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <h3>{t('common.loading')}</h3>
            </div>
        );
    }

    const getRedirectPath = () => {
        if (userRole === 'doctor') return '/doctor';
        if (userRole === 'patient') return '/patient';
        if (userRole === 'admin') return '/admin';
        return '/login';
    };

    return (
        <>
            <Navbar />
            <Routes>
                {/* Auth Routes */}
                <Route
                    path="/login"
                    element={
                        currentUser ? (
                            <Navigate to={getRedirectPath()} replace />
                        ) : (
                            <Login />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        currentUser ? (
                            <Navigate to={getRedirectPath()} replace />
                        ) : (
                            <Register />
                        )
                    }
                />

                {/* OTP Verification Route */}
                <Route path="/verify-otp" element={<VerifyOTP />} />

                {/* Core Protected Routes */}
                <Route
                    path="/profile"
                    element={
                        currentUser ? (
                            <Profile />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/notifications"
                    element={
                        currentUser ? (
                            <NotificationsPage />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/appointments/:id"
                    element={
                        currentUser ? (
                            <AppointmentDetail />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Dashboards Base Routes Role-Based */}
                <Route
                    path="/doctor"
                    element={
                        <RoleRoute allowedRoles={['doctor']}>
                            <DoctorDashBoard />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/patient"
                    element={
                        <RoleRoute allowedRoles={['patient']}>
                            <PatientDashBoard />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <RoleRoute allowedRoles={['admin']}>
                            <AdminDashBoard />
                        </RoleRoute>
                    }
                />

                {/* Home & Fallback Redirection */}
                <Route path="/" element={<Landing />} />
                <Route
                    path="/home"
                    element={
                        currentUser ? <Home /> : <Navigate to="/login" replace />
                    }
                />
                <Route
                    path="*"
                    element={
                        <Navigate
                            to={currentUser ? getRedirectPath() : '/'}
                            replace
                        />
                    }
                />
            </Routes>
        </>
    );
}

function App() {
    const theme = createTheme({
        palette: {
            primary: {
                main: '#006d77',
                dark: '#004f57',
            },
            secondary: {
                main: '#ef8354',
            },
            background: {
                default: '#f6f8fb',
            },
        },
        shape: {
            borderRadius: 8,
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            button: {
                textTransform: 'none',
                fontWeight: 700,
            },
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        border: '1px solid rgba(15, 23, 42, 0.08)',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
            MuiTableHead: {
                styleOverrides: {
                    root: {
                        '& .MuiTableCell-root': {
                            fontWeight: 800,
                        },
                    },
                },
            },
        },
    });

    return (
        <LanguageProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                    <AppContent />
                </Router>
            </ThemeProvider>
        </LanguageProvider>
    );
}

export default App;