import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, Tab, Tabs } from '@mui/material';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { NOIR, pageBg } from '../theme';

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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
      const response = await axios.post('/api/auth/verify-otp', { email: adminEmail, otp });
      dispatch(loginSuccess(response.data));
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data || 'Invalid OTP');
    }
  };

  return (
    <Box sx={{ ...pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 5, bgcolor: NOIR.surface, border: `1px solid ${NOIR.border}`, boxShadow: '0 40px 80px -30px rgba(0,0,0,0.9)' }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography sx={{ color: NOIR.amber, letterSpacing: '0.3em', fontSize: '0.68rem', fontWeight: 700, mb: 1.5 }}>
              AURORA · CINEMA
            </Typography>
            <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: '2.2rem', mb: 0.5 }}>
              Welcome back
            </Typography>
            <Typography sx={{ color: NOIR.textDim }}>Sign in to book your next cinematic experience.</Typography>
          </Box>

          {!requiresOtp && (
            <Box sx={{ borderBottom: `1px solid ${NOIR.border}`, mb: 4 }}>
              <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth"
                sx={{ '& .Mui-selected': { color: `${NOIR.amber} !important` }, '& .MuiTabs-indicator': { backgroundColor: NOIR.amber } }}>
                <Tab label="User" />
                <Tab label="Admin" />
                <Tab label="Super Admin" />
              </Tabs>
            </Box>
          )}

          {error && (
            <Typography sx={{ mb: 3, p: 1.2, textAlign: 'center', color: NOIR.danger, bgcolor: NOIR.dangerSoft, borderRadius: 2, border: `1px solid rgba(229,72,77,0.3)` }}>
              {error}
            </Typography>
          )}

          {!requiresOtp ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField fullWidth label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required />
              <TextField fullWidth label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required />
              <Button fullWidth variant="contained" type="submit" size="large" sx={{ mt: 2, py: 1.5, fontSize: '1.05rem' }}>
                Sign In
              </Button>
              <Typography variant="body2" align="center" sx={{ color: NOIR.textDim, mt: 1 }}>
                Don't have an account? <Link to="/register" style={{ color: NOIR.amber, textDecoration: 'none', fontWeight: 700 }}>Sign Up</Link>
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleOtpSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography align="center" sx={{ color: NOIR.textDim }}>
                For security, a 6-digit OTP has been sent to the registered admin email.
              </Typography>
              <TextField fullWidth label="Enter 6-digit OTP" name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required
                inputProps={{ style: { fontSize: '1.4rem', letterSpacing: '0.5rem', textAlign: 'center' } }} />
              <Button fullWidth variant="contained" type="submit" size="large" sx={{ py: 1.5, fontSize: '1.05rem' }}>
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
