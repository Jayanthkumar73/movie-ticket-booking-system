import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Button, Paper, Alert, Chip } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
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
  const [locking, setLocking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatRows, setSeatRows] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadSeats = () =>
      axios.get(`/api/shows/${id}/seats`)
        .then(res => {
          setSeatInfo(res.data);
          setSeatRows(generateSeats(res.data.totalSeats));
          setLoading(false);
        })
        .catch(() => setLoading(false));

    loadSeats();

    // Refresh seat availability every 30 seconds so newly booked or released
    // seats appear immediately without the user having to reload the page.
    const interval = setInterval(() => {
      axios.get(`/api/shows/${id}/seats`)
        .then(res => setSeatInfo(res.data))
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
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

  const handleProceedToPayment = async () => {
    const { token } = useSelector.getState ? useSelector.getState().auth : { token: localStorage.getItem('token') }; // Fallback if useSelector can't be used here easily, wait we can just use the token from state
    setLocking(true);
    setErrorMsg('');
    try {
      // Get the token from Redux store directly (via a hook we'll add above or localStorage)
      const currentToken = localStorage.getItem('token'); // Simplest way to get it here if we don't extract it
      const res = await axios.post('/api/bookings/lock', {
        showId: Number(id),
        selectedSeats
      }, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      // Successfully locked. Pass the booking ID to the confirmation page.
      navigate('/booking/confirm', {
        state: { 
          bookingId: res.data.id,
          showId: Number(id), 
          selectedSeats, 
          totalAmount: totalPrice, 
          show, 
          movie, 
          pricePerSeat: seatInfo?.pricePerSeat 
        }
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data || 'Failed to lock seats. Someone else may have just booked them.');
      // Refresh seat info to show the newly booked seats
      axios.get(`/api/shows/${id}/seats`).then(res => setSeatInfo(res.data)).catch(console.error);
    } finally {
      setLocking(false);
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={pageBg}>
      <CircularProgress sx={{ color: NOIR.amber }} />
    </Box>
  );

  return (
    <Box sx={{ ...pageBg, py: 4 }}>
      <Container maxWidth="lg">
        <Button variant="text" sx={{ mb: 2, px: 0 }} onClick={() => navigate(-1)}>← Back to Shows</Button>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, bgcolor: NOIR.dangerSoft, color: NOIR.danger, border: `1px solid rgba(229,72,77,0.3)` }}>
            {errorMsg}
          </Alert>
        )}

        <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: { xs: '1.9rem', md: '2.4rem' }, textAlign: 'center' }}>
          {movie?.movieName || 'Select Seats'}
        </Typography>

        {/* Theatre name banner — prominently shown so user always knows WHERE they are booking */}
        {show?.screen?.theatre?.theatreName && (
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 1, mt: 1.5, mb: 1,
          }}>
            <Chip
              icon={<LocationOn sx={{ color: `${NOIR.amber} !important`, fontSize: 16 }} />}
              label={
                <>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Theatre&nbsp;·&nbsp;</span>
                  <span style={{ color: '#E5B769', fontWeight: 800, fontSize: '0.9rem' }}>
                    {show.screen.theatre.theatreName}
                  </span>
                  {show.screen.theatre.city && (
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                      &nbsp;·&nbsp;{show.screen.theatre.city}
                    </span>
                  )}
                </>
              }
              sx={{
                bgcolor: 'rgba(229,183,105,0.1)',
                border: '1px solid rgba(229,183,105,0.35)',
                borderRadius: '24px',
                height: 38,
                px: 1,
                '& .MuiChip-label': { display: 'flex', alignItems: 'center' },
              }}
            />
          </Box>
        )}

        <Typography sx={{ color: NOIR.textDim, textAlign: 'center', mb: 5, mt: 0.5, fontSize: '0.9rem' }}>
          {show?.screen?.screenName} · {show?.screen?.screenType} · {show?.showDate} · {show?.showTime?.substring(0, 5)}
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
            {show?.screen?.theatre?.theatreName && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: NOIR.textDim }}>Theatre</Typography>
                <Typography sx={{ color: NOIR.amber, fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>
                  {show.screen.theatre.theatreName}
                </Typography>
              </Box>
            )}
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
              disabled={locking}
              onClick={handleProceedToPayment}
              sx={{ fontSize: '1.05rem', py: 1.5 }}
            >
              {locking ? <CircularProgress size={24} color="inherit" /> : 'Proceed to Payment →'}
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default SeatSelectionPage;
