import  { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { 
  Container, Paper, Typography, TextField, Button, Box, Grid, Avatar, Divider 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import Swal from 'sweetalert2';

export const Profile = () => {
  const { currentUser, userRole } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  
  const [loading, setLoading] = useState(false);

  const Toast = Swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchProfileData = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setName(userData.name || '');
          setEmail(userData.email || '');
        }

        if (userRole === 'doctor') {
          const docProfileRef = doc(db, 'doctors_profiles', currentUser.uid);
          const docProfileSnap = await getDoc(docProfileRef);
          
          if (docProfileSnap.exists()) {
            const profileData = docProfileSnap.data();
            setSpecialty(profileData.specialty || '');
            setBio(profileData.bio || '');
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        Toast.fire({ icon: 'error', title: 'Failed to load profile data.' });
      }
    };

    fetchProfileData();
  }, [currentUser, userRole]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      Toast.fire({ icon: 'error', title: 'Name field cannot be empty!' });
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { name: name });

      if (userRole === 'doctor') {
        const docProfileRef = doc(db, 'doctors_profiles', currentUser.uid);
        await setDoc(docProfileRef, {
          doctor_id: currentUser.uid,
          specialty: specialty,
          bio: bio
        }, { merge: true });
      }

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your personal settings have been saved successfully.',
        confirmButtonColor: '#00796b'
      });
      
    } catch (err) {
      console.error("Error updating profile:", err);
      Toast.fire({ icon: 'error', title: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ width: 60, height: 60, bgcolor: '#00796b' }}>
            <PersonIcon sx={{ fontSize: 35 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              My Profile Settings
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#00796b' }}>
              Account Type: {userRole}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box component="form" onSubmit={handleSave} noValidate>
          <Grid container spacing={3}>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name"
                fullWidth
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                fullWidth
                variant="outlined"
                value={email}
                disabled 
                helperText="Email account cannot be changed"
              />
            </Grid>

            {userRole === 'doctor' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Medical Specialty )"
                    fullWidth
                    variant="outlined"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g., Cardiologist, Dentist, Pediatrician"
                    helperText="This helps patients find you easily when booking"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Professional Bio "
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief background about your experience, clinics, or certifications..."
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'end' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<SaveIcon />}
                sx={{ 
                  bgcolor: '#00796b', 
                  '&:hover': { bgcolor: '#004d40' },
                  fontWeight: 'bold',
                  px: 4,
                  borderRadius: 2
                }}
              >
                {loading ? 'Saving Changes...' : 'Save Profile'}
              </Button>
            </Grid>

          </Grid>
        </Box>

      </Paper>
    </Container>
  );
};