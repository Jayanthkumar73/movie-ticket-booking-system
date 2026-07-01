import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, CircularProgress, Card, CardContent,
  Button, Chip, Grid, Divider
} from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import axios from 'axios';
import { NOIR, pageBg } from '../theme';

const ShowsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [groupedShows, setGroupedShows] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieRes, showsRes] = await Promise.all([
          axios.get(`/api/movies/${id}`),
          axios.get(`/api/shows/movie/${id}`)
        ]);
        setMovie(movieRes.data);
        const shows = showsRes.data;
        const grouped = shows.reduce((acc, show) => {
          const date = show.showDate;
          if (!acc[date]) acc[date] = [];
          acc[date].push(show);
          return acc;
        }, {});
        setGroupedShows(grouped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={pageBg}>
      <CircularProgress sx={{ color: NOIR.amber }} />
    </Box>
  );

  return (
    <Box sx={pageBg}>
      {/* Cinematic backdrop header */}
      {movie && (
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          {movie.posterImageUrl && (
            <Box sx={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${movie.posterImageUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(28px) brightness(0.35)', transform: 'scale(1.15)',
            }} />
          )}
          <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(10,10,11,0.55), ${NOIR.bg})` }} />
          <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 5, md: 7 }, pb: { xs: 4, md: 6 } }}>
            <Button variant="text" sx={{ mb: 3, px: 0 }} onClick={() => navigate('/movies')}>← All movies</Button>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Box
                component="img"
                src={movie.posterImageUrl || 'https://via.placeholder.com/200x300?text=No+Poster'}
                alt={movie.movieName}
                sx={{ width: 190, height: 285, objectFit: 'cover', borderRadius: 3, border: `1px solid ${NOIR.borderStrong}`, boxShadow: '0 30px 60px -20px rgba(0,0,0,0.9)', flexShrink: 0 }}
              />
              <Box sx={{ flex: 1, minWidth: 260 }}>
                <Typography sx={{ color: NOIR.amber, letterSpacing: '0.28em', fontSize: '0.7rem', fontWeight: 700, mb: 1.5 }}>
                  NOW SHOWING
                </Typography>
                <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: { xs: '2.2rem', md: '3.2rem' }, lineHeight: 1.05, letterSpacing: '-0.02em', mb: 2 }}>
                  {movie.movieName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                  <Chip label={movie.language} sx={{ bgcolor: NOIR.amberSoft, color: NOIR.amber, border: `1px solid ${NOIR.border}` }} />
                  <Chip label={movie.genre} sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: NOIR.text, border: `1px solid ${NOIR.border}` }} />
                  <Chip icon={<AccessTime sx={{ color: `${NOIR.textDim} !important`, fontSize: 16 }} />} label={`${movie.duration} min`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: NOIR.textDim, border: `1px solid ${NOIR.border}` }} />
                </Box>
                {movie.description && (
                  <Typography sx={{ color: NOIR.textDim, lineHeight: 1.75, maxWidth: 620 }}>
                    {movie.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ pb: 10, pt: 4 }}>
        <Typography variant="h5" sx={{ color: NOIR.text, mb: 3, fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
          Choose a showtime
        </Typography>

        {Object.keys(groupedShows).length === 0 ? (
          <Card sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
            <Typography sx={{ color: NOIR.textDim, fontSize: '1.05rem' }}>
              No showtimes scheduled for this film yet.
            </Typography>
            <Button variant="outlined" sx={{ mt: 2.5 }} onClick={() => navigate('/movies')}>← Back to Movies</Button>
          </Card>
        ) : (
          Object.entries(groupedShows)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateShows]) => (
              <Box key={date} sx={{ mb: 5 }}>
                <Typography sx={{ color: NOIR.amber, mb: 2, fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </Typography>
                <Grid container spacing={2}>
                  {dateShows.sort((a, b) => a.showTime.localeCompare(b.showTime)).map(show => {
                    const cancelled = show.status === 'CANCELLED';
                    return (
                      <Grid item xs={12} sm={6} md={4} key={show.id}>
                        <Card sx={{
                          borderRadius: 3, transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s',
                          '&:hover': !cancelled ? {
                            transform: 'translateY(-4px)',
                            borderColor: 'rgba(229,183,105,0.5)',
                            boxShadow: '0 18px 40px -18px rgba(0,0,0,0.9)',
                          } : {},
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
                              <Typography sx={{ color: NOIR.text, fontWeight: 800, fontSize: '1.5rem', fontFamily: '"Fraunces", serif' }}>
                                {show.showTime.substring(0, 5)}
                              </Typography>
                              <Chip label={cancelled ? 'CANCELLED' : 'AVAILABLE'} size="small"
                                sx={{
                                  bgcolor: cancelled ? NOIR.dangerSoft : NOIR.successSoft,
                                  color: cancelled ? NOIR.danger : NOIR.success,
                                  fontWeight: 700, fontSize: '0.65rem',
                                }} />
                            </Box>
                            <Typography sx={{ color: NOIR.textDim, fontSize: '0.85rem', mb: 1.5 }}>
                              {show.screen?.screenName || 'Screen'} · {show.screen?.screenType || 'REGULAR'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2 }}>
                              <Typography sx={{ color: NOIR.text, fontWeight: 800, fontSize: '1.2rem' }}>₹{show.pricePerSeat}</Typography>
                              <Typography sx={{ color: NOIR.textFaint, fontSize: '0.8rem' }}>/ seat</Typography>
                            </Box>
                            <Button
                              fullWidth variant="contained" disabled={cancelled}
                              onClick={() => navigate(`/shows/${show.id}/seats`, { state: { show, movie } })}
                              sx={cancelled ? { bgcolor: 'rgba(255,255,255,0.06) !important', color: `${NOIR.textFaint} !important` } : {}}
                            >
                              Select Seats
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
                <Divider sx={{ mt: 3, borderColor: NOIR.border }} />
              </Box>
            ))
        )}
      </Container>
    </Box>
  );
};

export default ShowsPage;
