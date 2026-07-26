import { useNotifications } from '../context/NotificationsContext';
import { useLanguage } from '../context/LanguageContext';
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
    const { t } = useLanguage();
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
            title: t('notifications.deleteConfirm'),
            showCancelButton: true,
            confirmButtonText: t('notifications.delete'),
            icon: 'warning',
        });
        if (res.isConfirmed) {
            try {
                await axiosInstance.delete(`/notifications/${n.id}/`);
                Swal.fire(t('notifications.deleted'), '', 'success');
            } catch (err) {
                console.error(err);
                Swal.fire(t('notifications.failedDelete'), '', 'error');
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
                        {t('notifications.title')}
                    </Typography>
                    <Chip
                        label={`${notifications.filter((n) => !n.read).length} ${t('notifications.unread')}`}
                        color="primary"
                    />
                </Box>

                {notifications.length === 0 ? (
                    <Typography color="textSecondary">
                        {t('notifications.noNotifications')}
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
                                        title={t('notifications.open')}
                                        sx={{ mr: 1 }}
                                    >
                                        <OpenInNewIcon />
                                    </IconButton>
                                    {!n.read && (
                                        <IconButton
                                            edge="end"
                                            onClick={() => markAsRead(n.id)}
                                            title={t('notifications.markAsRead')}
                                            color="success"
                                            sx={{ mr: 1 }}
                                        >
                                            <DoneIcon />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDelete(n)}
                                        title={t('notifications.delete')}
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
