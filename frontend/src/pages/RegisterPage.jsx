import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { NOIR, pageBg } from '../theme';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'USER' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data || 'An error occurred during registration');
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
              Join the club
            </Typography>
            <Typography sx={{ color: NOIR.textDim }}>Create an account to manage your tickets with ease.</Typography>
          </Box>

          {error && (
            <Typography sx={{ mb: 3, p: 1.2, textAlign: 'center', color: NOIR.danger, bgcolor: NOIR.dangerSoft, borderRadius: 2, border: `1px solid rgba(229,72,77,0.3)` }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Register As</InputLabel>
              <Select name="role" value={formData.role} label="Register As" onChange={handleChange}>
                <MenuItem value="USER">Standard User</MenuItem>
                <MenuItem value="ADMIN">Theatre Admin</MenuItem>
              </Select>
            </FormControl>

            <TextField fullWidth label="Full Name" name="name" onChange={handleChange} required />
            <TextField fullWidth label="Email Address" type="email" name="email" onChange={handleChange} required />
            <TextField fullWidth label="Phone Number" name="phone" onChange={handleChange} required />
            <TextField fullWidth label="Password" type="password" name="password" onChange={handleChange} required />

            <Button fullWidth variant="contained" type="submit" size="large" sx={{ mt: 2, py: 1.5, fontSize: '1.05rem' }}>
              Create Account
            </Button>

            <Typography variant="body2" align="center" sx={{ color: NOIR.textDim, mt: 1 }}>
              Already have an account? <Link to="/login" style={{ color: NOIR.amber, textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
