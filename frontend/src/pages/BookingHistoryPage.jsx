import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button,
  Chip, CircularProgress, Grid, Divider
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

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
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"
      sx={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <CircularProgress sx={{ color: '#ff6b6b' }} />
    </Box>
  );

  const confirmed = bookings.filter(b => b.status === 'CONFIRMED');
  const cancelled = bookings.filter(b => b.status === 'CANCELLED');

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#fff' }}>
            🎟 My Bookings
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip label={`✅ ${confirmed.length} Active`} sx={{ bgcolor: 'rgba(86,171,47,0.2)', color: '#56ab2f', border: '1px solid #56ab2f', fontWeight: 700 }} />
            <Chip label={`❌ ${cancelled.length} Cancelled`} sx={{ bgcolor: 'rgba(192,57,43,0.2)', color: '#c0392b', border: '1px solid #c0392b', fontWeight: 700 }} />
          </Box>
        </Box>

        {bookings.length === 0 ? (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, p: 6, textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', mb: 3 }}>
              🎬 No bookings yet. Start exploring movies!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/movies')}
              sx={{ background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)', color: '#000', fontWeight: 700, borderRadius: 2 }}
            >
              Browse Movies
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {bookings
              .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
              .map(booking => (
                <Grid item xs={12} md={6} key={booking.id}>
                  <Card sx={{
                    bgcolor: booking.status === 'CANCELLED' ? 'rgba(192,57,43,0.08)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${booking.status === 'CANCELLED' ? 'rgba(192,57,43,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 3,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: booking.status === 'CANCELLED'
                        ? '0 8px 30px rgba(192,57,43,0.2)'
                        : '0 8px 30px rgba(78,205,196,0.2)'
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', flex: 1, pr: 1 }}>
                          {booking.movieName}
                        </Typography>
                        <Chip
                          label={booking.status}
                          size="small"
                          sx={{
                            bgcolor: booking.status === 'CONFIRMED' ? 'rgba(86,171,47,0.2)' : 'rgba(192,57,43,0.2)',
                            color: booking.status === 'CONFIRMED' ? '#56ab2f' : '#c0392b',
                            border: `1px solid ${booking.status === 'CONFIRMED' ? '#56ab2f' : '#c0392b'}`,
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        />
                      </Box>

                      <Typography sx={{ color: '#ffd93d', fontWeight: 700, fontSize: '0.8rem', mb: 2, fontFamily: 'monospace' }}>
                        #{booking.bookingNumber}
                      </Typography>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                          📍 {booking.theatreName} • {booking.screenName}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                          📅 {booking.showDate} at {booking.showTime?.substring(0, 5)}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                          🪑 {booking.selectedSeats?.join(', ')}
                        </Typography>
                        <Typography sx={{ color: '#4ecdc4', fontWeight: 800, fontSize: '1.1rem', mt: 0.5 }}>
                          ₹{booking.totalAmount}
                        </Typography>
                      </Box>

                      {canCancel(booking) && (
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={cancellingId === booking.id ? <CircularProgress size={16} color="error" /> : <Cancel />}
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            borderColor: '#c0392b',
                            color: '#c0392b',
                            '&:hover': { bgcolor: 'rgba(192,57,43,0.1)' }
                          }}
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                        </Button>
                      )}

                      {isWithin1Hour(booking) && (
                        <Box sx={{
                          mt: 1,
                          p: 1.5,
                          bgcolor: 'rgba(255,193,7,0.1)',
                          border: '1px solid rgba(255,193,7,0.3)',
                          borderRadius: 2,
                          textAlign: 'center'
                        }}>
                          <Typography sx={{ color: '#ffc107', fontSize: '0.8rem', fontWeight: 600 }}>
                            ⚠️ Cannot cancel within 1 hour of show time
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default BookingHistoryPage;
