import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, Button, TextField, Paper, Grid } from '@mui/material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AdminDashboard = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const { token, roles } = useSelector((state) => state.auth);

  const isSuperAdmin = roles && roles.includes('ROLE_SUPER_ADMIN');
  const isTheatreAdmin = roles && roles.includes('ROLE_THEATRE_ADMIN');

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchMovies = async () => {
    const res = await axios.get('http://localhost:8080/api/movies');
    setMovies(res.data);
  };

  const fetchTheatres = async () => {
    const res = await axios.get('http://localhost:8080/api/theatres');
    setTheatres(res.data);
  };

  useEffect(() => {
    if (isTheatreAdmin) {
      setTabIndex(0);
      fetchMovies();
    } else if (isSuperAdmin) {
      setTabIndex(1);
      fetchTheatres();
    }
  }, [isTheatreAdmin, isSuperAdmin]);

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const movieData = {
      movieName: formData.get('movieName'),
      language: formData.get('language'),
      genre: formData.get('genre'),
      duration: formData.get('duration'),
      releaseDate: formData.get('releaseDate'),
      description: formData.get('description'),
    };

    const payload = new FormData();
    payload.append('movie', new Blob([JSON.stringify(movieData)], { type: 'application/json' }));
    
    const file = formData.get('file');
    if (file && file.size > 0) {
      payload.append('file', file);
    }

    try {
      await axiosInstance.post('/movies', payload);
      alert('Movie Added Successfully');
      fetchMovies();
      e.target.reset();
    } catch (err) {
      alert('Failed to add movie');
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)}>
          {isTheatreAdmin && <Tab label="Manage Movies" value={0} />}
          {isSuperAdmin && <Tab label="Manage Theatres" value={1} />}
          {isSuperAdmin && <Tab label="Approve Admins" value={2} />}
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Add New Movie</Typography>
              <Box component="form" onSubmit={handleMovieSubmit}>
                <TextField fullWidth margin="dense" name="movieName" label="Movie Name" required />
                <TextField fullWidth margin="dense" name="language" label="Language" required />
                <TextField fullWidth margin="dense" name="genre" label="Genre" required />
                <TextField fullWidth margin="dense" name="duration" label="Duration (mins)" type="number" required />
                <TextField fullWidth margin="dense" name="releaseDate" label="Release Date" type="date" InputLabelProps={{ shrink: true }} required />
                <TextField fullWidth margin="dense" name="description" label="Description" multiline rows={3} />
                <Button variant="contained" component="label" sx={{ mt: 2, mr: 2 }}>
                  Upload Poster
                  <input type="file" name="file" hidden accept="image/*" />
                </Button>
                <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>Submit Movie</Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Current Movies ({movies.length})</Typography>
            {movies.map(m => (
              <Paper key={m.id} sx={{ p: 2, mb: 2 }}>
                <Typography fontWeight="bold">{m.movieName} ({m.language})</Typography>
              </Paper>
            ))}
          </Grid>
        </Grid>
      )}

      {tabIndex === 1 && (
        <Typography>Theatre management follows similar pattern...</Typography>
      )}
    </Container>
  );
};

export default AdminDashboard;
