import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Button, Paper, Alert, Chip } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { NOIR, pageBg } from '../theme';

// Legacy flat-price screens (no categories) fall back to a simple 10-per-row grid.
const generateFlatRows = (totalSeats) => {
  const rows = [];
  const seatsPerRow = 10;
  const numRows = Math.ceil(totalSeats / seatsPerRow);
  let seatCount = 0;
  for (let i = 0; i < numRows && seatCount < totalSeats; i++) {
    const letter = String.fromCharCode(65 + i);
    const seats = [];
    for (let j = 1; j <= seatsPerRow && seatCount < totalSeats; j++) {
      seats.push(j);
      seatCount++;
    }
    rows.push({ letter, seats });
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
  const [showtimes, setShowtimes] = useState([]); // sibling shows (same movie+theatre+date) for the tabs

  const theatreId = show?.screen?.theatre?.id;
  const showDate = show?.showDate;

  // Load seat info for the current show. Reset selection whenever the show changes.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setSelectedSeats([]);
    setErrorMsg('');

    const loadSeats = () =>
      axios.get(`/api/shows/${id}/seats`)
        .then(res => { setSeatInfo(res.data); setLoading(false); })
        .catch(() => setLoading(false));

    loadSeats();

    // Refresh availability periodically so seats booked by others appear without a reload.
    const interval = setInterval(() => {
      axios.get(`/api/shows/${id}/seats`)
        .then(res => setSeatInfo(res.data))
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, [id, isAuthenticated, navigate]);

  // Load the sibling showtimes (same movie, same theatre, same date) for the top tabs.
  useEffect(() => {
    if (!movie?.id || !theatreId || !showDate) return;
    axios.get(`/api/shows/movie/${movie.id}`)
      .then(res => {
        const siblings = res.data
          .filter(s => s.screen?.theatre?.id === theatreId && s.showDate === showDate && s.status === 'ACTIVE')
          .sort((a, b) => a.showTime.localeCompare(b.showTime));
        setShowtimes(siblings);
      })
      .catch(console.error);
  }, [movie?.id, theatreId, showDate]);

  const categories = seatInfo?.categories || [];
  const hasCategories = categories.length > 0;

  // Map a row letter -> its category (for pricing, colouring and bestseller state).
  const rowToCategory = useMemo(() => {
    const map = {};
    categories.forEach(cat => (cat.rowLabels || []).forEach(letter => { map[letter] = cat; }));
    return map;
  }, [categories]);

  const seatPrice = (seatId) => {
    const letter = seatId.charAt(0);
    if (hasCategories) return Number(rowToCategory[letter]?.price || 0);
    return Number(seatInfo?.pricePerSeat || 0);
  };

  const isBooked = (seatId) => seatInfo?.bookedSeats?.includes(seatId);

  const toggleSeat = (seatId) => {
    if (isBooked(seatId)) return;
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + seatPrice(s), 0);

  const switchShow = (target) => {
    if (String(target.id) === String(id)) return;
    navigate(`/shows/${target.id}/seats`, { state: { show: target, movie } });
  };

  const handleProceedToPayment = async () => {
    setLocking(true);
    setErrorMsg('');
    try {
      const currentToken = localStorage.getItem('token');
      const res = await axios.post('/api/bookings/lock', {
        showId: Number(id),
        selectedSeats,
      }, { headers: { Authorization: `Bearer ${currentToken}` } });

      navigate('/booking/confirm', {
        state: {
          bookingId: res.data.id,
          showId: Number(id),
          selectedSeats,
          totalAmount: totalPrice,
          show,
          movie,
          pricePerSeat: seatInfo?.pricePerSeat,
        },
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data || 'Failed to lock seats. Someone else may have just booked them.');
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

  // ── Seat cell ────────────────────────────────────────────────
  const Seat = ({ seatId, category }) => {
    const booked = isBooked(seatId);
    const selected = selectedSeats.includes(seatId);
    const bestseller = !!category?.bestseller;

    let bg = 'transparent';
    let color = NOIR.textDim;
    let border = `1px solid ${NOIR.border}`;
    if (booked) {
      bg = 'rgba(255,255,255,0.05)'; color = NOIR.textFaint; border = `1px solid rgba(255,255,255,0.06)`;
    } else if (selected) {
      bg = NOIR.amber; color = '#0a0a0b'; border = `1px solid ${NOIR.amber}`;
    } else if (bestseller) {
      color = NOIR.amber; border = `1px solid ${NOIR.amber}`;
    } else {
      color = NOIR.success; border = `1px solid rgba(95,191,128,0.5)`;
    }

    return (
      <Box
        onClick={() => toggleSeat(seatId)}
        sx={{
          width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: bg, color, border, borderRadius: '5px',
          fontSize: '0.6rem', fontWeight: 700,
          cursor: booked ? 'not-allowed' : 'pointer',
          boxShadow: selected ? '0 3px 10px rgba(229,183,105,0.4)' : 'none',
          transition: 'all 0.12s', userSelect: 'none',
          '&:hover': { transform: booked ? 'none' : 'translateY(-1px) scale(1.1)', zIndex: 1, position: 'relative' },
        }}
      >
        {seatId.substring(1)}
      </Box>
    );
  };

  // ── A single row of seats ────────────────────────────────────
  const SeatRow = ({ letter, seatNumbers, category }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75, justifyContent: 'center', gap: 1.25 }}>
      <Typography sx={{ color: NOIR.textFaint, width: 18, fontSize: '0.72rem', textAlign: 'right', flexShrink: 0 }}>
        {letter}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {seatNumbers.map((num, idx) => (
          <React.Fragment key={num}>
            {idx > 0 && idx === Math.ceil(seatNumbers.length / 2) && <Box sx={{ width: 14 }} />}
            <Seat seatId={`${letter}${num}`} category={category} />
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );

  // Build the render model. Category screens render back-to-front (expensive band on top,
  // row A nearest the screen at the bottom) to mirror a real cinema / BookMyShow.
  const renderBands = () => {
    if (hasCategories) {
      return [...categories].reverse().map((cat) => {
        const seatsPerRow = cat.seatsPerRow || 10;
        const seatNumbers = Array.from({ length: seatsPerRow }, (_, i) => i + 1);
        const rowsTopToBottom = [...(cat.rowLabels || [])].reverse();
        return (
          <Box key={cat.name + cat.price} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: NOIR.border }} />
              <Typography sx={{ color: NOIR.textDim, fontSize: '0.72rem', letterSpacing: '0.14em', fontWeight: 700, whiteSpace: 'nowrap' }}>
                ₹{Number(cat.price)} {cat.name?.toUpperCase()}
                {cat.bestseller && (
                  <Box component="span" sx={{ ml: 1, color: NOIR.amber, fontSize: '0.6rem', border: `1px solid ${NOIR.amber}`, borderRadius: '4px', px: 0.6, py: 0.1 }}>
                    BESTSELLER
                  </Box>
                )}
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: NOIR.border }} />
            </Box>
            {rowsTopToBottom.map(letter => (
              <SeatRow key={letter} letter={letter} seatNumbers={seatNumbers} category={cat} />
            ))}
          </Box>
        );
      });
    }
    // Flat fallback
    const flatRows = generateFlatRows(seatInfo?.totalSeats || 0);
    return [...flatRows].reverse().map(row => (
      <SeatRow key={row.letter} letter={row.letter} seatNumbers={row.seats} category={null} />
    ));
  };

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

        {show?.screen?.theatre?.theatreName && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1.5, mb: 1 }}>
            <Chip
              icon={<LocationOn sx={{ color: `${NOIR.amber} !important`, fontSize: 16 }} />}
              label={
                <>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Theatre&nbsp;·&nbsp;</span>
                  <span style={{ color: '#E5B769', fontWeight: 800, fontSize: '0.9rem' }}>{show.screen.theatre.theatreName}</span>
                  {show.screen.theatre.city && (
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>&nbsp;·&nbsp;{show.screen.theatre.city}</span>
                  )}
                </>
              }
              sx={{
                bgcolor: 'rgba(229,183,105,0.1)', border: '1px solid rgba(229,183,105,0.35)', borderRadius: '24px',
                height: 38, px: 1, '& .MuiChip-label': { display: 'flex', alignItems: 'center' },
              }}
            />
          </Box>
        )}

        <Typography sx={{ color: NOIR.textDim, textAlign: 'center', mb: 3, mt: 0.5, fontSize: '0.9rem' }}>
          {show?.screen?.screenName} · {show?.screen?.screenType} · {show?.showDate}
        </Typography>

        {/* Showtime tabs — switch between shows at this theatre on the same day */}
        {showtimes.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.25, justifyContent: 'center', flexWrap: 'wrap', mb: 5 }}>
            {showtimes.map(st => {
              const active = String(st.id) === String(id);
              return (
                <Box
                  key={st.id}
                  onClick={() => switchShow(st)}
                  sx={{
                    px: 2.25, py: 1, borderRadius: '10px', cursor: active ? 'default' : 'pointer',
                    fontWeight: 700, fontSize: '0.85rem', userSelect: 'none',
                    color: active ? '#0a0a0b' : NOIR.text,
                    bgcolor: active ? NOIR.amber : 'transparent',
                    border: `1px solid ${active ? NOIR.amber : NOIR.borderStrong}`,
                    transition: 'all 0.15s',
                    '&:hover': active ? {} : { borderColor: NOIR.amber, color: NOIR.amber },
                  }}
                >
                  {st.showTime.substring(0, 5)}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Seat map */}
        <Box sx={{ overflowX: 'auto', mb: 4 }}>
          <Box sx={{ minWidth: 'fit-content' }}>
            {renderBands()}
          </Box>
        </Box>

        {/* Curved screen */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            height: 44, mx: 'auto', width: '62%', maxWidth: 620,
            borderTop: `3px solid ${NOIR.amber}`,
            borderRadius: '50% / 100% 100% 0 0',
            background: 'linear-gradient(to bottom, rgba(229,183,105,0.18), transparent)',
            boxShadow: `0 -12px 30px -8px rgba(229,183,105,0.35)`,
          }} />
          <Typography sx={{ color: NOIR.textFaint, fontSize: '0.75rem', letterSpacing: '0.28em', mt: 1 }}>
            ALL EYES THIS WAY PLEASE
          </Typography>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 5, flexWrap: 'wrap' }}>
          {[
            { color: NOIR.amber, label: 'Bestseller', filled: false, borderCol: NOIR.amber },
            { color: NOIR.success, label: 'Available', filled: false, borderCol: 'rgba(95,191,128,0.6)' },
            { color: NOIR.amber, label: 'Selected', filled: true, borderCol: NOIR.amber },
            { color: 'rgba(255,255,255,0.06)', label: 'Sold', filled: true, borderCol: 'rgba(255,255,255,0.08)' },
          ].map(item => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 18, height: 18, bgcolor: item.filled ? item.color : 'transparent', borderRadius: '4px', border: `1px solid ${item.borderCol}` }} />
              <Typography sx={{ color: NOIR.textDim, fontSize: '0.82rem' }}>{item.label}</Typography>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, pt: 2, borderTop: `1px solid ${NOIR.border}` }}>
              <Typography sx={{ color: NOIR.text, fontWeight: 700, fontSize: '1.1rem' }}>Total ({selectedSeats.length})</Typography>
              <Typography sx={{ color: NOIR.amber, fontWeight: 900, fontSize: '1.3rem' }}>₹{totalPrice}</Typography>
            </Box>
            <Button fullWidth variant="contained" size="large" disabled={locking} onClick={handleProceedToPayment} sx={{ fontSize: '1.05rem', py: 1.5 }}>
              {locking ? <CircularProgress size={24} color="inherit" /> : 'Proceed to Payment →'}
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default SeatSelectionPage;
