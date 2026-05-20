import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/login';
import Register from './pages/register';
import RoleRoute from './routes/RoleRoute';
import { DoctorDashBoard } from './dashboards/DoctorDashBoard';
import { PatientDashBoard } from './dashboards/PatientDashBoard';
import { AdminDashBoard } from './features/admin/AdminDashBoard';
import { useAuth } from './context/AuthContext';
import { Navbar } from "./components/NavBar.jsx"; 
import { Profile } from './pages/Profile.jsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function AppContent() {
  const { currentUser, userRole, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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
        <Route
          path="/login"
          element={currentUser ? <Navigate to={getRedirectPath()} replace /> : <Login />}
        />
        <Route
          path="/register"
          element={currentUser ? <Navigate to={getRedirectPath()} replace /> : <Register />}
        />
        <Route
          path="/profile"
          element={currentUser ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={<Navigate to={currentUser ? getRedirectPath() : '/login'} replace />}
        />
        <Route
          path="/doctor"
          element={
            <RoleRoute allowedRoles={["doctor"]}>
              <DoctorDashBoard />
            </RoleRoute>
          }
        />
        <Route
          path="/patient"
          element={
            <RoleRoute allowedRoles={["patient"]}>
              <PatientDashBoard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDashBoard />
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to={currentUser ? getRedirectPath() : '/login'} replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App;