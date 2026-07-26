import { useMemo } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
    Chip,
    Grid,
    Card,
    CardContent,
    Avatar,
    Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';
import { useNavigate } from 'react-router-dom';
import { DoctorReviews } from '../components/DoctorReviews';

const Home = () => {
    const { currentUser, userRole, userName, userPicture } = useAuth();
    const { t } = useLanguage();
    const { notifications, markAsRead } = useNotifications();
    const navigate = useNavigate();
    const recent = useMemo(() => notifications.slice(0, 5), [notifications]);

    const baseUrl = 'http://localhost:8000';
    const avatarUrl = userPicture?.startsWith('/media/') ? `${baseUrl}${userPicture}` : userPicture;

    const openNotification = async (n) => {
        try {
            if (!n.read) await markAsRead(n.id);
            if (n.data?.appointmentId)
                navigate(`/appointments/${n.data.appointmentId}`);
            else navigate('/notifications');
        } catch (err) {
            console.error(err);
        }
    };

    const features = [
        {
            title: t('home.easyBooking'),
            desc: t('home.easyBookingDesc'),
            icon: '🗓️',
        },
        {
            title: t('home.trustedCare'),
            desc: t('home.trustedCareDesc'),
            icon: '🩺',
        },
        {
            title: t('home.fastMessaging'),
            desc: t('home.fastMessagingDesc'),
            icon: '💬',
        },
    ];

    const sampleTestimonials = [
        {
            name: 'Amira H.',
            quote: 'Quick booking and the doctor was very kind. Highly recommend!',
        },
        {
            name: 'Omar K.',
            quote: 'Easy to use and reliable — saved me a lot of time.',
        },
        {
            name: 'Salma R.',
            quote: 'Great follow-up and clear instructions from the clinic.',
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 6 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    {/* Hero */}
                    <Paper
                        elevation={4}
                        sx={{
                            p: 4,
                            mb: 3,
                            background:
                                'linear-gradient(90deg, #006d77 0%, #00796b 100%)',
                            color: 'white',
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            {t('home.welcome')}{userName ? `, ${userName}` : ''}!
                        </Typography>
                        <Typography sx={{ mt: 1, opacity: 0.95 }}>
                            {userRole === 'doctor' &&
                                t('home.manageDoctor')}
                            {userRole === 'patient' &&
                                t('home.findCare')}
                            {userRole === 'admin' &&
                                t('home.overviewSystem')}
                        </Typography>

                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                onClick={() =>
                                    navigate(
                                        userRole
                                            ? userRole === 'doctor'
                                                ? '/doctor'
                                                : userRole === 'patient'
                                                  ? '/patient'
                                                  : '/admin'
                                            : '/login'
                                    )
                                }
                                sx={{ backgroundColor: '#ef8354' }}
                            >
                                {t('home.openDashboard')}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/notifications')}
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.3)',
                                }}
                            >
                                {t('home.viewNotifications')}
                            </Button>
                        </Box>
                    </Paper>

                    {/* Features */}
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        {t('home.keyFeatures')}
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {features.map((f) => (
                            <Grid item xs={12} sm={6} key={f.title}>
                                <Card elevation={1} sx={{ borderRadius: 2 }}>
                                    <CardContent>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                gap: 2,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Avatar sx={{ bgcolor: '#006d77' }}>
                                                {f.icon}
                                            </Avatar>
                                            <Box>
                                                <Typography
                                                    sx={{ fontWeight: 800 }}
                                                >
                                                    {f.title}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        color: 'text.secondary',
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    {f.desc}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Testimonials / Reviews */}
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        {t('home.whatPeopleSay')}
                    </Typography>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                        {userRole === 'doctor' ? (
                            <DoctorReviews doctorId={currentUser?.id} />
                        ) : (
                            <Grid container spacing={2}>
                                {sampleTestimonials.map((t) => (
                                    <Grid item xs={12} sm={6} key={t.name}>
                                        <Card sx={{ borderRadius: 2 }}>
                                            <CardContent>
                                                <Typography
                                                    sx={{ fontWeight: 700 }}
                                                >
                                                    {t.name}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        color: 'text.secondary',
                                                        mt: 1,
                                                    }}
                                                >
                                                    "{t.quote}"
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Avatar sx={{ bgcolor: '#006d77' }} src={avatarUrl}>
                                {userName ? userName[0] : 'U'}
                            </Avatar>
                            <Box>
                                <Typography sx={{ fontWeight: 800 }}>
                                    {userName || 'User'}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        color: 'text.secondary',
                                    }}
                                >
                                    {userRole}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => navigate('/profile')}
                            >
                                {t('home.profile')}
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => navigate('/appointments')}
                            >
                                {t('home.appointments')}
                            </Button>
                        </Box>

                        <Typography
                            variant="subtitle1"
                            sx={{ mb: 1, fontWeight: 700 }}
                        >
                            {t('home.recentNotifications')}
                        </Typography>

                        {recent.length === 0 ? (
                            <Typography color="text.secondary">
                                {t('home.noRecentNotifications')}
                            </Typography>
                        ) : (
                            <List dense>
                                {recent.map((n) => (
                                    <ListItem
                                        key={n.id}
                                        button
                                        onClick={() => openNotification(n)}
                                    >
                                        <ListItemText
                                            primary={n.title}
                                            secondary={n.body}
                                        />
                                        {!n.read && (
                                            <Chip
                                                label={t('home.new')}
                                                color="primary"
                                                size="small"
                                            />
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>

                    <Paper sx={{ p: 3 }} elevation={1}>
                        <Typography sx={{ fontWeight: 800, mb: 1 }}>
                            {t('home.quickLinks')}
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                            }}
                        >
                            <Button
                                onClick={() => navigate('/patient')}
                                variant="text"
                            >
                                {t('home.myVisits')}
                            </Button>
                            <Button
                                onClick={() => navigate('/notifications')}
                                variant="text"
                            >
                                {t('home.allNotifications')}
                            </Button>
                            <Button
                                onClick={() => navigate('/support')}
                                variant="text"
                            >
                                {t('home.support')}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Home;
