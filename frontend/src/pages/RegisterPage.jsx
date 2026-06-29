import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'USER' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data || 'An error occurred during registration');
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
              Join the Club
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create an account to manage your tickets easily.
            </Typography>
          </Box>
          
          {error && (
            <Typography color="error" align="center" sx={{ mb: 3, p: 1, bgcolor: 'rgba(211, 47, 47, 0.1)', borderRadius: 1, border: '1px solid rgba(211, 47, 47, 0.3)' }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth variant="filled" sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
              <InputLabel>Register As</InputLabel>
              <Select name="role" value={formData.role} onChange={handleChange} disableUnderline>
                <MenuItem value="USER">Standard User</MenuItem>
                <MenuItem value="ADMIN">Theatre Admin</MenuItem>
              </Select>
            </FormControl>
            
            <TextField 
              fullWidth label="Full Name" name="name" onChange={handleChange} required 
              variant="filled"
              InputProps={{ sx: { borderRadius: 1, bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } } }}
            />
            <TextField 
              fullWidth label="Email Address" type="email" name="email" onChange={handleChange} required 
              variant="filled"
              InputProps={{ sx: { borderRadius: 1, bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } } }}
            />
            <TextField 
              fullWidth label="Phone Number" name="phone" onChange={handleChange} required 
              variant="filled"
              InputProps={{ sx: { borderRadius: 1, bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } } }}
            />
            <TextField 
              fullWidth label="Password" type="password" name="password" onChange={handleChange} required 
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
              Create Account
            </Button>
            
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
              Already have an account? <Link to="/login" style={{ color: '#FF8E53', textDecoration: 'none', fontWeight: 'bold' }}>Sign In</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
