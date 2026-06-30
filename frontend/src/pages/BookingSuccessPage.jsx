import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Divider } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const BookingSuccessPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const booking = state?.booking;

  const details = booking ? [
    ['Movie', booking.movieName],
    ['Theatre', booking.theatreName],
    ['Screen', booking.screenName],
    ['Date', booking.showDate],
    ['Time', booking.showTime?.substring(0, 5)],
    ['Seats', booking.selectedSeats?.join(', ')],
    ['Amount Paid', `₹${booking.totalAmount}`],
  ] : [];

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
          p: 5,
          bgcolor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(86,171,47,0.4)',
          borderRadius: 4,
          textAlign: 'center'
        }}>
          {/* Success animation */}
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'rgba(86,171,47,0.15)',
            border: '2px solid rgba(86,171,47,0.5)',
            mb: 3,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(86,171,47,0.4)' },
              '70%': { boxShadow: '0 0 0 20px rgba(86,171,47,0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(86,171,47,0)' },
            }
          }}>
            <CheckCircle sx={{ fontSize: 60, color: '#56ab2f' }} />
          </Box>

          <Typography variant="h4" fontWeight="900" sx={{ color: '#fff', mb: 1 }}>
            Booking Confirmed! 🎉
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 4 }}>
            A confirmation has been sent to your email.
          </Typography>

          {booking && (
            <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 3, p: 3, mb: 4, textAlign: 'left' }}>
              <Typography sx={{
                color: '#ffd93d',
                fontWeight: 700,
                fontSize: '1rem',
                mb: 2,
                textAlign: 'center',
                letterSpacing: 3,
                background: 'linear-gradient(45deg, #ffd93d, #ff6b6b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                BOOKING #{booking.bookingNumber}
              </Typography>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

              {details.map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{label}</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/bookings')}
              sx={{
                flex: 1,
                background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)',
                color: '#000',
                fontWeight: 700,
                borderRadius: 2,
                py: 1.5
              }}
            >
              View My Bookings
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/movies')}
              sx={{
                flex: 1,
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff',
                borderRadius: 2,
                py: 1.5,
                '&:hover': { borderColor: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              Browse Movies
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookingSuccessPage;
