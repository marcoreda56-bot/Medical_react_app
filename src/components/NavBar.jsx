import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useLanguage } from '../context/LanguageContext';

export const Navbar = () => {
  const { currentUser, userRole, userName, logout } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed: ', err);
    }
  };

  if (!currentUser) return null;

  return (
    <AppBar position="static" sx={{ bgcolor: '#00796b', boxShadow: 2 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h6"
            onClick={() => navigate('/')}
            sx={{ fontWeight: 'bold', letterSpacing: 1, cursor: 'pointer' }}
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
            sx={{ fontWeight: 'bold', textTransform: 'none', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            {language === 'en' ? t('nav.changeLanguage') : t('nav.changeLanguage')}
          </Button>

          <Button
            variant="text"
            startIcon={<AccountCircleIcon />}
            onClick={() => navigate('/profile')}
            sx={{ fontWeight: 'bold', textTransform: 'none', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
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
    </AppBar>
  );
};