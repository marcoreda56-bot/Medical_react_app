import {
    Avatar,
    Box,
    Button,
    Chip,
    Container,
    Grid,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const stats = [
    { label: 'Doctors', value: '120+' },
    { label: 'Specialties', value: '35+' },
    { label: 'Patient visits', value: '18k' },
];

const features = [
    {
        icon: <MedicalServicesIcon />,
        title: 'Find the right doctor',
        text: 'Browse specialties, doctor profiles, clinic notes, and available appointment slots.',
    },
    {
        icon: <CalendarMonthIcon />,
        title: 'Book in minutes',
        text: 'Choose a day and time, then track request status from your patient dashboard.',
    },
    {
        icon: <CreditCardIcon />,
        title: 'Simple payments',
        text: 'Patients can pay appointment fees from their booking history.',
    },
];

const Landing = () => {
    const navigate = useNavigate();
    const { currentUser, userRole } = useAuth();

    const dashboardPath =
        userRole === 'doctor' ? '/doctor' : userRole === 'admin' ? '/admin' : '/patient';

    return (
        <Box sx={{ bgcolor: '#f6f8fb', minHeight: '100vh' }}>
            <Box
                sx={{
                    minHeight: { xs: 'auto', md: '76vh' },
                    display: 'flex',
                    alignItems: 'center',
                    py: { xs: 6, md: 8 },
                    background:
                        'linear-gradient(135deg, rgba(0,109,119,0.96), rgba(19,84,122,0.92)), url(/icons.svg)',
                    backgroundSize: 'cover',
                    color: '#fff',
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={5} alignItems="center">
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Chip
                                icon={<VerifiedUserIcon />}
                                label="Trusted medical booking portal"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.16)',
                                    color: '#fff',
                                    mb: 3,
                                    '& .MuiChip-icon': { color: '#fff' },
                                }}
                            />
                            <Typography
                                variant="h2"
                                component="h1"
                                sx={{
                                    fontWeight: 900,
                                    maxWidth: 720,
                                    fontSize: { xs: '2.4rem', md: '4.4rem' },
                                    lineHeight: 1.02,
                                    mb: 2,
                                }}
                            >
                                CarePulse
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{ color: 'rgba(255,255,255,0.86)', maxWidth: 700, mb: 4 }}
                            >
                                Book appointments, view doctor details, manage prescriptions, and pay
                                visit fees from one clean healthcare workspace.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    onClick={() => navigate(currentUser ? dashboardPath : '/register')}
                                >
                                    {currentUser ? 'Open Dashboard' : 'Create Account'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={() => navigate(currentUser ? '/home' : '/login')}
                                    sx={{
                                        color: '#fff',
                                        borderColor: 'rgba(255,255,255,0.7)',
                                        '&:hover': {
                                            borderColor: '#fff',
                                            bgcolor: 'rgba(255,255,255,0.08)',
                                        },
                                    }}
                                >
                                    {currentUser ? 'View Home' : 'Sign In'}
                                </Button>
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.94)',
                                    color: '#102a43',
                                }}
                            >
                                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900 }}>
                                    Today at CarePulse
                                </Typography>
                                <Stack spacing={2} sx={{ mt: 2 }}>
                                    {stats.map((item) => (
                                        <Box
                                            key={item.label}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                py: 1.5,
                                                borderBottom: '1px solid #e8eef5',
                                            }}
                                        >
                                            <Typography color="text.secondary">{item.label}</Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                                {item.value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Grid container spacing={3}>
                    {features.map((feature) => (
                        <Grid size={{ xs: 12, md: 4 }} key={feature.title}>
                            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>{feature.icon}</Avatar>
                                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                                    {feature.title}
                                </Typography>
                                <Typography color="text.secondary">{feature.text}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default Landing;
