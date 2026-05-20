import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Badge,
    Menu,
    MenuItem,
    ListItemText,
    Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';

export const Navbar = () => {
    const { currentUser, userRole, userName, logout } = useAuth();
    const { t, toggleLanguage, language } = useLanguage();
    const navigate = useNavigate();
    const { notifications, markAsRead } = useNotifications();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed: ', err);
        }
    };

    if (!currentUser) return null;

    const unreadCount = notifications.filter((n) => !n.read).length;
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleNotificationsClick = (e) => setAnchorEl(e.currentTarget);
    const handleNotificationsClose = () => setAnchorEl(null);
    const handleNotificationSelect = async (n) => {
        if (!n.read) await markAsRead(n.id);
        handleNotificationsClose();
    };

    return (
        <AppBar position="static" sx={{ bgcolor: '#00796b', boxShadow: 2 }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        variant="h6"
                        onClick={() => navigate('/')}
                        sx={{
                            fontWeight: 'bold',
                            letterSpacing: 1,
                            cursor: 'pointer',
                        }}
                    >
                        {t('nav.brand')} 🩺
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                        }}
                    >
                        {t(`roles.${userRole}`)} {t('nav.panel')}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: '500' }}>
                        {t('nav.hello')}, {userName || t('common.unknown')}
                    </Typography>

                    <Button
                        variant="text"
                        onClick={toggleLanguage}
                        sx={{
                            fontWeight: 'bold',
                            textTransform: 'none',
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                        }}
                    >
                        {language === 'en'
                            ? t('nav.changeLanguage')
                            : t('nav.changeLanguage')}
                    </Button>

                    <IconButton
                        color="inherit"
                        onClick={handleNotificationsClick}
                        size="large"
                    >
                        <Badge badgeContent={unreadCount} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    <Button
                        variant="text"
                        startIcon={<AccountCircleIcon />}
                        onClick={() => navigate('/profile')}
                        sx={{
                            fontWeight: 'bold',
                            textTransform: 'none',
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                        }}
                    >
                        {t('nav.profile')}
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<ExitToAppIcon />}
                        onClick={handleLogout}
                        sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    >
                        {t('nav.logout')}
                    </Button>
                </Box>
            </Toolbar>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleNotificationsClose}
                PaperProps={{ sx: { width: 320 } }}
            >
                <MenuItem
                    onClick={() => {
                        handleNotificationsClose();
                        navigate('/notifications');
                    }}
                >
                    <ListItemText primary="View all notifications" />
                </MenuItem>
                <Divider />
                {notifications.length === 0 && (
                    <MenuItem>
                        <ListItemText primary="No notifications" />
                    </MenuItem>
                )}
                {notifications.map((n) => (
                    <MenuItem
                        key={n.id}
                        onClick={() => handleNotificationSelect(n)}
                        sx={{ alignItems: 'flex-start', whiteSpace: 'normal' }}
                    >
                        <ListItemText primary={n.title} secondary={n.body} />
                    </MenuItem>
                ))}
            </Menu>
        </AppBar>
    );
};
