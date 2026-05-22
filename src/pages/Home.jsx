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
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { userRole, userName } = useAuth();
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

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper sx={{ p: 4 }} elevation={3}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Welcome{userName ? `, ${userName}` : ''}!
                </Typography>
                <Typography
                    variant="subtitle1"
                    color="textSecondary"
                    sx={{ mb: 3 }}
                >
                    {userRole === 'doctor' &&
                        'Here are your latest requests and schedule highlights.'}
                    {userRole === 'patient' &&
                        'Quick actions: book a visit, view your appointments and messages.'}
                    {userRole === 'admin' &&
                        'Admin overview: check pending approvals and system activity.'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                        variant="contained"
                        onClick={() =>
                            navigate(
                                userRole === 'doctor'
                                    ? '/doctor'
                                    : userRole === 'patient'
                                      ? '/patient'
                                      : '/admin'
                            )
                        }
                    >
                        Go to Dashboard
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/notifications')}
                    >
                        View All Notifications
                    </Button>
                </Box>

                <Typography variant="h6" sx={{ mb: 1 }}>
                    Recent Notifications
                </Typography>
                {recent.length === 0 ? (
                    <Typography color="textSecondary">
                        No recent notifications.
                    </Typography>
                ) : (
                    <List>
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
        </Container>
    );
};

export default Home;
