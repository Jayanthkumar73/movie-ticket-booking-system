import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, CircularProgress, Box } from '@mui/material';
import axios from 'axios';

const MovieListPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/movies');
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
    return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  }

  return (
    <Container sx={{ py: 8 }} maxWidth="lg">
      <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
        Currently Running
      </Typography>
      <Grid container spacing={4}>
        {movies.map((movie) => (
          <Grid item key={movie.id} xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.05)' } }}>
              <CardMedia
                component="img"
                image={movie.posterImageUrl || 'https://via.placeholder.com/300x450?text=No+Poster'}
                alt={movie.movieName}
                sx={{ height: 400, objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2" noWrap>
                  {movie.movieName}
                </Typography>
                <Typography color="text.secondary">
                  {movie.language} • {movie.genre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {movie.duration} mins
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MovieListPage;
