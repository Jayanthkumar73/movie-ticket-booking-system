import React, { useEffect, useMemo, useState } from 'react';
import { Container, Grid, Typography, CircularProgress, Box, Button, TextField, InputAdornment, Chip } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NOIR, pageBg, spotlight } from '../theme';

const MovieListPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
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

  // Unique genres across all movies (genre may be comma-separated, e.g. "Action, Sci-Fi").
  const genres = useMemo(() => {
    const set = new Set();
    movies.forEach(m => (m.genre || '').split(',').forEach(g => {
      const t = g.trim();
      if (t) set.add(t);
    }));
    return ['All', ...Array.from(set).sort()];
  }, [movies]);

  // Filter by search text (name / genre / language) and the active genre chip.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movies.filter(m => {
      const matchesGenre = activeGenre === 'All' || (m.genre || '').toLowerCase().includes(activeGenre.toLowerCase());
      const matchesQuery = !q
        || (m.movieName || '').toLowerCase().includes(q)
        || (m.genre || '').toLowerCase().includes(q)
        || (m.language || '').toLowerCase().includes(q);
      return matchesGenre && matchesQuery;
    });
  }, [movies, query, activeGenre]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={pageBg}>
        <CircularProgress sx={{ color: NOIR.amber }} />
      </Box>
    );
  }

  return (
    <Box sx={pageBg}>
      {/* Hero */}
      <Box sx={{ ...spotlight, pt: { xs: 7, md: 11 }, pb: { xs: 5, md: 7 }, textAlign: 'center', px: 2 }}>
        <Typography sx={{ color: NOIR.amber, letterSpacing: '0.32em', fontSize: '0.72rem', fontWeight: 700, mb: 2 }}>
          NOW SHOWING IN CINEMAS
        </Typography>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text,
          fontSize: { xs: '2.4rem', md: '4rem' }, lineHeight: 1.04, letterSpacing: '-0.02em',
          maxWidth: 820, mx: 'auto',
        }}>
          The stories that{' '}
          <Box component="em" sx={{ color: NOIR.amber, fontStyle: 'italic' }}>move</Box> us.
        </Typography>
        <Typography sx={{ color: NOIR.textDim, fontSize: '1.05rem', mt: 2.5, maxWidth: 520, mx: 'auto' }}>
          Hand-picked cinema, booked in seconds. Choose your film, pick your seat, and dim the lights.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 10 }}>
        {/* Search + genre filters */}
        {movies.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <TextField
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by movie, genre or language…"
              sx={{
                maxWidth: 620, mx: 'auto', display: 'block',
                '& .MuiOutlinedInput-root': {
                  color: NOIR.text, borderRadius: 3, bgcolor: NOIR.surface,
                  '& fieldset': { borderColor: NOIR.border },
                  '&:hover fieldset': { borderColor: NOIR.borderStrong },
                  '&.Mui-focused fieldset': { borderColor: NOIR.amber },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: NOIR.textDim }} />
                  </InputAdornment>
                ),
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <Clear sx={{ color: NOIR.textDim, cursor: 'pointer' }} onClick={() => setQuery('')} />
                  </InputAdornment>
                ) : null,
              }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 3 }}>
              {genres.map(g => {
                const active = g === activeGenre;
                return (
                  <Chip
                    key={g}
                    label={g}
                    onClick={() => setActiveGenre(g)}
                    sx={{
                      cursor: 'pointer', fontWeight: 600,
                      bgcolor: active ? NOIR.amberSoft : 'rgba(255,255,255,0.04)',
                      color: active ? NOIR.amber : NOIR.textDim,
                      border: `1px solid ${active ? 'rgba(229,183,105,0.5)' : NOIR.border}`,
                      '&:hover': { borderColor: NOIR.borderStrong, color: NOIR.text },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {movies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ color: NOIR.textDim, fontSize: '1.2rem' }}>
              The reel is empty right now. Check back soon for new releases.
            </Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: NOIR.text, fontSize: '1.15rem', fontFamily: '"Fraunces", serif', mb: 1 }}>
              No matches found
            </Typography>
            <Typography sx={{ color: NOIR.textDim, mb: 3 }}>
              Nothing matches “{query || activeGenre}”. Try another search.
            </Typography>
            <Button variant="outlined" onClick={() => { setQuery(''); setActiveGenre('All'); }}>Clear filters</Button>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 3, md: 4 }}>
            {filtered.map((movie) => (
              <Grid key={movie.id} xs={6} sm={6} md={4} lg={3}>
                <Box
                  onClick={() => navigate(`/movies/${movie.id}/shows`)}
                  sx={{
                    height: '100%', cursor: 'pointer', borderRadius: 4, overflow: 'hidden',
                    border: `1px solid ${NOIR.border}`, bgcolor: NOIR.surface,
                    transition: 'transform 0.35s cubic-bezier(.2,.7,.2,1), box-shadow 0.35s, border-color 0.35s',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 30px 60px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(229,183,105,0.4)',
                      borderColor: 'transparent',
                    },
                    '&:hover .poster-img': { transform: 'scale(1.06)' },
                    '&:hover .book-cta': { opacity: 1, transform: 'translateY(0)' },
                  }}
                >
                  <Box sx={{ position: 'relative', aspectRatio: '2 / 3', overflow: 'hidden' }}>
                    <Box
                      component="img"
                      className="poster-img"
                      src={movie.posterImageUrl || 'https://via.placeholder.com/300x450?text=No+Poster'}
                      alt={movie.movieName}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(.2,.7,.2,1)' }}
                    />
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.1) 45%, transparent 70%)' }} />

                    {/* Rating badge */}
                    <Box sx={{
                      position: 'absolute', top: 10, left: 10,
                      display: 'flex', alignItems: 'center', gap: 0.4,
                      bgcolor: 'rgba(10,10,11,0.7)', backdropFilter: 'blur(4px)',
                      border: `1px solid ${NOIR.border}`, borderRadius: 2, px: 0.9, py: 0.3,
                    }}>
                      <Box component="span" sx={{ color: NOIR.gold, fontSize: '0.72rem' }}>★</Box>
                      <Typography sx={{ color: NOIR.text, fontSize: '0.72rem', fontWeight: 700 }}>
                        {movie.imdbId ? 'IMDb' : 'New'}
                      </Typography>
                    </Box>

                    {/* Bottom overlay content */}
                    <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: 2 }}>
                      <Typography sx={{ fontFamily: '"Fraunces", serif', color: NOIR.text, fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.15, mb: 0.6 }} noWrap title={movie.movieName}>
                        {movie.movieName}
                      </Typography>
                      <Typography sx={{ color: NOIR.textDim, fontSize: '0.75rem', letterSpacing: '0.02em' }} noWrap>
                        {movie.language} · {movie.genre} · {movie.duration}m
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        className="book-cta"
                        onClick={(e) => { e.stopPropagation(); navigate(`/movies/${movie.id}/shows`); }}
                        sx={{ mt: 1.5, opacity: 0, transform: 'translateY(8px)', transition: 'opacity 0.3s, transform 0.3s', fontSize: '0.82rem' }}
                      >
                        Book Tickets
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default MovieListPage;
