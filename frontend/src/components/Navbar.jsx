import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { NOIR } from '../theme';

const Navbar = () => {
  const { isAuthenticated, roles } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN') || roles.includes('ROLE_THEATRE_ADMIN');
  const isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN');
  const isActive = (path) => location.pathname === path || (path === '/movies' && location.pathname === '/');

  const navLink = (active) => ({
    color: active ? NOIR.text : NOIR.textDim,
    fontWeight: 600,
    px: 1.5,
    borderRadius: 2,
    position: 'relative',
    '&:hover': { color: NOIR.text, bgcolor: 'rgba(255,255,255,0.04)' },
    '&::after': active ? {
      content: '""',
      position: 'absolute',
      left: 12, right: 12, bottom: 4, height: 2,
      borderRadius: 2,
      background: NOIR.amber,
    } : {},
  });

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(10,10,11,0.72)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${NOIR.border}`,
      }}
    >
      <Toolbar sx={{ minHeight: 68 }}>
        <Typography
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            fontFamily: '"Fraunces", serif',
            fontWeight: 600,
            fontSize: '1.4rem',
            letterSpacing: '0.01em',
            color: NOIR.text,
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
          }}
        >
          AURORA
          <Box component="span" sx={{ color: NOIR.amber }}>.</Box>
          <Box component="span" sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.28em', color: NOIR.textDim, ml: 0.6, mt: 0.4 }}>
            CINEMA
          </Box>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {!isSuperAdmin && <Button component={Link} to="/movies" sx={navLink(isActive('/movies'))}>Movies</Button>}
          {isAuthenticated && !isSuperAdmin && (
            <Button component={Link} to="/bookings" startIcon={<ConfirmationNumberIcon sx={{ fontSize: 18 }} />} sx={navLink(isActive('/bookings'))}>
              My Bookings
            </Button>
          )}
          {isAdmin && <Button component={Link} to="/admin" sx={navLink(isActive('/admin'))}>Dashboard</Button>}
          {isAuthenticated ? (
            <Button onClick={handleLogout} variant="outlined" sx={{ ml: 1, borderColor: NOIR.border, color: NOIR.textDim }}>
              Logout
            </Button>
          ) : (
            <>
              <Button component={Link} to="/login" sx={navLink(isActive('/login'))}>Login</Button>
              <Button component={Link} to="/register" variant="contained" sx={{ ml: 1 }}>Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
