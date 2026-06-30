import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, CircularProgress, Card, CardContent,
  Button, Chip, Grid, Divider
} from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import axios from 'axios';

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
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"
      sx={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <CircularProgress sx={{ color: '#ff6b6b' }} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)', py: 4 }}>
      <Container maxWidth="lg">
        {movie && (
          <Box sx={{ display: 'flex', gap: 4, mb: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box
              component="img"
              src={movie.posterImageUrl || 'https://via.placeholder.com/200x300?text=No+Poster'}
              alt={movie.movieName}
              sx={{ width: 200, height: 300, objectFit: 'cover', borderRadius: 3, boxShadow: '0 20px 60px rgba(0,0,0,0.8)', flexShrink: 0 }}
            />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h3" fontWeight="900" sx={{ color: '#fff', mb: 2 }}>{movie.movieName}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label={movie.language} sx={{ bgcolor: 'rgba(255,107,107,0.2)', color: '#ff6b6b', border: '1px solid #ff6b6b' }} />
                <Chip label={movie.genre} sx={{ bgcolor: 'rgba(78,205,196,0.2)', color: '#4ecdc4', border: '1px solid #4ecdc4' }} />
                <Chip
                  label={`${movie.duration} mins`}
                  icon={<AccessTime sx={{ color: '#ffd93d !important' }} />}
                  sx={{ bgcolor: 'rgba(255,217,61,0.2)', color: '#ffd93d', border: '1px solid #ffd93d' }}
                />
              </Box>
              {movie.description && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 600 }}>
                  {movie.description}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Typography variant="h5" fontWeight="700" sx={{ color: '#fff', mb: 3 }}>
          🎭 Available Shows
        </Typography>

        {Object.keys(groupedShows).length === 0 ? (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>
              No shows available for this movie yet.
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
              onClick={() => navigate('/movies')}
            >
              ← Back to Movies
            </Button>
          </Card>
        ) : (
          Object.entries(groupedShows)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateShows]) => (
              <Box key={date} sx={{ mb: 5 }}>
                <Typography variant="h6" sx={{ color: '#ffd93d', mb: 2, fontWeight: 700 }}>
                  📅 {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </Typography>
                <Grid container spacing={2}>
                  {dateShows.sort((a, b) => a.showTime.localeCompare(b.showTime)).map(show => (
                    <Grid item xs={12} sm={6} md={4} key={show.id}>
                      <Card sx={{
                        bgcolor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 3,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(255,107,107,0.3)',
                          border: '1px solid rgba(255,107,107,0.5)'
                        }
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AccessTime sx={{ color: '#ffd93d', fontSize: 20 }} />
                            <Typography variant="h6" fontWeight="700" sx={{ color: '#fff' }}>
                              {show.showTime.substring(0, 5)}
                            </Typography>
                          </Box>
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', mb: 0.5 }}>
                            🎬 {show.screen?.screenName || 'Screen'} • {show.screen?.screenType || 'REGULAR'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                            <Typography sx={{ color: '#4ecdc4', fontWeight: 700, fontSize: '1.1rem' }}>
                              ₹{show.pricePerSeat}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>/ seat</Typography>
                          </Box>
                          <Chip
                            label={show.status || 'AVAILABLE'}
                            size="small"
                            sx={{
                              mb: 2,
                              bgcolor: show.status === 'CANCELLED' ? 'rgba(192,57,43,0.2)' : 'rgba(86,171,47,0.2)',
                              color: show.status === 'CANCELLED' ? '#c0392b' : '#56ab2f',
                              border: `1px solid ${show.status === 'CANCELLED' ? '#c0392b' : '#56ab2f'}`,
                              fontWeight: 600
                            }}
                          />
                          <Button
                            fullWidth
                            variant="contained"
                            disabled={show.status === 'CANCELLED'}
                            onClick={() => navigate(`/shows/${show.id}/seats`, { state: { show, movie } })}
                            sx={{
                              background: show.status === 'CANCELLED'
                                ? 'rgba(255,255,255,0.1)'
                                : 'linear-gradient(45deg, #ff6b6b, #ffd93d)',
                              color: show.status === 'CANCELLED' ? 'rgba(255,255,255,0.3)' : '#000',
                              fontWeight: 700,
                              borderRadius: 2,
                              '&:hover': { opacity: 0.9, transform: 'scale(1.02)' }
                            }}
                          >
                            Select Seats
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ mt: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
              </Box>
            ))
        )}
      </Container>
    </Box>
  );
};

export default ShowsPage;
