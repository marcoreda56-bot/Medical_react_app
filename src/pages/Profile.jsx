import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Grid,
    Avatar,
    Divider,
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
        if (!currentUser) return;

        const fetchProfile = async () => {
            try {
                const userRes = await axiosInstance.get('/users/me/');
                setName(
                    userRes.data.full_name ||
                        `${userRes.data.first_name} ${userRes.data.last_name}`.trim()
                );
                setEmail(userRes.data.email);

                if (userRole === 'doctor') {
                    const profileRes = await axiosInstance.get(
                        '/doctor-profiles/me/'
                    );
                    setSpecialty(profileRes.data.specialty_name || '');
                    setBio(profileRes.data.bio || '');
                }
            } catch (err) {
                console.error(err);
                Toast.fire({ icon: 'error', title: t('profile.failedLoad') });
            }
        };

        fetchProfile();
    }, [currentUser, userRole]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            Toast.fire({ icon: 'error', title: t('profile.nameRequired') });
            return;
        }

        setLoading(true);
        try {
            const [first_name, ...rest] = name.trim().split(' ');
            const last_name = rest.join(' ');
            await axiosInstance.patch('/users/me/', { first_name, last_name });

            if (userRole === 'doctor') {
                await axiosInstance.patch('/doctor-profiles/me/', { bio });
            }

            Swal.fire({
                icon: 'success',
                title: t('profile.updated'),
                text: t('profile.updatedText'),
                confirmButtonColor: '#00796b',
            });
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: t('profile.failedSave') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 3,
                    }}
                >
                    <Avatar sx={{ width: 60, height: 60, bgcolor: '#00796b' }}>
                        <PersonIcon sx={{ fontSize: 35 }} />
                    </Avatar>
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 'bold', color: '#333' }}
                        >
                            {t('profile.title')}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                color: '#00796b',
                            }}
                        >
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
                                        disabled
                                        helperText="Specialty is managed by the admin"
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
                                    />
                                </Grid>
                            </>
                        )}

                        <Grid
                            item
                            xs={12}
                            sx={{
                                mt: 2,
                                display: 'flex',
                                justifyContent: 'end',
                            }}
                        >
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
                                {loading
                                    ? t('profile.savingChanges')
                                    : t('profile.saveProfile')}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};
