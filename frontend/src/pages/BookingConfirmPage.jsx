import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, CircularProgress, Divider, Alert } from '@mui/material';
import { CheckCircle, Timer } from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { NOIR, pageBg } from '../theme';

const BookingConfirmPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, showId, selectedSeats, totalAmount, show, movie, pricePerSeat } = location.state || {};
  const { token } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 5 minute timer
  const [timeLeft, setTimeLeft] = useState(300); // 300 seconds = 5 mins
  const timerRef = useRef(null);

  useEffect(() => {
    if (!show || !movie || !bookingId) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [show, movie, bookingId]);

  const handleTimeout = async () => {
    try {
      await axios.put(`/api/bookings/${bookingId}/release`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) { console.error(e); }
    alert('Your session has expired. The seats have been released.');
    navigate(-1);
  };

  const handleChangeSeats = async () => {
    try {
      await axios.put(`/api/bookings/${bookingId}/release`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) { console.error(e); }
    navigate(-1);
  };

  const handlePayAndBook = async () => {
    if (!token) {
      setError('You are not logged in. Please log in and try again.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      // 1. Create order on backend
      const orderRes = await axios.post(`/api/bookings/${bookingId}/create-order`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { orderId, amount } = orderRes.data;

      // 2. Open Razorpay checkout
      const options = {
        key: 'rzp_test_T8cPaw4M2IXs1f', // Razorpay Key ID
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'Aurora Cinema',
        description: `Booking for ${movie.movieName}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            // 3. Verify payment on backend
            const verifyRes = await axios.post(`/api/bookings/${bookingId}/verify-payment`, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            clearInterval(timerRef.current);
            navigate('/booking/success', { state: { booking: verifyRes.data } });
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#E5B769' // NOIR.amber
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        setError(`Payment Failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setError(
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || 'Failed to initiate payment. Please try again.'
      );
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

  const theatreName = show.screen?.theatre?.theatreName || '';
  const theatreCity = show.screen?.theatre?.city || '';

  const details = [
    ['Theatre', theatreName + (theatreCity ? ` · ${theatreCity}` : '')],
    ['Screen', show.screen?.screenName || 'N/A'],
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: '1.9rem' }}>
              Confirm your booking
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(229,183,105,0.1)', px: 2, py: 1, borderRadius: 2, border: `1px solid rgba(229,183,105,0.3)` }}>
              <Timer sx={{ color: NOIR.amber, fontSize: 20 }} />
              <Typography sx={{ color: NOIR.amber, fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                {formatTime(timeLeft)}
              </Typography>
            </Box>
          </Box>

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

          <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={handleChangeSeats}>← Change Seats</Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookingConfirmPage;
