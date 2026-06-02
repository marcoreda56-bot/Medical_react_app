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
import { useNotifications } from '../context/NotificationsContext';
import { useNavigate } from 'react-router-dom';
import { DoctorReviews } from '../components/DoctorReviews';

const Home = () => {
    const { currentUser, userRole, userName } = useAuth();
    const { notifications, markAsRead } = useNotifications();
    const navigate = useNavigate();
    const recent = useMemo(() => notifications.slice(0, 5), [notifications]);

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
            title: 'Easy Booking',
            desc: 'Schedule appointments in a few clicks and get reminders.',
            icon: '🗓️',
        },
        {
            title: 'Trusted Care',
            desc: 'Verified professionals and secure medical records.',
            icon: '🩺',
        },
        {
            title: 'Fast Messaging',
            desc: 'Direct secure messaging with your care team.',
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
                            Welcome{userName ? `, ${userName}` : ''}!
                        </Typography>
                        <Typography sx={{ mt: 1, opacity: 0.95 }}>
                            {userRole === 'doctor' &&
                                'Manage your schedule, patient requests and reviews from one place.'}
                            {userRole === 'patient' &&
                                'Find care, book appointments and message your providers quickly.'}
                            {userRole === 'admin' &&
                                'Overview system health and pending tasks.'}
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
                                Open Dashboard
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/notifications')}
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.3)',
                                }}
                            >
                                View Notifications
                            </Button>
                        </Box>
                    </Paper>

                    {/* Features */}
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        Key Features
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
                        What people say
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
                            <Avatar sx={{ bgcolor: '#006d77' }}>
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
                                Profile
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => navigate('/appointments')}
                            >
                                Appointments
                            </Button>
                        </Box>

                        <Typography
                            variant="subtitle1"
                            sx={{ mb: 1, fontWeight: 700 }}
                        >
                            Recent Notifications
                        </Typography>

                        {recent.length === 0 ? (
                            <Typography color="text.secondary">
                                No recent notifications.
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
                                                label="New"
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
                            Quick Links
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
                                My Visits
                            </Button>
                            <Button
                                onClick={() => navigate('/notifications')}
                                variant="text"
                            >
                                All Notifications
                            </Button>
                            <Button
                                onClick={() => navigate('/support')}
                                variant="text"
                            >
                                Support
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Home;
