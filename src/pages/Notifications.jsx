import { useNotifications } from '../context/NotificationsContext';
import {
    Container,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Box,
} from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../api/axios';

const NotificationsPage = () => {
    const { notifications, markAsRead } = useNotifications();
    // const navigate = useNavigate();

    // const handleOpen = async (n) => {
    //     try {
    //         if (!n.read) await markAsRead(n.id);
    //         if (n.data?.appointmentId)
    //             navigate(`/appointments/${n.data.appointmentId}`);
    //         else navigate('/notifications');
    //     } catch (err) {
    //         console.error(err);
    //     }
    // };

    const handleDelete = async (n) => {
        const res = await Swal.fire({
            title: 'Delete notification?',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            icon: 'warning',
        });
        if (res.isConfirmed) {
            try {
                await axiosInstance.delete(`/notifications/${n.id}/`);
                Swal.fire('Deleted', '', 'success');
            } catch (err) {
                console.error(err);
                Swal.fire('Failed to delete', '', 'error');
            }
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }} elevation={3}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Notifications
                    </Typography>
                    <Chip
                        label={`${notifications.filter((n) => !n.read).length} unread`}
                        color="primary"
                    />
                </Box>

                {notifications.length === 0 ? (
                    <Typography color="textSecondary">
                        No notifications yet.
                    </Typography>
                ) : (
                    <List>
                        {notifications.map((n) => (
                            <ListItem
                                key={n.id}
                                divider
                                alignItems="flex-start"
                                sx={{
                                    backgroundColor: n.read
                                        ? 'transparent'
                                        : 'action.hover',
                                    transition: 'background-color 0.3s ease',
                                    borderRadius: '4px',
                                    mb: 0.5,
                                    '&:hover': {
                                        backgroundColor: n.read
                                            ? 'action.hover'
                                            : 'action.selected',
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontWeight: n.read
                                                    ? 'normal'
                                                    : 'bold',
                                            }}
                                        >
                                            {n.title}
                                        </Typography>
                                    }
                                    secondary={n.body}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleOpen(n)}
                                        title="Open"
                                        sx={{ mr: 1 }}
                                    >
                                        <OpenInNewIcon />
                                    </IconButton>
                                    {!n.read && (
                                        <IconButton
                                            edge="end"
                                            onClick={() => markAsRead(n.id)}
                                            title="Mark as read"
                                            color="success"
                                            sx={{ mr: 1 }}
                                        >
                                            <DoneIcon />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDelete(n)}
                                        title="Delete"
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>
        </Container>
    );
};

export default NotificationsPage;
