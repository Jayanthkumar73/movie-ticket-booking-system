import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Divider } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { NOIR, pageBg } from '../theme';

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
    <Box sx={{ ...pageBg, display: 'flex', alignItems: 'center', py: 5 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: 5, textAlign: 'center', bgcolor: NOIR.surface, border: `1px solid rgba(95,191,128,0.35)` }}>
          {/* Success ring */}
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 96, height: 96, borderRadius: '50%',
            bgcolor: NOIR.successSoft, border: `2px solid rgba(95,191,128,0.5)`, mb: 3,
            animation: 'pulse 2.2s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(95,191,128,0.4)' },
              '70%': { boxShadow: '0 0 0 22px rgba(95,191,128,0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(95,191,128,0)' },
            }
          }}>
            <CheckCircle sx={{ fontSize: 56, color: NOIR.success }} />
          </Box>

          <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: '2rem', mb: 1 }}>
            Booking confirmed
          </Typography>
          <Typography sx={{ color: NOIR.textDim, mb: 4 }}>
            A confirmation has been sent to your email. Enjoy the show.
          </Typography>

          {booking && (
            <Box sx={{ bgcolor: NOIR.bgElev, borderRadius: 3, p: 3, mb: 4, textAlign: 'left', border: `1px solid ${NOIR.border}` }}>
              <Typography sx={{ color: NOIR.amber, fontWeight: 700, fontSize: '0.95rem', mb: 2, textAlign: 'center', letterSpacing: '0.2em' }}>
                BOOKING #{booking.bookingNumber}
              </Typography>
              <Divider sx={{ borderColor: NOIR.border, mb: 2 }} />
              {details.map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: NOIR.textDim, fontSize: '0.9rem' }}>{label}</Typography>
                  <Typography sx={{ color: NOIR.text, fontWeight: 600, fontSize: '0.9rem', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => navigate('/bookings')} sx={{ flex: 1, py: 1.5 }}>
              View My Bookings
            </Button>
            <Button variant="outlined" onClick={() => navigate('/movies')} sx={{ flex: 1, py: 1.5 }}>
              Browse Movies
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookingSuccessPage;
