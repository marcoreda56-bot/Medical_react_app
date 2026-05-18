import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {  Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  Grid, Box, Paper, Avatar, Typography, TextField, Button 
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const Login = () => {
  const { login } = useAuth();
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
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        Toast.fire({ icon: 'error', title: 'Invalid email or password!' });
      } else {
        Toast.fire({ icon: 'error', title: 'Failed to log in. Please try again.' });
      }
    }
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) => t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(135deg, rgba(0, 77, 64, 0.85) 0%, rgba(0, 121, 107, 0.6) 100%)',
          }
        }}
      >
        <Box sx={{ position: 'relative', color: '#fff', px: 6, textAlign: 'left', maxWidth: '600px' }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2, letterSpacing: 1 }}>
            CarePulse Portal
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 'normal', lineHeight: 1.6 }}>
            Empowering healthcare teams and patient coordination through advanced real-time medical insights and seamless schedule automation.
          </Typography>
        </Box>
      </Grid>

      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={0} square sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa' }}>
        <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', p: 3, bgcolor: '#fff', borderRadius: 4, boxShadow: '0px 10px 30px rgba(0,0,0,0.04)' }}>
          
          <Avatar sx={{ m: 1, bgcolor: '#e0f2f1', width: 64, height: 64, border: '2px solid #00796b' }}>
            <LocalHospitalIcon sx={{ color: '#00796b', fontSize: 35 }} />
          </Avatar>
          
          <Typography component="h1" variant="h4" sx={{ fontWeight: '800', color: '#00796b', mt: 1 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 4, mt: 0.5 }}>
            Please enter your medical portal credentials
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal" required fullWidth label="Email Address" type="email" autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': { borderColor: '#00796b' }
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#00796b' }
              }}
            />
            <TextField
              margin="normal" required fullWidth label="Password" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': { borderColor: '#00796b' }
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#00796b' }
              }}
            />

            <Button
              type="submit" fullWidth variant="contained"
              sx={{ 
                mt: 4, mb: 2, padding: 1.5, 
                bgcolor: '#00796b', 
                '&:hover': { bgcolor: '#004d40', boxShadow: '0px 6px 20px rgba(0, 77, 64, 0.3)' }, 
                fontWeight: 'bold', borderRadius: 2.5, textTransform: 'none', fontSize: '1rem',
                boxShadow: '0px 4px 12px rgba(0, 121, 107, 0.2)'
              }}
            >
              Sign In
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#00796b', textDecoration: 'none', fontWeight: 'bold' }}>
                  Create Portal Account
                </Link>
              </Typography>
            </Box>

          </Box>
        </Box>
      </Grid>

    </Grid>
  );
};

export default Login;