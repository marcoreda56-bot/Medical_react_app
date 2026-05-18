import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import Swal from 'sweetalert2';

export const NavBar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Logged out successfully',
        showConfirmButton: false,
        timer: 2000
      });
      navigate('/login');
    } catch (error) {
      console.error("Logout failed: ", error);
    }
  };

  return (
    <AppBar position="static" sx={{ bgcolor: '#00796b' }}>
      <Toolbar>
        {/* Logo and Brand Name */}
        <IconButton edge="start" color="inherit" component={Link} to="/">
          <LocalHospitalIcon sx={{ mr: 1 }} />
        </IconButton>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
          CarePulse
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {currentUser && (
            <Button color="inherit" component={Link} to="/">
              Home
            </Button>
          )}

          {/* Doctor Links */}
          {currentUser && userRole === 'doctor' && (
            <Button color="inherit" component={Link} to="/doctor">
              Doctor Dashboard
            </Button>
          )}

          {/* Patient Links */}
          {currentUser && userRole === 'patient' && (
            <Button color="inherit" component={Link} to="/patient">
              My Appointments
            </Button>
          )}

          {/* Admin Links */}
          {currentUser && userRole === 'admin' && (
            <Button color="inherit" component={Link} to="/admin">
              Admin Panel
            </Button>
          )}

          {/* Right Side: Auth Buttons */}
          {!currentUser ? (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" variant="outlined" component={Link} to="/register" sx={{ borderColor: 'white', '&:hover': { borderColor: '#e0f2f1', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                Register
              </Button>
            </>
          ) : (
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleLogout}
              sx={{ fontWeight: 'bold' }}
            >
              Logout
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;