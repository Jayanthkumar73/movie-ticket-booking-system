import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, CircularProgress, Box, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MovieListPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get('/api/movies');
        setMovies(response.data);
      } catch (error) {
        console.error('Failed to fetch movies', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        sx={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}
      >
        <CircularProgress sx={{ color: '#ff6b6b' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            fontWeight="900"
            sx={{
              color: '#fff',
              mb: 1,
              background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Now Showing
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>
            Book your favourite movie tickets instantly
          </Typography>
        </Box>

        {movies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>
              No movies available right now. Check back soon!
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {movies.map((movie) => (
              <Grid item key={movie.id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  onClick={() => navigate(`/movies/${movie.id}/shows`)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 60px rgba(255,107,107,0.4)',
                      border: '1px solid rgba(255,107,107,0.6)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      image={movie.posterImageUrl || 'https://via.placeholder.com/300x450?text=No+Poster'}
                      alt={movie.movieName}
                      sx={{ height: 360, objectFit: 'cover', transition: 'transform 0.4s', '&:hover': { transform: 'scale(1.05)' } }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
                      }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography gutterBottom variant="h6" fontWeight="800" noWrap sx={{ color: '#fff' }}>
                      {movie.movieName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      <Chip
                        label={movie.language}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,107,107,0.2)', color: '#ff6b6b', fontSize: '0.7rem' }}
                      />
                      <Chip
                        label={movie.genre}
                        size="small"
                        sx={{ bgcolor: 'rgba(78,205,196,0.2)', color: '#4ecdc4', fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
                      ⏱ {movie.duration} mins
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={(e) => { e.stopPropagation(); navigate(`/movies/${movie.id}/shows`); }}
                      sx={{
                        background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)',
                        fontWeight: 700,
                        borderRadius: 2,
                        color: '#000',
                        '&:hover': { opacity: 0.9, transform: 'scale(1.02)' },
                      }}
                    >
                      Book Tickets
                    </Button>
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

export default MovieListPage;
