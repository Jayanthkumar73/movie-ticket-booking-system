import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Button, Paper } from '@mui/material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { NOIR, pageBg } from '../theme';

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
    if (seatInfo?.bookedSeats?.includes(seat)) return 'rgba(229,72,77,0.28)';
    if (selectedSeats.includes(seat)) return NOIR.amber;
    return 'rgba(255,255,255,0.08)';
  };

  const getSeatTextColor = (seat) => {
    if (seatInfo?.bookedSeats?.includes(seat)) return 'rgba(255,255,255,0.4)';
    if (selectedSeats.includes(seat)) return '#0a0a0b';
    return NOIR.textDim;
  };

  const totalPrice = seatInfo ? selectedSeats.length * Number(seatInfo.pricePerSeat) : 0;

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={pageBg}>
      <CircularProgress sx={{ color: NOIR.amber }} />
    </Box>
  );

  return (
    <Box sx={{ ...pageBg, py: 4 }}>
      <Container maxWidth="lg">
        <Button variant="text" sx={{ mb: 2, px: 0 }} onClick={() => navigate(-1)}>← Back to Shows</Button>

        <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: { xs: '1.9rem', md: '2.4rem' }, textAlign: 'center' }}>
          {movie?.movieName || 'Select Seats'}
        </Typography>
        <Typography sx={{ color: NOIR.textDim, textAlign: 'center', mb: 5, mt: 0.5 }}>
          {show?.screen?.screenName} · {show?.showDate} · {show?.showTime?.substring(0, 5)}
        </Typography>

        {/* Screen indicator */}
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Box sx={{
            height: 6, mx: 'auto', width: '55%', borderRadius: '50%',
            background: `linear-gradient(to bottom, ${NOIR.amber}, transparent)`,
            boxShadow: `0 0 40px 6px rgba(229,183,105,0.35)`,
            mb: 1.5,
          }} />
          <Typography sx={{ color: NOIR.textFaint, fontSize: '0.72rem', letterSpacing: '0.5em' }}>SCREEN</Typography>
        </Box>

        {/* Seat grid */}
        <Box sx={{ overflowX: 'auto', mb: 4 }}>
          {seatRows.map(row => (
            <Box key={row.letter} sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center', gap: 1 }}>
              <Typography sx={{ color: NOIR.textFaint, width: 20, fontSize: '0.8rem', textAlign: 'right' }}>{row.letter}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {row.seats.map((seat, idx) => {
                  const isSelected = selectedSeats.includes(seat);
                  const isBooked = seatInfo?.bookedSeats?.includes(seat);
                  return (
                    <React.Fragment key={seat}>
                      {idx === 4 && <Box sx={{ width: 16 }} />}
                      <Box
                        onClick={() => toggleSeat(seat)}
                        sx={{
                          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: getSeatColor(seat), color: getSeatTextColor(seat),
                          borderRadius: '6px 6px 3px 3px', fontSize: '0.62rem', fontWeight: 700,
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          border: isSelected ? `1px solid ${NOIR.amber}` : `1px solid ${NOIR.border}`,
                          boxShadow: isSelected ? '0 4px 14px rgba(229,183,105,0.4)' : 'none',
                          transition: 'all 0.15s', userSelect: 'none',
                          '&:hover': { transform: isBooked ? 'none' : 'translateY(-2px) scale(1.08)', zIndex: 1, position: 'relative' },
                        }}
                      >
                        {seat.substring(1)}
                      </Box>
                    </React.Fragment>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 5, flexWrap: 'wrap' }}>
          {[
            { color: 'rgba(255,255,255,0.08)', label: 'Available', border: `1px solid ${NOIR.border}` },
            { color: NOIR.amber, label: 'Selected', border: `1px solid ${NOIR.amber}` },
            { color: 'rgba(229,72,77,0.28)', label: 'Booked', border: `1px solid rgba(229,72,77,0.5)` }
          ].map(item => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, bgcolor: item.color, borderRadius: '4px 4px 2px 2px', border: item.border }} />
              <Typography sx={{ color: NOIR.textDim, fontSize: '0.85rem' }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Summary panel */}
        {selectedSeats.length > 0 && (
          <Paper sx={{ p: 3, borderRadius: 4, maxWidth: 500, mx: 'auto', bgcolor: NOIR.surface, border: `1px solid ${NOIR.borderStrong}` }}>
            <Typography sx={{ color: NOIR.text, mb: 2, fontWeight: 700, fontFamily: '"Fraunces", serif', fontSize: '1.2rem' }}>
              Booking Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: NOIR.textDim }}>Selected Seats</Typography>
              <Typography sx={{ color: NOIR.amber, fontWeight: 700, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>
                {selectedSeats.join(', ')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: NOIR.textDim }}>Qty × Price</Typography>
              <Typography sx={{ color: NOIR.text }}>{selectedSeats.length} × ₹{seatInfo?.pricePerSeat}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, pt: 2, borderTop: `1px solid ${NOIR.border}` }}>
              <Typography sx={{ color: NOIR.text, fontWeight: 700, fontSize: '1.1rem' }}>Total</Typography>
              <Typography sx={{ color: NOIR.amber, fontWeight: 900, fontSize: '1.3rem' }}>₹{totalPrice}</Typography>
            </Box>
            <Button
              fullWidth variant="contained" size="large"
              onClick={() => navigate('/booking/confirm', {
                state: { showId: Number(id), selectedSeats, totalAmount: totalPrice, show, movie, pricePerSeat: seatInfo?.pricePerSeat }
              })}
              sx={{ fontSize: '1.05rem', py: 1.5 }}
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
