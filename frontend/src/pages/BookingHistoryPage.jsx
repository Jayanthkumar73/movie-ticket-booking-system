import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button,
  Chip, CircularProgress, Grid, Divider
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { NOIR, pageBg } from '../theme';

const BookingHistoryPage = () => {
  const { token } = useSelector(state => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const res = await axios.get('/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(id);
    try {
      await axios.put(`/api/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (err) {
      alert(
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || 'Cancellation failed'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (booking) => {
    const showDT = new Date(`${booking.showDate}T${booking.showTime}`);
    const oneHourBefore = new Date(showDT.getTime() - 60 * 60 * 1000);
    return booking.status === 'CONFIRMED' && new Date() < oneHourBefore;
  };

  const isWithin1Hour = (booking) => {
    const showDT = new Date(`${booking.showDate}T${booking.showTime}`);
    const oneHourBefore = new Date(showDT.getTime() - 60 * 60 * 1000);
    return booking.status === 'CONFIRMED' && new Date() >= oneHourBefore && new Date() < showDT;
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={pageBg}>
      <CircularProgress sx={{ color: NOIR.amber }} />
    </Box>
  );

  const confirmed = bookings.filter(b => b.status === 'CONFIRMED');
  const cancelled = bookings.filter(b => b.status === 'CANCELLED');

  return (
    <Box sx={{ ...pageBg, py: 5 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: { xs: '2rem', md: '2.6rem' } }}>
            My Bookings
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Chip label={`${confirmed.length} Active`} sx={{ bgcolor: NOIR.successSoft, color: NOIR.success, border: `1px solid rgba(95,191,128,0.4)`, fontWeight: 700 }} />
            <Chip label={`${cancelled.length} Cancelled`} sx={{ bgcolor: NOIR.dangerSoft, color: NOIR.danger, border: `1px solid rgba(229,72,77,0.4)`, fontWeight: 700 }} />
          </Box>
        </Box>

        {bookings.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
            <Typography sx={{ color: NOIR.textDim, fontSize: '1.15rem', mb: 3 }}>
              No bookings yet. Your next great film is waiting.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/movies')}>Browse Movies</Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {bookings
              .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
              .map(booking => {
                const isCancelled = booking.status === 'CANCELLED';
                return (
                  <Grid item xs={12} md={6} key={booking.id}>
                    <Card sx={{
                      borderRadius: 4, borderColor: isCancelled ? 'rgba(229,72,77,0.35)' : NOIR.border,
                      bgcolor: isCancelled ? 'rgba(229,72,77,0.05)' : NOIR.surface,
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 16px 40px -18px rgba(0,0,0,0.9)' },
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: '1.3rem', flex: 1, pr: 1 }}>
                            {booking.movieName}
                          </Typography>
                          <Chip label={booking.status} size="small"
                            sx={{
                              bgcolor: isCancelled ? NOIR.dangerSoft : NOIR.successSoft,
                              color: isCancelled ? NOIR.danger : NOIR.success,
                              fontWeight: 700, flexShrink: 0,
                            }} />
                        </Box>

                        <Typography sx={{ color: NOIR.amber, fontWeight: 700, fontSize: '0.8rem', mb: 2, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                          #{booking.bookingNumber}
                        </Typography>

                        <Divider sx={{ borderColor: NOIR.border, mb: 2 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                          <Typography sx={{ color: NOIR.textDim, fontSize: '0.9rem' }}>{booking.theatreName} · {booking.screenName}</Typography>
                          <Typography sx={{ color: NOIR.textDim, fontSize: '0.9rem' }}>{booking.showDate} at {booking.showTime?.substring(0, 5)}</Typography>
                          <Typography sx={{ color: NOIR.textDim, fontSize: '0.9rem' }}>Seats · {booking.selectedSeats?.join(', ')}</Typography>
                          <Typography sx={{ color: NOIR.amber, fontWeight: 800, fontSize: '1.15rem', mt: 0.5 }}>₹{booking.totalAmount}</Typography>
                        </Box>

                        {canCancel(booking) && (
                          <Button
                            fullWidth variant="outlined"
                            startIcon={cancellingId === booking.id ? <CircularProgress size={16} sx={{ color: NOIR.danger }} /> : <Cancel />}
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancellingId === booking.id}
                            sx={{ borderRadius: 2, fontWeight: 700, borderColor: 'rgba(229,72,77,0.5)', color: NOIR.danger, '&:hover': { borderColor: NOIR.danger, bgcolor: NOIR.dangerSoft } }}
                          >
                            {cancellingId === booking.id ? 'Cancelling…' : 'Cancel Booking'}
                          </Button>
                        )}

                        {isWithin1Hour(booking) && (
                          <Box sx={{ mt: 1, p: 1.5, bgcolor: NOIR.amberSoft, border: `1px solid ${NOIR.border}`, borderRadius: 2, textAlign: 'center' }}>
                            <Typography sx={{ color: NOIR.amber, fontSize: '0.8rem', fontWeight: 600 }}>
                              Cannot cancel within 1 hour of showtime
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default BookingHistoryPage;
