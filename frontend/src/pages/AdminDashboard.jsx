import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Tabs, Tab, Button, TextField, Paper,
  Grid, Select, MenuItem, FormControl, InputLabel, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import {
  Add, Edit, Delete, FileDownload, PictureAsPdf, Assessment,
  Movie, Business, Theaters, EventSeat, BookOnline, AdminPanelSettings
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────
// Helper: Axios instance with auth
// ─────────────────────────────────────────────────────────
const useAuthAxios = (token) => {
  return React.useMemo(() => axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const darkCard = {
  bgcolor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 3,
  p: 3,
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#ff6b6b' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.6)' },
  '& .MuiInputBase-input': { color: '#fff' },
};

// ─────────────────────────────────────────────────────────
// TAB 0: Manage Movies
// ─────────────────────────────────────────────────────────
const ManageMoviesTab = ({ token }) => {
  const api = useAuthAxios(token);
  const [movies, setMovies] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchMovies = useCallback(async () => {
    const res = await axios.get('/api/movies');
    setMovies(res.data);
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  const handleSubmit = async (e) => {
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
    if (file && file.size > 0) payload.append('file', file);
    try {
      await api.post('/movies', payload);
      setMsg('Movie added successfully!');
      setError('');
      fetchMovies();
      e.target.reset();
    } catch (err) {
      setError('Failed to add movie.');
      setMsg('');
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={5}>
        <Box sx={darkCard}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Add sx={{ color: '#ff6b6b' }} /> Add New Movie
          </Typography>
          {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            {[
              { name: 'movieName', label: 'Movie Name', type: 'text' },
              { name: 'language', label: 'Language', type: 'text' },
              { name: 'genre', label: 'Genre', type: 'text' },
              { name: 'duration', label: 'Duration (mins)', type: 'number' },
              { name: 'releaseDate', label: 'Release Date', type: 'date' },
            ].map(f => (
              <TextField key={f.name} fullWidth margin="dense" name={f.name} label={f.label} type={f.type}
                InputLabelProps={f.type === 'date' ? { shrink: true } : undefined}
                required sx={inputSx} />
            ))}
            <TextField fullWidth margin="dense" name="description" label="Description" multiline rows={3} sx={inputSx} />
            <Button variant="outlined" component="label" sx={{ mt: 2, mr: 2, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              Upload Poster
              <input type="file" name="file" hidden accept="image/*" />
            </Button>
            <Button variant="contained" type="submit"
              sx={{ mt: 2, background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)', color: '#000', fontWeight: 700 }}>
              Add Movie
            </Button>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} md={7}>
        <Box sx={{ ...darkCard, p: 0, overflow: 'hidden' }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', p: 3, pb: 2 }}>
            Current Movies ({movies.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '0.75rem' } }}>
                  <TableCell>MOVIE</TableCell>
                  <TableCell>LANGUAGE</TableCell>
                  <TableCell>GENRE</TableCell>
                  <TableCell>DURATION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movies.map(m => (
                  <TableRow key={m.id} sx={{ '& td': { color: '#fff', borderColor: 'rgba(255,255,255,0.08)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                    <TableCell fontWeight={700}>{m.movieName}</TableCell>
                    <TableCell><Chip label={m.language} size="small" sx={{ bgcolor: 'rgba(255,107,107,0.2)', color: '#ff6b6b', fontSize: '0.7rem' }} /></TableCell>
                    <TableCell>{m.genre}</TableCell>
                    <TableCell>{m.duration}m</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Grid>
    </Grid>
  );
};

// ─────────────────────────────────────────────────────────
// TAB 1: Manage Theatres (SUPER_ADMIN)
// ─────────────────────────────────────────────────────────
const ManageTheatresTab = ({ token }) => {
  const api = useAuthAxios(token);
  const [theatres, setTheatres] = useState([]);
  const emptyForm = { theatreName: '', city: '', address: '', managerName: '', managerContact: '' };
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTheatres = useCallback(async () => {
    try {
      const res = await api.get('/theatres');
      setTheatres(res.data);
    } catch (e) { console.error(e); }
  }, [api]);

  useEffect(() => { fetchTheatres(); }, [fetchTheatres]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Backend expects a multipart request: a JSON "theatre" part + optional "file".
      const formData = new FormData(e.target);
      const theatreData = {
        theatreName: form.theatreName,
        city: form.city,
        address: form.address,
        managerName: form.managerName,
        managerContact: form.managerContact,
      };
      const payload = new FormData();
      payload.append('theatre', new Blob([JSON.stringify(theatreData)], { type: 'application/json' }));
      const file = formData.get('file');
      if (file && file.size > 0) payload.append('file', file);

      await api.post('/theatres', payload);
      setMsg('Theatre added!');
      setError('');
      setForm(emptyForm);
      e.target.reset();
      fetchTheatres();
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || err.response?.data;
      setError(
        status === 403
          ? 'Not authorized to add theatre (403). Make sure you are logged in as an admin and the backend has been restarted.'
          : `Failed to add theatre${status ? ` (${status})` : ''}: ${serverMsg || err.message}`
      );
      setMsg('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={5}>
        <Box sx={darkCard}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3 }}><Add sx={{ color: '#ff6b6b', mr: 1 }} />Add Theatre</Typography>
          {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth margin="dense" label="Theatre Name" value={form.theatreName} onChange={e => setForm(p => ({ ...p, theatreName: e.target.value }))} required sx={inputSx} />
            <TextField fullWidth margin="dense" label="City" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required sx={inputSx} />
            <TextField fullWidth margin="dense" label="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required multiline rows={2} sx={inputSx} />
            <TextField fullWidth margin="dense" label="Manager Name" value={form.managerName} onChange={e => setForm(p => ({ ...p, managerName: e.target.value }))} required sx={inputSx} />
            <TextField fullWidth margin="dense" label="Manager Contact" value={form.managerContact} onChange={e => setForm(p => ({ ...p, managerContact: e.target.value }))} required sx={inputSx} />
            <Button variant="outlined" component="label" sx={{ mt: 2, mr: 2, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              Upload Image
              <input type="file" name="file" hidden accept="image/*" />
            </Button>
            <Button variant="contained" type="submit" disabled={submitting} sx={{ mt: 2, background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)', color: '#000', fontWeight: 700 }}>
              {submitting ? 'Adding…' : 'Add Theatre'}
            </Button>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} md={7}>
        <Box sx={{ ...darkCard, p: 0, overflow: 'hidden' }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', p: 3, pb: 2 }}>Theatres ({theatres.length})</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '0.75rem' } }}>
                  <TableCell>NAME</TableCell><TableCell>CITY</TableCell><TableCell>ADDRESS</TableCell><TableCell>MANAGER</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {theatres.map(t => (
                  <TableRow key={t.id} sx={{ '& td': { color: '#fff', borderColor: 'rgba(255,255,255,0.08)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                    <TableCell fontWeight={700}>{t.theatreName}</TableCell>
                    <TableCell>{t.city}</TableCell>
                    <TableCell>{t.address}</TableCell>
                    <TableCell>{t.managerName}{t.managerContact ? ` (${t.managerContact})` : ''}</TableCell>
                  </TableRow>
                ))}
                {theatres.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', borderColor: 'rgba(255,255,255,0.08)', py: 3 }}>
                      No theatres added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Grid>
    </Grid>
  );
};

// ─────────────────────────────────────────────────────────
// TAB 2: Manage Screens
// ─────────────────────────────────────────────────────────
const ManageScreensTab = ({ token }) => {
  const api = useAuthAxios(token);
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [screens, setScreens] = useState([]);
  const [form, setForm] = useState({ screenName: '', totalSeats: '', screenType: 'REGULAR' });
  const [editingScreen, setEditingScreen] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/theatres').then(res => setTheatres(res.data)).catch(console.error);
  }, [api]);

  const fetchScreens = useCallback(async (theatreId) => {
    if (!theatreId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/screens?theatreId=${theatreId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScreens(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  const handleTheatreChange = (e) => {
    setSelectedTheatreId(e.target.value);
    fetchScreens(e.target.value);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedTheatreId) { setError('Please select a theatre first.'); return; }
    try {
      await axios.post(`/api/screens?theatreId=${selectedTheatreId}`,
        { screenName: form.screenName, totalSeats: Number(form.totalSeats), screenType: form.screenType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg('Screen added!');
      setError('');
      setForm({ screenName: '', totalSeats: '', screenType: 'REGULAR' });
      fetchScreens(selectedTheatreId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add screen');
      setMsg('');
    }
  };

  const handleEdit = (screen) => {
    setEditingScreen(screen.id);
    setEditForm({ screenName: screen.screenName, totalSeats: screen.totalSeats, screenType: screen.screenType });
  };

  const handleUpdate = async (screenId) => {
    try {
      await axios.put(`/api/screens/${screenId}`,
        { screenName: editForm.screenName, totalSeats: Number(editForm.totalSeats), screenType: editForm.screenType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingScreen(null);
      setMsg('Screen updated!');
      fetchScreens(selectedTheatreId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (screenId) => {
    if (!window.confirm('Delete this screen?')) return;
    try {
      await axios.delete(`/api/screens/${screenId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Screen deleted!');
      fetchScreens(selectedTheatreId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <Box>
      {msg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Box sx={darkCard}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3 }}>Add Screen</Typography>

            <FormControl fullWidth sx={{ mb: 2, ...inputSx }}>
              <InputLabel>Select Theatre</InputLabel>
              <Select value={selectedTheatreId} label="Select Theatre" onChange={handleTheatreChange}
                sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}>
                {theatres.map(t => <MenuItem key={t.id} value={t.id}>{t.theatreName}</MenuItem>)}
              </Select>
            </FormControl>

            <Box component="form" onSubmit={handleAdd}>
              <TextField fullWidth margin="dense" label="Screen Name" value={form.screenName}
                onChange={e => setForm(p => ({ ...p, screenName: e.target.value }))} required sx={inputSx} />
              <TextField fullWidth margin="dense" label="Total Seats" type="number" value={form.totalSeats}
                onChange={e => setForm(p => ({ ...p, totalSeats: e.target.value }))} required sx={inputSx} />
              <FormControl fullWidth sx={{ mt: 1, mb: 1, ...inputSx }}>
                <InputLabel>Screen Type</InputLabel>
                <Select value={form.screenType} label="Screen Type"
                  onChange={e => setForm(p => ({ ...p, screenType: e.target.value }))}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}>
                  {['REGULAR', 'PREMIUM', 'IMAX'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <Button fullWidth variant="contained" type="submit"
                sx={{ mt: 2, background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)', color: '#000', fontWeight: 700 }}>
                Add Screen
              </Button>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ ...darkCard, p: 0, overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', p: 3, pb: 2 }}>
              Screens {selectedTheatreId ? `(${screens.length})` : '— Select a theatre'}
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#ff6b6b' }} /></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '0.75rem' } }}>
                      <TableCell>SCREEN NAME</TableCell>
                      <TableCell>TOTAL SEATS</TableCell>
                      <TableCell>TYPE</TableCell>
                      <TableCell>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {screens.map(s => (
                      <TableRow key={s.id} sx={{ '& td': { color: '#fff', borderColor: 'rgba(255,255,255,0.08)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                        {editingScreen === s.id ? (
                          <>
                            <TableCell>
                              <TextField size="small" value={editForm.screenName}
                                onChange={e => setEditForm(p => ({ ...p, screenName: e.target.value }))}
                                sx={{ ...inputSx, '& .MuiInputBase-input': { py: 0.5, color: '#fff' } }} />
                            </TableCell>
                            <TableCell>
                              <TextField size="small" type="number" value={editForm.totalSeats}
                                onChange={e => setEditForm(p => ({ ...p, totalSeats: e.target.value }))}
                                sx={{ ...inputSx, width: 80, '& .MuiInputBase-input': { py: 0.5, color: '#fff' } }} />
                            </TableCell>
                            <TableCell>
                              <Select size="small" value={editForm.screenType}
                                onChange={e => setEditForm(p => ({ ...p, screenType: e.target.value }))}
                                sx={{ color: '#fff', fontSize: '0.85rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}>
                                {['REGULAR', 'PREMIUM', 'IMAX'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button size="small" variant="contained" onClick={() => handleUpdate(s.id)}
                                sx={{ mr: 1, background: 'linear-gradient(45deg, #56ab2f, #a8e063)', color: '#000', fontWeight: 700 }}>
                                Save
                              </Button>
                              <Button size="small" variant="text" onClick={() => setEditingScreen(null)}
                                sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                Cancel
                              </Button>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{s.screenName}</TableCell>
                            <TableCell>{s.totalSeats}</TableCell>
                            <TableCell>
                              <Chip label={s.screenType} size="small"
                                sx={{
                                  bgcolor: s.screenType === 'IMAX' ? 'rgba(78,205,196,0.2)' : s.screenType === 'PREMIUM' ? 'rgba(255,217,61,0.2)' : 'rgba(255,255,255,0.1)',
                                  color: s.screenType === 'IMAX' ? '#4ecdc4' : s.screenType === 'PREMIUM' ? '#ffd93d' : '#fff',
                                  fontSize: '0.7rem'
                                }} />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleEdit(s)} sx={{ color: '#ffd93d' }}><Edit fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => handleDelete(s.id)} sx={{ color: '#ff6b6b' }}><Delete fontSize="small" /></IconButton>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    {screens.length === 0 && selectedTheatreId && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', borderColor: 'rgba(255,255,255,0.08)', py: 3 }}>
                          No screens found for this theatre.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────
// TAB 3: Manage Shows
// ─────────────────────────────────────────────────────────
const ManageShowsTab = ({ token }) => {
  const api = useAuthAxios(token);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [shows, setShows] = useState([]);
  const [form, setForm] = useState({ movieId: '', screenId: '', showDate: '', showTime: '', pricePerSeat: '' });
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/movies').then(r => setMovies(r.data)).catch(console.error);
    api.get('/theatres').then(r => setTheatres(r.data)).catch(console.error);
  }, [api]);

  const fetchScreensByTheatre = async (theatreId) => {
    setSelectedTheatreId(theatreId);
    setForm(p => ({ ...p, screenId: '' }));
    if (!theatreId) return;
    try {
      const res = await axios.get(`/api/screens?theatreId=${theatreId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScreens(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchShows = useCallback(async () => {
    if (!form.movieId) return;
    try {
      const res = await axios.get(`/api/shows/movie/${form.movieId}`);
      setShows(res.data);
    } catch (e) { console.error(e); }
  }, [form.movieId]);

  useEffect(() => { fetchShows(); }, [fetchShows]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `/api/shows?movieId=${form.movieId}&screenId=${form.screenId}`,
        { showDate: form.showDate, showTime: form.showTime, pricePerSeat: Number(form.pricePerSeat) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg('Show created!');
      setError('');
      fetchShows();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create show');
      setMsg('');
    }
  };

  return (
    <Box>
      {msg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Box sx={darkCard}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3 }}>Create Show</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <FormControl fullWidth sx={{ mb: 1.5, ...inputSx }}>
                <InputLabel>Movie</InputLabel>
                <Select value={form.movieId} label="Movie"
                  onChange={e => setForm(p => ({ ...p, movieId: e.target.value }))}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }} required>
                  {movies.map(m => <MenuItem key={m.id} value={m.id}>{m.movieName}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 1.5, ...inputSx }}>
                <InputLabel>Theatre</InputLabel>
                <Select value={selectedTheatreId} label="Theatre"
                  onChange={e => fetchScreensByTheatre(e.target.value)}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}>
                  {theatres.map(t => <MenuItem key={t.id} value={t.id}>{t.theatreName}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 1.5, ...inputSx }}>
                <InputLabel>Screen</InputLabel>
                <Select value={form.screenId} label="Screen"
                  onChange={e => setForm(p => ({ ...p, screenId: e.target.value }))}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }} required>
                  {screens.map(s => <MenuItem key={s.id} value={s.id}>{s.screenName} ({s.screenType})</MenuItem>)}
                </Select>
              </FormControl>

              <TextField fullWidth margin="dense" label="Show Date" type="date" value={form.showDate}
                onChange={e => setForm(p => ({ ...p, showDate: e.target.value }))}
                InputLabelProps={{ shrink: true }} required sx={inputSx} />
              <TextField fullWidth margin="dense" label="Show Time" type="time" value={form.showTime}
                onChange={e => setForm(p => ({ ...p, showTime: e.target.value }))}
                InputLabelProps={{ shrink: true }} required sx={inputSx} />
              <TextField fullWidth margin="dense" label="Price Per Seat (₹)" type="number" value={form.pricePerSeat}
                onChange={e => setForm(p => ({ ...p, pricePerSeat: e.target.value }))} required sx={inputSx} />

              <Button fullWidth variant="contained" type="submit"
                sx={{ mt: 2, background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)', color: '#000', fontWeight: 700 }}>
                Create Show
              </Button>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ ...darkCard, p: 0, overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', p: 3, pb: 2 }}>
              Shows {form.movieId ? `for selected movie (${shows.length})` : '— Select a movie to view shows'}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '0.75rem' } }}>
                    <TableCell>MOVIE</TableCell>
                    <TableCell>SCREEN</TableCell>
                    <TableCell>DATE</TableCell>
                    <TableCell>TIME</TableCell>
                    <TableCell>PRICE</TableCell>
                    <TableCell>STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shows.map(s => (
                    <TableRow key={s.id} sx={{ '& td': { color: '#fff', borderColor: 'rgba(255,255,255,0.08)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                      <TableCell>{s.movie?.movieName}</TableCell>
                      <TableCell>{s.screen?.screenName}</TableCell>
                      <TableCell>{s.showDate}</TableCell>
                      <TableCell>{s.showTime?.substring(0, 5)}</TableCell>
                      <TableCell sx={{ color: '#4ecdc4', fontWeight: 700 }}>₹{s.pricePerSeat}</TableCell>
                      <TableCell>
                        <Chip label={s.status || 'ACTIVE'} size="small"
                          sx={{
                            bgcolor: s.status === 'CANCELLED' ? 'rgba(192,57,43,0.2)' : 'rgba(86,171,47,0.2)',
                            color: s.status === 'CANCELLED' ? '#c0392b' : '#56ab2f',
                            fontSize: '0.7rem'
                          }} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {shows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', borderColor: 'rgba(255,255,255,0.08)', py: 3 }}>
                        {form.movieId ? 'No shows found.' : 'Select a movie to see shows.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────
// TAB 4: Manage Bookings (Admin)
// ─────────────────────────────────────────────────────────
const ManageBookingsTab = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    axios.get('/api/bookings/admin', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => { setBookings(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);
  const totalRevenue = bookings.filter(b => b.status === 'CONFIRMED').reduce((s, b) => s + Number(b.totalAmount || 0), 0);

  return (
    <Box>
      {/* Stats row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Total Bookings', value: bookings.length, color: '#4ecdc4' },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'CONFIRMED').length, color: '#56ab2f' },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'CANCELLED').length, color: '#c0392b' },
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: '#ffd93d' },
        ].map(stat => (
          <Grid item xs={6} md={3} key={stat.label}>
            <Box sx={{ ...darkCard, textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight={900} sx={{ color: stat.color }}>{stat.value}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mt: 0.5 }}>{stat.label}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Filter */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        {['ALL', 'CONFIRMED', 'CANCELLED'].map(f => (
          <Chip key={f} label={f} onClick={() => setFilter(f)}
            sx={{
              cursor: 'pointer',
              bgcolor: filter === f ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.08)',
              color: filter === f ? '#ff6b6b' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${filter === f ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
              fontWeight: filter === f ? 700 : 400,
              '&:hover': { bgcolor: 'rgba(255,107,107,0.2)' }
            }} />
        ))}
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', alignSelf: 'center', ml: 1, fontSize: '0.85rem' }}>
          Showing {filtered.length} bookings
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#ff6b6b' }} /></Box>
      ) : (
        <Box sx={{ ...darkCard, p: 0, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '0.72rem' } }}>
                  <TableCell>BOOKING #</TableCell>
                  <TableCell>MOVIE</TableCell>
                  <TableCell>THEATRE</TableCell>
                  <TableCell>SCREEN</TableCell>
                  <TableCell>DATE</TableCell>
                  <TableCell>TIME</TableCell>
                  <TableCell>SEATS</TableCell>
                  <TableCell>AMOUNT</TableCell>
                  <TableCell>STATUS</TableCell>
                  <TableCell>CUSTOMER</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id} sx={{ '& td': { color: '#fff', borderColor: 'rgba(255,255,255,0.06)', fontSize: '0.8rem' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                    <TableCell sx={{ color: '#ffd93d', fontFamily: 'monospace', fontWeight: 700 }}>#{b.bookingNumber}</TableCell>
                    <TableCell>{b.movieName}</TableCell>
                    <TableCell>{b.theatreName}</TableCell>
                    <TableCell>{b.screenName}</TableCell>
                    <TableCell>{b.showDate}</TableCell>
                    <TableCell>{b.showTime?.substring(0, 5)}</TableCell>
                    <TableCell sx={{ maxWidth: 100 }}>{b.selectedSeats?.join(', ')}</TableCell>
                    <TableCell sx={{ color: '#4ecdc4', fontWeight: 700 }}>₹{b.totalAmount}</TableCell>
                    <TableCell>
                      <Chip label={b.status} size="small"
                        sx={{
                          bgcolor: b.status === 'CONFIRMED' ? 'rgba(86,171,47,0.2)' : 'rgba(192,57,43,0.2)',
                          color: b.status === 'CONFIRMED' ? '#56ab2f' : '#c0392b',
                          fontSize: '0.7rem'
                        }} />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 130 }}>{b.userEmail}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', py: 4, borderColor: 'rgba(255,255,255,0.08)' }}>
                      No bookings found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────
// TAB 5: Reports
// ─────────────────────────────────────────────────────────
const ReportsTab = ({ token }) => {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);
  const [reportData, setReportData] = useState(null);
  const [exportData, setExportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (!fromDate || !toDate) { setError('Please select both dates.'); return; }
    setLoading(true);
    setError('');
    try {
      const [reportRes, exportRes] = await Promise.all([
        axios.get(`/api/bookings/report?from=${fromDate}&to=${toDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/bookings/report/export?from=${fromDate}&to=${toDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setReportData(reportRes.data);
      setExportData(exportRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Booking#', 'Movie', 'Theatre', 'Screen', 'Date', 'Time', 'Seats', 'Amount', 'Status', 'Customer'];
    const rows = exportData.map(b => [
      b.bookingNumber, b.movieName, b.theatreName, b.screenName,
      b.showDate, b.showTime, b.selectedSeats?.join(' '), b.totalAmount, b.status, b.userEmail
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Booking Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Period: ${fromDate} to ${toDate}`, 14, 30);
    doc.text(`Total Bookings: ${reportData?.totalBookings || 0}  |  Revenue: Rs.${reportData?.totalRevenue || 0}  |  Cancelled: ${reportData?.cancelledBookings || 0}`, 14, 37);

    autoTable(doc, {
      startY: 45,
      head: [['Booking#', 'Movie', 'Theatre', 'Date', 'Seats', 'Amount', 'Status', 'Customer']],
      body: exportData.map(b => [
        b.bookingNumber, b.movieName, b.theatreName, b.showDate,
        b.selectedSeats?.join(' '), `Rs.${b.totalAmount}`, b.status, b.userEmail
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [78, 205, 196], textColor: [0, 0, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`booking-report-${fromDate}-to-${toDate}.pdf`);
  };

  return (
    <Box>
      {/* Date range picker */}
      <Box sx={{ ...darkCard, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 2 }}>
          <Assessment sx={{ mr: 1, verticalAlign: 'middle', color: '#4ecdc4' }} />
          Generate Report
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField label="From Date" type="date" value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ ...inputSx, width: 200 }} />
          <TextField label="To Date" type="date" value={toDate}
            onChange={e => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ ...inputSx, width: 200 }} />
          <Button variant="contained" onClick={generateReport} disabled={loading}
            sx={{ background: 'linear-gradient(45deg, #4ecdc4, #2980b9)', fontWeight: 700, px: 3, py: 1.5 }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Generate Report'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box>

      {reportData && (
        <>
          {/* Stats cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              { label: 'Total Bookings', value: reportData.totalBookings, color: '#4ecdc4', icon: '🎟' },
              { label: 'Total Revenue', value: `₹${Number(reportData.totalRevenue || 0).toLocaleString()}`, color: '#56ab2f', icon: '💰' },
              { label: 'Cancelled', value: reportData.cancelledBookings, color: '#c0392b', icon: '❌' },
              { label: 'Net Bookings', value: (reportData.totalBookings || 0) - (reportData.cancelledBookings || 0), color: '#ffd93d', icon: '✅' },
            ].map(s => (
              <Grid item xs={6} md={3} key={s.label}>
                <Box sx={{ ...darkCard, textAlign: 'center', p: 2.5 }}>
                  <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>{s.icon}</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: s.color }}>{s.value}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mt: 0.5 }}>{s.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Export buttons */}
          {exportData.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCSV}
                sx={{ borderColor: '#56ab2f', color: '#56ab2f', fontWeight: 700, '&:hover': { bgcolor: 'rgba(86,171,47,0.1)' } }}>
                Export CSV
              </Button>
              <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={exportPDF}
                sx={{ borderColor: '#ff6b6b', color: '#ff6b6b', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,107,107,0.1)' } }}>
                Export PDF
              </Button>
            </Box>
          )}

          {/* Daily bookings chart */}
          {reportData.dailyStats && reportData.dailyStats.length > 0 && (
            <Box sx={{ ...darkCard, mb: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3 }}>
                📈 Daily Booking Trend
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={reportData.dailyStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff' }}
                    labelStyle={{ color: '#ffd93d', fontWeight: 700 }}
                  />
                  <Bar dataKey="bookings" fill="#4ecdc4" radius={[4, 4, 0, 0]}>
                    {reportData.dailyStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4ecdc4' : '#45b7d1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Movie stats chart */}
          {reportData.movieStats && reportData.movieStats.length > 0 && (
            <Box sx={{ ...darkCard }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3 }}>
                🎬 Bookings by Movie
              </Typography>
              <ResponsiveContainer width="100%" height={Math.max(200, reportData.movieStats.length * 45)}>
                <BarChart
                  data={reportData.movieStats}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="movie" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff' }}
                    labelStyle={{ color: '#ffd93d', fontWeight: 700 }}
                  />
                  <Bar dataKey="bookings" fill="#ff6b6b" radius={[0, 4, 4, 0]}>
                    {reportData.movieStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#ff6b6b', '#ffd93d', '#4ecdc4', '#a8e063', '#ff9ff3'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────
// TAB 6: Approve Admins (SUPER_ADMIN)
// ─────────────────────────────────────────────────────────
const ApproveAdminsTab = ({ token }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get('/api/admin/pending', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => { setPendingUsers(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const approve = async (userId) => {
    try {
      await axios.put(`/api/admin/approve/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Admin approved!');
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to approve');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#ff6b6b' }} /></Box>;

  return (
    <Box>
      {msg && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}
      <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3 }}>
        Pending Admin Approvals ({pendingUsers.length})
      </Typography>
      {pendingUsers.length === 0 ? (
        <Box sx={{ ...darkCard, textAlign: 'center', py: 6 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>No pending approvals.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {pendingUsers.map(u => (
            <Grid item xs={12} md={6} key={u.id}>
              <Box sx={{ ...darkCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 700 }}>{u.username || u.email}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{u.email}</Typography>
                </Box>
                <Button variant="contained" onClick={() => approve(u.id)}
                  sx={{ background: 'linear-gradient(45deg, #56ab2f, #a8e063)', color: '#000', fontWeight: 700 }}>
                  Approve
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN AdminDashboard
// ─────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { token, roles } = useSelector((state) => state.auth);
  const isSuperAdmin = roles?.includes('ROLE_SUPER_ADMIN');
  const isTheatreAdmin = roles?.includes('ROLE_THEATRE_ADMIN');

  // Build tab config based on roles
  const tabs = [
    { label: 'Movies', icon: <Movie />, show: isTheatreAdmin || isSuperAdmin, component: <ManageMoviesTab token={token} /> },
    { label: 'Theatres', icon: <Business />, show: isTheatreAdmin || isSuperAdmin, component: <ManageTheatresTab token={token} /> },
    { label: 'Screens', icon: <Theaters />, show: isTheatreAdmin || isSuperAdmin, component: <ManageScreensTab token={token} /> },
    { label: 'Shows', icon: <EventSeat />, show: isTheatreAdmin || isSuperAdmin, component: <ManageShowsTab token={token} /> },
    { label: 'Bookings', icon: <BookOnline />, show: isTheatreAdmin || isSuperAdmin, component: <ManageBookingsTab token={token} /> },
    { label: 'Reports', icon: <Assessment />, show: isTheatreAdmin || isSuperAdmin, component: <ReportsTab token={token} /> },
    { label: 'Approve Admins', icon: <AdminPanelSettings />, show: isSuperAdmin, component: <ApproveAdminsTab token={token} /> },
  ].filter(t => t.show);

  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)', py: 4 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" fontWeight="900" sx={{
          color: '#fff', mb: 4,
          background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          ⚙️ Admin Dashboard
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.12)', mb: 4 }}>
          <Tabs
            value={tabIndex}
            onChange={(e, v) => setTabIndex(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 600, minHeight: 56 },
              '& .Mui-selected': { color: '#ff6b6b !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#ff6b6b', height: 3 },
            }}
          >
            {tabs.map((tab, idx) => (
              <Tab key={tab.label} label={tab.label} value={idx}
                icon={React.cloneElement(tab.icon, { sx: { fontSize: 18 } })}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {tabs[tabIndex]?.component}
      </Container>
    </Box>
  );
};

export default AdminDashboard;
