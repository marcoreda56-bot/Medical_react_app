import  { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Container, TextField, Button, Typography, Box, Paper, Avatar } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

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
      Toast.fire({ icon: 'error', title: 'Please enter a valid email address.' });
      return false;
    }
    if (password.length < 6) {
      Toast.fire({ icon: 'error', title: 'Password must be at least 6 characters.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login(email, password);
      
      Toast.fire({
        icon: 'success',
        title: 'Signed in successfully'
      });
      
      navigate('/'); 
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        Toast.fire({ icon: 'error', title: 'Invalid email or password!' });
      } else {
        Toast.fire({ icon: 'error', title: 'Failed to log in. Please try again.' });
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ padding: 4, marginTop: 10, borderRadius: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: '#00796b', width: 56, height: 56 }}>
            <LocalHospitalIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', color: '#00796b', mb: 1 }}>
            CarePulse
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
            Medical Portal - Sign In
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal" required fullWidth label="Email Address" type="email" autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal" required fullWidth label="Password" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit" fullWidth variant="contained"
              sx={{ mt: 4, mb: 2, padding: 1.2, bgcolor: '#00796b', '&:hover': { bgcolor: '#004d40' }, fontWeight: 'bold', borderRadius: 2 }}
            >
              Sign In
            </Button>

            <Typography variant="body2" sx={{ mt: 2 }}>
              Don't have an account? <Link to="/register" style={{ color: '#00796b', textDecoration: 'none', fontWeight: 'bold' }}>Create Account</Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;