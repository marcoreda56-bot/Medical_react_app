import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import {
  Container, Paper, Typography, TextField, Button, Box, Grid, Avatar, Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import Swal from 'sweetalert2';
import { useLanguage } from '../context/LanguageContext';

export const Profile = () => {
  const { currentUser, userRole } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
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
        console.error('Error fetching profile:', err);
        Toast.fire({ icon: 'error', title: t('profile.failedLoad') });
      }
    };

    fetchProfileData();
  }, [currentUser, userRole, t]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      Toast.fire({ icon: 'error', title: t('profile.nameRequired') });
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { name });

      if (userRole === 'doctor') {
        const docProfileRef = doc(db, 'doctors_profiles', currentUser.uid);
        await setDoc(
          docProfileRef,
          {
            doctor_id: currentUser.uid,
            specialty,
            bio,
          },
          { merge: true }
        );
      }

      Swal.fire({
        icon: 'success',
        title: t('profile.updated'),
        text: t('profile.updatedText'),
        confirmButtonColor: '#00796b',
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      Toast.fire({ icon: 'error', title: t('profile.failedSave') });
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
              {t('profile.title')}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#00796b' }}>
              {t('profile.accountType')}: {t(`roles.${userRole}`)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box component="form" onSubmit={handleSave} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('register.fullName')}
                fullWidth
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label={t('login.email')}
                fullWidth
                variant="outlined"
                value={email}
                disabled
                helperText={t('profile.emailHelp')}
              />
            </Grid>

            {userRole === 'doctor' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label={t('profile.specialty')}
                    fullWidth
                    variant="outlined"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder={t('profile.specialty')}
                    helperText={t('profile.bio')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('profile.bio')}
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('profile.bio')}
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
                  borderRadius: 2,
                }}
              >
                {loading ? t('profile.savingChanges') : t('profile.saveProfile')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};