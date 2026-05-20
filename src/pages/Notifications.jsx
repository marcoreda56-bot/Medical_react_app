import React from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
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
    Button,
} from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const NotificationsPage = () => {
    const { notifications, markAsRead } = useNotifications();
    const { userRole } = useAuth();
    const navigate = useNavigate();

    const handleOpen = async (n) => {
        try {
            if (!n.read) await markAsRead(n.id);
            if (n.data?.appointmentId)
                navigate(`/appointments/${n.data.appointmentId}`);
            else navigate('/notifications');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (n) => {
        const res = await Swal.fire({
            title: 'Delete notification?',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            icon: 'warning',
        });
        if (res.isConfirmed) {
            try {
                await deleteDoc(doc(db, 'notifications', n.id));
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
                            >
                                <ListItemText
                                    primary={n.title}
                                    secondary={n.body}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        aria-label="open"
                                        onClick={() => handleOpen(n)}
                                        title="Open"
                                    >
                                        <OpenInNewIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        aria-label="mark-read"
                                        onClick={() => markAsRead(n.id)}
                                        title="Mark as read"
                                    >
                                        <DoneIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => handleDelete(n)}
                                        title="Delete"
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
