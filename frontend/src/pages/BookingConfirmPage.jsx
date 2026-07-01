import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, CircularProgress, Divider, Alert } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { NOIR, pageBg } from '../theme';

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={pageBg}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: NOIR.textDim, mb: 2 }}>
            Invalid booking state. Please select seats first.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/movies')}>Go to Movies</Button>
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
    <Box sx={{ ...pageBg, display: 'flex', alignItems: 'center', py: 5 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 5, bgcolor: NOIR.surface, border: `1px solid ${NOIR.border}` }}>
          <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: '1.9rem', mb: 4, textAlign: 'center' }}>
            Confirm your booking
          </Typography>

          {/* Movie info */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
            <Box
              component="img"
              src={movie.posterImageUrl || 'https://via.placeholder.com/80x120?text=Movie'}
              alt={movie.movieName}
              sx={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 2, border: `1px solid ${NOIR.border}`, flexShrink: 0 }}
            />
            <Box>
              <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: '1.35rem', mb: 0.5 }}>
                {movie.movieName}
              </Typography>
              <Typography sx={{ color: NOIR.textDim }}>{movie.language} · {movie.genre}</Typography>
              <Typography sx={{ color: NOIR.textFaint, fontSize: '0.85rem', mt: 0.5 }}>{movie.duration} mins</Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: NOIR.border, my: 2 }} />

          {details.map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ color: NOIR.textDim }}>{label}</Typography>
              <Typography sx={{ color: NOIR.text, fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</Typography>
            </Box>
          ))}

          <Divider sx={{ borderColor: NOIR.border, my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'baseline' }}>
            <Typography sx={{ color: NOIR.text, fontWeight: 700, fontSize: '1.1rem' }}>Total Amount</Typography>
            <Typography sx={{ color: NOIR.amber, fontWeight: 900, fontSize: '1.6rem' }}>₹{totalAmount}</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: NOIR.dangerSoft, color: NOIR.danger, border: `1px solid rgba(229,72,77,0.3)` }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth variant="contained" size="large"
            onClick={handlePayAndBook} disabled={loading}
            startIcon={loading ? null : <CheckCircle />}
            sx={{ fontSize: '1.05rem', py: 1.8, fontWeight: 800 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Pay & Confirm Booking'}
          </Button>

          <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={() => navigate(-1)}>← Change Seats</Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookingConfirmPage;
