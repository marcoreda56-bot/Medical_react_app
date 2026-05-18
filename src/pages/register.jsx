import  { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  Container, TextField, Button, Typography, Box, 
  RadioGroup, FormControlLabel, Radio, FormLabel, Paper, Avatar 
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('patient');

  // SweetAlert Toast Configuration for Errors
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  const validateForm = () => {
    if (name.trim().length < 3) {
      Toast.fire({ icon: 'error', title: 'Please enter a valid full name (at least 3 characters).' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.fire({ icon: 'error', title: 'Please enter a valid email address.' });
      return false;
    }
    if (password.length < 6) {
      Toast.fire({ icon: 'error', title: 'Password must be at least 6 characters long.' });
      return false;
    }
    if (password !== confirmPassword) {
      Toast.fire({ icon: 'error', title: 'Passwords do not match!' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await register(email, password, name, role);
      
      Swal.fire({
        title: 'Welcome to CarePulse!',
        text: `Your account as a ${role} has been created successfully.`,
        icon: 'success',
        confirmButtonColor: '#00796b',
        confirmButtonText: 'Let\'s Start'
      }).then((result) => {
        if (result.isConfirmed) navigate('/');
      });

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        Toast.fire({ icon: 'error', title: 'This email is already in use!' });
      } else {
        Toast.fire({ icon: 'error', title: 'Registration failed. Try again.' });
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ padding: 4, marginTop: 4, borderRadius: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: '#00796b', width: 56, height: 56 }}>
            <LocalHospitalIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', color: '#00796b', mb: 1 }}>
            CarePulse
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Medical Portal - Create Account
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal" required fullWidth label="Full Name"
              value={name} onChange={(e) => setName(e.target.value)}
            />
            <TextField
              margin="normal" required fullWidth label="Email Address" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal" required fullWidth label="Password" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              margin="normal" required fullWidth label="Confirm Password" type="password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Box sx={{ mt: 2, mb: 1, textAlign: 'left' }}>
              <FormLabel component="legend" sx={{ color: '#00796b', fontWeight: '500' }}>Portal Access Role</FormLabel>
              <RadioGroup row value={role} onChange={(e) => setRole(e.target.value)}>
                <FormControlLabel value="patient" control={<Radio sx={{ color: '#00796b', '&.Mui-checked': { color: '#00796b' } }} />} label="Patient" />
                <FormControlLabel value="doctor" control={<Radio sx={{ color: '#00796b', '&.Mui-checked': { color: '#00796b' } }} />} label="Doctor" />
              </RadioGroup>
            </Box>

            <Button
              type="submit" fullWidth variant="contained"
              sx={{ mt: 2, mb: 2, padding: 1.2, bgcolor: '#00796b', '&:hover': { bgcolor: '#004d40' }, fontWeight: 'bold', borderRadius: 2 }}
            >
              Sign Up
            </Button>

            <Typography variant="body2">
              Already have an account? <Link to="/login" style={{ color: '#00796b', textDecoration: 'none', fontWeight: 'bold' }}>Sign In</Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;