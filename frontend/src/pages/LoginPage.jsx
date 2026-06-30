import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, Tab, Tabs } from '@mui/material';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [tabIndex, setTabIndex] = useState(0); // 0=User, 1=Admin, 2=SuperAdmin
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setRequiresOtp(false);
    setError('');
    setFormData({ email: '', password: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('/api/auth/login', formData);
      if (response.data.requiresOtp) {
        setRequiresOtp(true);
        setAdminEmail(response.data.email);
      } else {
        dispatch(loginSuccess(response.data));
        navigate('/movies');
      }
    } catch (err) {
      setError(err.response?.data || 'Invalid email or password');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('/api/auth/verify-otp', {
        email: adminEmail,
        otp: otp
      });
      dispatch(loginSuccess(response.data));
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data || 'Invalid OTP');
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(to right bottom, rgba(18, 18, 18, 0.8), rgba(18, 18, 18, 0.95)), url("https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={24} 
          sx={{ 
            p: { xs: 3, md: 5 }, 
            borderRadius: 3,
            background: 'rgba(30, 30, 30, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight="800" sx={{
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to book your next cinematic experience.
            </Typography>
          </Box>
          
          {!requiresOtp && (
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 4 }}>
              <Tabs 
                value={tabIndex} 
                onChange={handleTabChange} 
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', fontSize: '1rem' }
                }}
              >
                <Tab label="User" />
                <Tab label="Admin" />
                <Tab label="Super Admin" />
              </Tabs>
            </Box>
          )}

          {error && (
            <Typography color="error" align="center" sx={{ mb: 3, p: 1, bgcolor: 'rgba(211, 47, 47, 0.1)', borderRadius: 1, border: '1px solid rgba(211, 47, 47, 0.3)' }}>
              {error}
            </Typography>
          )}

          {!requiresOtp ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField 
                fullWidth 
                label="Email Address" 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                variant="filled"
                InputProps={{ sx: { borderRadius: 1, bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } } }}
              />
              <TextField 
                fullWidth 
                label="Password" 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                variant="filled"
                InputProps={{ sx: { borderRadius: 1, bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } } }}
              />
              <Button 
                fullWidth 
                variant="contained" 
                type="submit" 
                size="large"
                sx={{ 
                  mt: 2, 
                  mb: 1, 
                  py: 1.5, 
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  boxShadow: '0 3px 15px 2px rgba(255, 105, 135, .3)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 2px rgba(255, 105, 135, .4)' }
                }}
              >
                Sign In
              </Button>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
                Don't have an account? <Link to="/register" style={{ color: '#FF8E53', textDecoration: 'none', fontWeight: 'bold' }}>Sign Up</Link>
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleOtpSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="body1" align="center" color="text.secondary">
                For security purposes, a 6-digit OTP has been sent to the registered admin email.
              </Typography>
              <TextField 
                fullWidth 
                label="Enter 6-digit OTP" 
                name="otp" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                required 
                variant="filled"
                InputProps={{ sx: { fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center', borderRadius: 1, bgcolor: 'rgba(0,0,0,0.2)' } }}
              />
              <Button 
                fullWidth 
                variant="contained" 
                type="submit" 
                size="large"
                sx={{ 
                  py: 1.5, 
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  boxShadow: '0 3px 15px 2px rgba(255, 105, 135, .3)'
                }}
              >
                Verify & Login
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
