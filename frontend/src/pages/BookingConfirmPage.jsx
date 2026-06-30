import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, CircularProgress, Divider, Alert } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const BookingConfirmPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showId, selectedSeats, totalAmount, show, movie, pricePerSeat } = location.state || {};
  const { token } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayAndBook = async () => {
    if (!token) {
      setError('You are not logged in. Please log in and try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        '/api/bookings',
        { showId, selectedSeats },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/booking/success', { state: { booking: res.data } });
    } catch (err) {
      setError(
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || 'Booking failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!show || !movie) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
        sx={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Invalid booking state. Please select seats first.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/movies')}
            sx={{ background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)', color: '#000', fontWeight: 700 }}
          >
            Go to Movies
          </Button>
        </Box>
      </Box>
    );
  }

  const details = [
    ['Venue', show.screen?.screenName || 'N/A'],
    ['Screen Type', show.screen?.screenType || 'REGULAR'],
    ['Date', show.showDate],
    ['Time', show.showTime?.substring(0, 5)],
    ['Seats', selectedSeats?.join(', ')],
    ['Seat Count', `${selectedSeats?.length} seat(s)`],
    ['Price / Seat', `₹${pricePerSeat}`],
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Container maxWidth="sm">
        <Paper sx={{
          p: 4,
          bgcolor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 4
        }}>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#fff', mb: 4, textAlign: 'center' }}>
            Confirm Booking
          </Typography>

          {/* Movie info */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
            <Box
              component="img"
              src={movie.posterImageUrl || 'https://via.placeholder.com/80x120?text=Movie'}
              alt={movie.movieName}
              sx={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
            />
            <Box>
              <Typography variant="h5" fontWeight="800" sx={{ color: '#fff', mb: 0.5 }}>
                {movie.movieName}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {movie.language} • {movie.genre}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mt: 0.5 }}>
                ⏱ {movie.duration} mins
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

          {details.map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>{label}</Typography>
              <Typography sx={{ color: '#fff', fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>
                {value}
              </Typography>
            </Box>
          ))}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Typography color="#fff" variant="h6" fontWeight={700}>Total Amount</Typography>
            <Typography color="#4ecdc4" variant="h5" fontWeight={900}>₹{totalAmount}</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handlePayAndBook}
            disabled={loading}
            startIcon={loading ? null : <CheckCircle />}
            sx={{
              background: 'linear-gradient(45deg, #56ab2f, #a8e063)',
              color: '#000',
              fontWeight: 900,
              fontSize: '1.1rem',
              py: 2,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(86,171,47,0.4)',
              '&:hover': { opacity: 0.9 },
              '&:disabled': { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : '🎬 Pay & Confirm Booking'}
          </Button>

          <Button
            fullWidth
            variant="text"
            sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}
            onClick={() => navigate(-1)}
          >
            ← Change Seats
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookingConfirmPage;
