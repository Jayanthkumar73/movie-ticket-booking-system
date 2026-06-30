import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Button, Paper } from '@mui/material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const generateSeats = (totalSeats) => {
  const rows = [];
  const seatsPerRow = 10;
  const numRows = Math.ceil(totalSeats / seatsPerRow);
  let seatCount = 0;
  for (let i = 0; i < numRows && seatCount < totalSeats; i++) {
    const rowLetter = String.fromCharCode(65 + i);
    const rowSeats = [];
    for (let j = 1; j <= seatsPerRow && seatCount < totalSeats; j++) {
      rowSeats.push(`${rowLetter}${j}`);
      seatCount++;
    }
    rows.push({ letter: rowLetter, seats: rowSeats });
  }
  return rows;
};

const SeatSelectionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { show, movie } = location.state || {};
  const { isAuthenticated } = useSelector(state => state.auth);

  const [seatInfo, setSeatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatRows, setSeatRows] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    axios.get(`/api/shows/${id}/seats`)
      .then(res => {
        setSeatInfo(res.data);
        setSeatRows(generateSeats(res.data.totalSeats));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, isAuthenticated, navigate]);

  const toggleSeat = (seat) => {
    if (seatInfo?.bookedSeats?.includes(seat)) return;
    setSelectedSeats(prev =>
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  const getSeatColor = (seat) => {
    if (seatInfo?.bookedSeats?.includes(seat)) return '#c0392b';
    if (selectedSeats.includes(seat)) return '#f39c12';
    return 'rgba(255,255,255,0.12)';
  };

  const getSeatTextColor = (seat) => {
    if (seatInfo?.bookedSeats?.includes(seat)) return '#fff';
    if (selectedSeats.includes(seat)) return '#000';
    return 'rgba(255,255,255,0.8)';
  };

  const totalPrice = seatInfo ? selectedSeats.length * Number(seatInfo.pricePerSeat) : 0;

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"
      sx={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <CircularProgress sx={{ color: '#ff6b6b' }} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Button
          variant="text"
          sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}
          onClick={() => navigate(-1)}
        >
          ← Back to Shows
        </Button>

        <Typography variant="h4" fontWeight="900" sx={{ color: '#fff', mb: 1, textAlign: 'center' }}>
          {movie?.movieName || 'Select Seats'}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', mb: 4 }}>
          {show?.screen?.screenName} • {show?.showDate} • {show?.showTime?.substring(0, 5)}
        </Typography>

        {/* Screen indicator */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
            height: 10,
            borderRadius: '50%',
            mx: 'auto',
            width: '60%',
            mb: 1
          }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: 6 }}>SCREEN</Typography>
        </Box>

        {/* Seat grid */}
        <Box sx={{ overflowX: 'auto', mb: 4 }}>
          {seatRows.map(row => (
            <Box key={row.letter} sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center', gap: 1 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', width: 20, fontSize: '0.8rem', textAlign: 'right' }}>
                {row.letter}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {row.seats.map((seat, idx) => (
                  <React.Fragment key={seat}>
                    {idx === 4 && <Box sx={{ width: 16 }} />}
                    <Box
                      onClick={() => toggleSeat(seat)}
                      sx={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: getSeatColor(seat),
                        color: getSeatTextColor(seat),
                        borderRadius: '4px 4px 0 0',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: seatInfo?.bookedSeats?.includes(seat) ? 'not-allowed' : 'pointer',
                        border: selectedSeats.includes(seat) ? '2px solid #f39c12' : '1px solid rgba(255,255,255,0.15)',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                        '&:hover': {
                          transform: seatInfo?.bookedSeats?.includes(seat) ? 'none' : 'scale(1.2)',
                          zIndex: 1,
                          position: 'relative',
                        }
                      }}
                    >
                      {seat.substring(1)}
                    </Box>
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          {[
            { color: 'rgba(255,255,255,0.12)', label: 'Available', border: '1px solid rgba(255,255,255,0.15)' },
            { color: '#f39c12', label: 'Selected', border: '2px solid #f39c12' },
            { color: '#c0392b', label: 'Booked', border: '1px solid #c0392b' }
          ].map(item => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, bgcolor: item.color, borderRadius: '3px 3px 0 0', border: item.border }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Summary panel */}
        {selectedSeats.length > 0 && (
          <Paper sx={{
            p: 3,
            bgcolor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 3,
            maxWidth: 500,
            mx: 'auto'
          }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 700 }}>
              🎟 Booking Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="rgba(255,255,255,0.7)">Selected Seats</Typography>
              <Typography color="#f39c12" fontWeight={700} sx={{ maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>
                {selectedSeats.join(', ')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="rgba(255,255,255,0.7)">Qty × Price</Typography>
              <Typography color="#fff">
                {selectedSeats.length} × ₹{seatInfo?.pricePerSeat}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography color="#fff" fontWeight={700} variant="h6">Total</Typography>
              <Typography color="#4ecdc4" fontWeight={900} variant="h6">₹{totalPrice}</Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/booking/confirm', {
                state: {
                  showId: Number(id),
                  selectedSeats,
                  totalAmount: totalPrice,
                  show,
                  movie,
                  pricePerSeat: seatInfo?.pricePerSeat
                }
              })}
              sx={{
                background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)',
                color: '#000',
                fontWeight: 800,
                fontSize: '1.1rem',
                py: 1.5,
                borderRadius: 2,
                '&:hover': { opacity: 0.9 }
              }}
            >
              Proceed to Payment →
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default SeatSelectionPage;
