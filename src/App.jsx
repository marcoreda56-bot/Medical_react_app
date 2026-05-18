import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './pages/login';
import Register from './pages/register';
import { Home } from './pages/Home';
import RoleRoute from './routes/RoleRoute';
import { DoctorDashBoard } from './dashboards/DoctorDashBoard';
import { PatientDashBoard } from './dashboards/PatientDashBoard';
import { AdminDashBoard } from './dashboards/AdminDashBoard';
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h3>Loading CarePulse...</h3>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" replace /> : <Login />}
        />          
        
        <Route path='/register' element={<Register />} />
        
        <Route path='/' element={<Home />} />

        <Route path='/doctor' element={
          <RoleRoute allowedRoles={["doctor"]}> 
            <DoctorDashBoard />
          </RoleRoute>
        } />
        
        <Route path='/patient' element={
          <RoleRoute allowedRoles={["patient"]}> 
            <PatientDashBoard />
          </RoleRoute>
        } />
        
        <Route path='/admin' element={
          <RoleRoute allowedRoles={["admin"]}> 
            <AdminDashBoard />
          </RoleRoute>
        } />
      </Routes>
    </>
  );
}

export default App;