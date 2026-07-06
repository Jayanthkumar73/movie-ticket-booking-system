import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Tabs, Tab, Button, TextField, Paper,
  Grid, Select, MenuItem, FormControl, InputLabel, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  FormControlLabel, Checkbox
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
import { NOIR } from '../theme';

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
  bgcolor: NOIR.surface,
  border: `1px solid ${NOIR.border}`,
  borderRadius: 4,
  p: 3,
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: NOIR.text,
    '& fieldset': { borderColor: NOIR.border },
    '&:hover fieldset': { borderColor: NOIR.borderStrong },
    '&.Mui-focused fieldset': { borderColor: NOIR.amber },
  },
  '& .MuiInputLabel-root': { color: NOIR.textDim },
  '& .MuiSelect-icon': { color: NOIR.textDim },
  '& .MuiInputBase-input': { color: NOIR.text },
};

// ─────────────────────────────────────────────────────────
// TAB 0: Manage Movies
// ─────────────────────────────────────────────────────────
const ManageMoviesTab = ({ token }) => {
  const api = useAuthAxios(token);
  const [movies, setMovies] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // OMDb search + import state
  const [omdbQuery, setOmdbQuery] = useState('');
  const [omdbResults, setOmdbResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState('');
  const [searched, setSearched] = useState(false);

  // Edit dialog state
  const [editingMovie, setEditingMovie] = useState(null); // full movie being edited (null = closed)
  const [editForm, setEditForm] = useState({});
  const [editFile, setEditFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMovies = useCallback(async () => {
    const res = await axios.get('/api/movies');
    setMovies(res.data);
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  const handleOmdbSearch = async (e) => {
    e.preventDefault();
    if (omdbQuery.trim().length < 2) { setError('Type at least 2 characters to search.'); return; }
    setSearching(true);
    setError('');
    setMsg('');
    try {
      const res = await api.get(`/movies/omdb/search?query=${encodeURIComponent(omdbQuery.trim())}`);
      setOmdbResults(res.data);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'OMDb search failed.');
      setOmdbResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (imdbId) => {
    setImportingId(imdbId);
    setError('');
    setMsg('');
    try {
      const res = await api.post(`/movies/omdb/import?imdbId=${imdbId}`);
      setMsg(`Imported "${res.data.movieName}"! You can now schedule it in the Shows tab.`);
      // Mark this result as imported so the button flips to "Added".
      setOmdbResults(prev => prev.map(r => r.imdbId === imdbId ? { ...r, alreadyImported: true } : r));
      fetchMovies();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed.');
    } finally {
      setImportingId('');
    }
  };

  const openEdit = (m) => {
    setEditForm({
      movieName: m.movieName || '',
      language: m.language || '',
      genre: m.genre || '',
      duration: m.duration ?? '',
      releaseDate: m.releaseDate || '',
      description: m.description || '',
      trailerUrl: m.trailerUrl || '', // preserved so update doesn't wipe it
    });
    setEditFile(null);
    setEditingMovie(m);
  };

  const handleUpdate = async () => {
    setSavingEdit(true);
    setError('');
    setMsg('');
    try {
      const movieData = {
        movieName: editForm.movieName,
        language: editForm.language,
        genre: editForm.genre,
        duration: Number(editForm.duration),
        releaseDate: editForm.releaseDate,
        description: editForm.description,
        trailerUrl: editForm.trailerUrl,
      };
      const payload = new FormData();
      payload.append('movie', new Blob([JSON.stringify(movieData)], { type: 'application/json' }));
      if (editFile && editFile.size > 0) payload.append('file', editFile);
      await api.put(`/movies/${editingMovie.id}`, payload);
      setMsg('Movie updated!');
      setEditingMovie(null);
      fetchMovies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update movie.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete "${m.movieName}"? This cannot be undone.`)) return;
    setError('');
    setMsg('');
    try {
      await api.delete(`/movies/${m.id}`);
      setMsg('Movie deleted!');
      fetchMovies();
    } catch (err) {
      setError(
        err.response?.status === 500
          ? 'Cannot delete — this movie may still have shows scheduled. Remove its shows first.'
          : (err.response?.data?.message || 'Failed to delete movie.')
      );
    }
  };

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
    <>
    <Grid container spacing={4}>
      {/* ── OMDb import panel ───────────────────────────── */}
      <Grid xs={12}>
        <Box sx={darkCard}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileDownload sx={{ color: '#4ecdc4' }} /> Search & Import from OMDb
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', mb: 2 }}>
            Type a movie name, then import it in one click — details & poster fill in automatically.
          </Typography>
          <Box component="form" onSubmit={handleOmdbSearch} sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField fullWidth size="small" label="Movie name (e.g. Inception)" value={omdbQuery}
              onChange={e => setOmdbQuery(e.target.value)} sx={inputSx} />
            <Button variant="contained" type="submit" disabled={searching}
              sx={{ minWidth: 120, background: 'linear-gradient(45deg, #4ecdc4, #2980b9)', fontWeight: 700 }}>
              {searching ? <CircularProgress size={20} color="inherit" /> : 'Search'}
            </Button>
          </Box>

          {searched && omdbResults.length === 0 && !searching && (
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              No movies found. Try a different title.
            </Typography>
          )}

          <Grid container spacing={2}>
            {omdbResults.map(r => (
              <Grid xs={6} sm={4} md={3} lg={2} key={r.imdbId}>
                <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.2)' }}>
                  <Box sx={{ height: 220, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {r.poster
                      ? <img src={r.poster} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Movie sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)' }} />}
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2, mb: 0.3 }} noWrap title={r.title}>
                      {r.title}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1 }}>{r.year}</Typography>
                    <Button fullWidth size="small" variant={r.alreadyImported ? 'outlined' : 'contained'}
                      disabled={r.alreadyImported || importingId === r.imdbId}
                      onClick={() => handleImport(r.imdbId)}
                      sx={r.alreadyImported
                        ? { borderColor: '#56ab2f', color: '#56ab2f', fontSize: '0.72rem' }
                        : { background: 'linear-gradient(135deg, #E5B769 0%, #C9922F 100%)', color: '#000', fontWeight: 700, fontSize: '0.72rem' }}>
                      {importingId === r.imdbId ? 'Importing…' : r.alreadyImported ? '✓ Added' : 'Import'}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Grid>

      <Grid xs={12} md={5}>
        <Box sx={darkCard}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Add sx={{ color: '#E5B769' }} /> Add New Movie <Typography component="span" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 400 }}>(manual)</Typography>
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
              sx={{ mt: 2, background: 'linear-gradient(135deg, #E5B769 0%, #C9922F 100%)', color: '#000', fontWeight: 700 }}>
              Add Movie
            </Button>
          </Box>
        </Box>
      </Grid>
      <Grid xs={12} md={7}>
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
                  <TableCell>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movies.map(m => (
                  <TableRow key={m.id} sx={{ '& td': { color: '#fff', borderColor: 'rgba(255,255,255,0.08)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                    <TableCell fontWeight={700}>{m.movieName}</TableCell>
                    <TableCell><Chip label={m.language} size="small" sx={{ bgcolor: 'rgba(255,107,107,0.2)', color: '#E5B769', fontSize: '0.7rem' }} /></TableCell>
                    <TableCell>{m.genre}</TableCell>
                    <TableCell>{m.duration}m</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEdit(m)} sx={{ color: '#F5C518' }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(m)} sx={{ color: '#E5B769' }}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {movies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', borderColor: 'rgba(255,255,255,0.08)', py: 3 }}>
                      No movies yet. Import from OMDb or add one manually.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Grid>
    </Grid>

    {/* ── Edit movie dialog ───────────────────────────── */}
    <Dialog open={Boolean(editingMovie)} onClose={() => setEditingMovie(null)} fullWidth maxWidth="sm"
      PaperProps={{ sx: { bgcolor: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Movie</DialogTitle>
      <DialogContent>
        <TextField fullWidth margin="dense" label="Movie Name" value={editForm.movieName || ''}
          onChange={e => setEditForm(p => ({ ...p, movieName: e.target.value }))} sx={inputSx} />
        <TextField fullWidth margin="dense" label="Language" value={editForm.language || ''}
          onChange={e => setEditForm(p => ({ ...p, language: e.target.value }))} sx={inputSx} />
        <TextField fullWidth margin="dense" label="Genre" value={editForm.genre || ''}
          onChange={e => setEditForm(p => ({ ...p, genre: e.target.value }))} sx={inputSx} />
        <TextField fullWidth margin="dense" label="Duration (mins)" type="number" value={editForm.duration ?? ''}
          onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))} sx={inputSx} />
        <TextField fullWidth margin="dense" label="Release Date" type="date" value={editForm.releaseDate || ''}
          onChange={e => setEditForm(p => ({ ...p, releaseDate: e.target.value }))}
          InputLabelProps={{ shrink: true }} sx={inputSx} />
        <TextField fullWidth margin="dense" label="Description" multiline rows={3} value={editForm.description || ''}
          onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} sx={inputSx} />
        <TextField fullWidth margin="dense" label="Trailer URL" value={editForm.trailerUrl || ''}
          onChange={e => setEditForm(p => ({ ...p, trailerUrl: e.target.value }))} sx={inputSx} />
        <Button variant="outlined" component="label" sx={{ mt: 2, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
          Replace Poster
          <input type="file" hidden accept="image/*" onChange={e => setEditFile(e.target.files?.[0] || null)} />
        </Button>
        {editFile && <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mt: 1 }}>{editFile.name}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setEditingMovie(null)} sx={{ color: 'rgba(255,255,255,0.6)' }}>Cancel</Button>
        <Button onClick={handleUpdate} variant="contained" disabled={savingEdit}
          sx={{ background: 'linear-gradient(45deg, #56ab2f, #a8e063)', color: '#000', fontWeight: 700 }}>
          {savingEdit ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
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
      <Grid xs={12} md={5}>
        <Box sx={darkCard}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3 }}><Add sx={{ color: '#E5B769', mr: 1 }} />Add Theatre</Typography>
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
            <Button variant="contained" type="submit" disabled={submitting} sx={{ mt: 2, background: 'linear-gradient(135deg, #E5B769 0%, #C9922F 100%)', color: '#000', fontWeight: 700 }}>
              {submitting ? 'Adding…' : 'Add Theatre'}
            </Button>
          </Box>
        </Box>
      </Grid>
      <Grid xs={12} md={7}>
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
  const { theatreId } = useSelector((state) => state.auth);
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState(theatreId || '');
  const [screens, setScreens] = useState([]);
  const [form, setForm] = useState({ screenName: '', totalSeats: '', screenType: 'REGULAR', categories: [] });
  const [editingScreen, setEditingScreen] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchScreens = useCallback(async (tId) => {
    if (!tId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/screens?theatreId=${tId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScreens(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (theatreId) {
      setSelectedTheatreId(theatreId);
      fetchScreens(theatreId);
    } else {
      api.get('/theatres').then(res => setTheatres(res.data)).catch(console.error);
    }
  }, [api, theatreId, fetchScreens]);

  const handleTheatreChange = (e) => {
    setSelectedTheatreId(e.target.value);
    fetchScreens(e.target.value);
  };

  // ── Seat-category editor helpers (optional price tiers per screen) ──
  const addCategory = () => setForm(p => ({
    ...p,
    categories: [...p.categories, { name: '', price: '', numRows: '', seatsPerRow: '', bestseller: false }],
  }));
  const updateCategory = (idx, field, value) => setForm(p => ({
    ...p,
    categories: p.categories.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
  }));
  const removeCategory = (idx) => setForm(p => ({
    ...p,
    categories: p.categories.filter((_, i) => i !== idx),
  }));

  // Rows sum across categories, capped at 26 (single-letter rows A–Z).
  const categoryRowTotal = form.categories.reduce((n, c) => n + (Number(c.numRows) || 0), 0);
  const categorySeatTotal = form.categories.reduce((n, c) => n + (Number(c.numRows) || 0) * (Number(c.seatsPerRow) || 0), 0);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedTheatreId) { setError('Please select a theatre first.'); return; }
    const useCategories = form.categories.length > 0;
    if (useCategories && categoryRowTotal > 26) {
      setError('Total rows across categories cannot exceed 26 (rows A–Z).');
      return;
    }
    try {
      const payload = useCategories
        ? {
            screenName: form.screenName,
            screenType: form.screenType,
            categories: form.categories.map((c, i) => ({
              name: c.name,
              price: Number(c.price),
              numRows: Number(c.numRows),
              seatsPerRow: Number(c.seatsPerRow),
              displayOrder: i,
              bestseller: c.bestseller,
            })),
          }
        : { screenName: form.screenName, totalSeats: Number(form.totalSeats), screenType: form.screenType };

      await axios.post(`/api/screens?theatreId=${selectedTheatreId}`, payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg('Screen added!');
      setError('');
      setForm({ screenName: '', totalSeats: '', screenType: 'REGULAR', categories: [] });
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
      // Preserve existing seat categories on edit so this inline form doesn't wipe the price tiers.
      const existing = screens.find(s => s.id === screenId);
      const cats = existing?.seatCategories || [];
      const payload = cats.length > 0
        ? {
            screenName: editForm.screenName,
            screenType: editForm.screenType,
            categories: cats.map(c => ({
              name: c.name, price: Number(c.price), numRows: c.numRows,
              seatsPerRow: c.seatsPerRow, displayOrder: c.displayOrder, bestseller: c.bestseller,
            })),
          }
        : { screenName: editForm.screenName, totalSeats: Number(editForm.totalSeats), screenType: editForm.screenType };
      await axios.put(`/api/screens/${screenId}`, payload,
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
        <Grid xs={12} md={4}>
          <Box sx={darkCard}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 3 }}>Add Screen</Typography>

            {!theatreId && (
              <FormControl fullWidth sx={{ mb: 2, ...inputSx }}>
                <InputLabel>Select Theatre</InputLabel>
                <Select value={selectedTheatreId} label="Select Theatre" onChange={handleTheatreChange}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}>
                  {theatres.map(t => <MenuItem key={t.id} value={t.id}>{t.theatreName}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            <Box component="form" onSubmit={handleAdd}>
              <TextField fullWidth margin="dense" label="Screen Name" value={form.screenName}
                onChange={e => setForm(p => ({ ...p, screenName: e.target.value }))} required sx={inputSx} />
              <TextField fullWidth margin="dense"
                label={form.categories.length > 0 ? `Total Seats (auto: ${categorySeatTotal})` : 'Total Seats'}
                type="number" value={form.categories.length > 0 ? categorySeatTotal : form.totalSeats}
                onChange={e => setForm(p => ({ ...p, totalSeats: e.target.value }))}
                required={form.categories.length === 0} disabled={form.categories.length > 0} sx={inputSx} />
              <FormControl fullWidth sx={{ mt: 1, mb: 1, ...inputSx }}>
                <InputLabel>Screen Type</InputLabel>
                <Select value={form.screenType} label="Screen Type"
                  onChange={e => setForm(p => ({ ...p, screenType: e.target.value }))}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}>
                  {['REGULAR', 'PREMIUM', 'IMAX'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>

              {/* Optional price tiers (BookMyShow-style seat categories) */}
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, fontSize: '0.85rem' }}>
                    Seat Categories (optional)
                  </Typography>
                  <Button size="small" onClick={addCategory} sx={{ color: '#E5B769', fontWeight: 700, minWidth: 0 }}>
                    + Add
                  </Button>
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', mb: 1.5 }}>
                  Add tiers (e.g. CLASSIC ₹160, EXECUTIVE ₹190). First tier sits nearest the screen. Leave empty for a single-price screen.
                </Typography>

                {form.categories.map((c, idx) => (
                  <Box key={idx} sx={{ p: 1.5, mb: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.12)', bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700 }}>
                        Tier {idx + 1}
                      </Typography>
                      <Button size="small" onClick={() => removeCategory(idx)} sx={{ color: '#E5484D', minWidth: 0, fontSize: '0.7rem' }}>
                        Remove
                      </Button>
                    </Box>
                    <TextField fullWidth margin="dense" size="small" label="Name (e.g. CLASSIC)" value={c.name}
                      onChange={e => updateCategory(idx, 'name', e.target.value)} required sx={inputSx} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField margin="dense" size="small" label="Price ₹" type="number" value={c.price}
                        onChange={e => updateCategory(idx, 'price', e.target.value)} required sx={inputSx} />
                      <TextField margin="dense" size="small" label="Rows" type="number" value={c.numRows}
                        onChange={e => updateCategory(idx, 'numRows', e.target.value)} required sx={inputSx} />
                      <TextField margin="dense" size="small" label="Seats/Row" type="number" value={c.seatsPerRow}
                        onChange={e => updateCategory(idx, 'seatsPerRow', e.target.value)} required sx={inputSx} />
                    </Box>
                    <FormControlLabel
                      control={<Checkbox checked={c.bestseller} onChange={e => updateCategory(idx, 'bestseller', e.target.checked)}
                        sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: '#E5B769' } }} />}
                      label={<Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>Mark as Bestseller</Typography>}
                    />
                  </Box>
                ))}
                {categoryRowTotal > 26 && (
                  <Typography sx={{ color: '#E5484D', fontSize: '0.72rem', mb: 1 }}>
                    Total rows ({categoryRowTotal}) exceed 26 (A–Z). Reduce rows.
                  </Typography>
                )}
              </Box>

              <Button fullWidth variant="contained" type="submit"
                sx={{ mt: 2, background: 'linear-gradient(135deg, #E5B769 0%, #C9922F 100%)', color: '#000', fontWeight: 700 }}>
                Add Screen
              </Button>
            </Box>
          </Box>
        </Grid>

        <Grid xs={12} md={8}>
          <Box sx={{ ...darkCard, p: 0, overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', p: 3, pb: 2 }}>
              Screens {selectedTheatreId ? `(${screens.length})` : '— Select a theatre'}
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#E5B769' }} /></Box>
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
                                  color: s.screenType === 'IMAX' ? '#4ecdc4' : s.screenType === 'PREMIUM' ? '#F5C518' : '#fff',
                                  fontSize: '0.7rem'
                                }} />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleEdit(s)} sx={{ color: '#F5C518' }}><Edit fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => handleDelete(s.id)} sx={{ color: '#E5B769' }}><Delete fontSize="small" /></IconButton>
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
  const { theatreId } = useSelector((state) => state.auth);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [shows, setShows] = useState([]);
  const [form, setForm] = useState({ movieId: '', screenId: '', showDate: '', showTime: '', pricePerSeat: '' });
  const [selectedTheatreId, setSelectedTheatreId] = useState(theatreId || '');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchScreensByTheatre = useCallback(async (tId) => {
    setSelectedTheatreId(tId);
    setForm(p => ({ ...p, screenId: '' }));
    if (!tId) return;
    try {
      const res = await axios.get(`/api/screens?theatreId=${tId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScreens(res.data);
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => {
    axios.get('/api/movies').then(r => setMovies(r.data)).catch(console.error);
    if (theatreId) {
      fetchScreensByTheatre(theatreId);
    } else {
      api.get('/theatres').then(r => setTheatres(r.data)).catch(console.error);
    }
  }, [api, theatreId, fetchScreensByTheatre]);

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
        <Grid xs={12} md={4}>
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

              {!theatreId && (
                <FormControl fullWidth sx={{ mb: 1.5, ...inputSx }}>
                  <InputLabel>Theatre</InputLabel>
                  <Select value={selectedTheatreId} label="Theatre"
                    onChange={e => fetchScreensByTheatre(e.target.value)}
                    sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}>
                    {theatres.map(t => <MenuItem key={t.id} value={t.id}>{t.theatreName}</MenuItem>)}
                  </Select>
                </FormControl>
              )}

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
                required
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  ...inputSx,
                  '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(0.7)', cursor: 'pointer' },
                  '& input[type="date"]': { colorScheme: 'dark' },
                }} />
              <TextField fullWidth margin="dense" label="Show Time" type="time" value={form.showTime}
                onChange={e => setForm(p => ({ ...p, showTime: e.target.value }))}
                required
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  ...inputSx,
                  '& input[type="time"]::-webkit-calendar-picker-indicator': { filter: 'invert(0.7)', cursor: 'pointer' },
                  '& input[type="time"]': { colorScheme: 'dark' },
                }} />
              <TextField fullWidth margin="dense" label="Price Per Seat (₹)" type="number" value={form.pricePerSeat}
                onChange={e => setForm(p => ({ ...p, pricePerSeat: e.target.value }))} required sx={inputSx} />

              <Button fullWidth variant="contained" type="submit"
                sx={{ mt: 2, background: 'linear-gradient(135deg, #E5B769 0%, #C9922F 100%)', color: '#000', fontWeight: 700 }}>
                Create Show
              </Button>
            </Box>
          </Box>
        </Grid>

        <Grid xs={12} md={8}>
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
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: '#F5C518' },
        ].map(stat => (
          <Grid xs={6} md={3} key={stat.label}>
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
              color: filter === f ? '#E5B769' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${filter === f ? '#E5B769' : 'rgba(255,255,255,0.1)'}`,
              fontWeight: filter === f ? 700 : 400,
              '&:hover': { bgcolor: 'rgba(255,107,107,0.2)' }
            }} />
        ))}
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', alignSelf: 'center', ml: 1, fontSize: '0.85rem' }}>
          Showing {filtered.length} bookings
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#E5B769' }} /></Box>
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
                    <TableCell sx={{ color: '#F5C518', fontFamily: 'monospace', fontWeight: 700 }}>#{b.bookingNumber}</TableCell>
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
              { label: 'Net Bookings', value: (reportData.totalBookings || 0) - (reportData.cancelledBookings || 0), color: '#F5C518', icon: '✅' },
            ].map(s => (
              <Grid xs={6} md={3} key={s.label}>
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
                sx={{ borderColor: '#E5B769', color: '#E5B769', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,107,107,0.1)' } }}>
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
                    labelStyle={{ color: '#F5C518', fontWeight: 700 }}
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
                    labelStyle={{ color: '#F5C518', fontWeight: 700 }}
                  />
                  <Bar dataKey="bookings" fill="#E5B769" radius={[0, 4, 4, 0]}>
                    {reportData.movieStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#E5B769', '#F5C518', '#4ecdc4', '#a8e063', '#ff9ff3'][index % 5]} />
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
// TAB: Approve Admins (SUPER_ADMIN only) — with Reject + History
// ─────────────────────────────────────────────────────────
const ApproveAdminsTab = ({ token }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [filter, setFilter] = useState('PENDING');

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const approve = async (userId) => {
    try {
      await axios.put(`/api/admin/approve/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Admin approved! They can now login to the Theatre Admin dashboard.');
      setMsgType('success');
      fetchAdmins();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to approve');
      setMsgType('error');
    }
  };

  const reject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this admin? They will not be able to login.')) return;
    try {
      await axios.put(`/api/admin/reject/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Admin rejected. They cannot login until re-approved.');
      setMsgType('warning');
      fetchAdmins();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to reject');
      setMsgType('error');
    }
  };

  const statusColor = (status) => {
    if (status === 'APPROVED') return { bg: 'rgba(86,171,47,0.18)', text: '#56ab2f', border: 'rgba(86,171,47,0.4)' };
    if (status === 'REJECTED') return { bg: 'rgba(192,57,43,0.18)', text: '#e74c3c', border: 'rgba(192,57,43,0.4)' };
    return { bg: 'rgba(229,183,105,0.18)', text: '#E5B769', border: 'rgba(229,183,105,0.4)' };
  };

  const filtered = filter === 'ALL' ? admins : admins.filter(u => u.status === filter);
  const counts = {
    ALL: admins.length,
    PENDING: admins.filter(u => u.status === 'PENDING').length,
    APPROVED: admins.filter(u => u.status === 'APPROVED').length,
    REJECTED: admins.filter(u => u.status === 'REJECTED').length,
  };

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#E5B769' }} /></Box>;

  return (
    <Box>
      {msg && (
        <Alert severity={msgType} sx={{ mb: 3 }} onClose={() => setMsg('')}>
          {msg}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>
          Theatre Admin Management
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          Total: {admins.length} admins registered
        </Typography>
      </Box>

      {/* Status filter tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
          <Chip key={f} label={`${f} (${counts[f]})`} onClick={() => setFilter(f)}
            sx={{
              cursor: 'pointer',
              bgcolor: filter === f ? statusColor(f === 'ALL' ? 'PENDING' : f).bg : 'rgba(255,255,255,0.06)',
              color: filter === f ? statusColor(f === 'ALL' ? 'PENDING' : f).text : 'rgba(255,255,255,0.5)',
              border: `1px solid ${filter === f ? statusColor(f === 'ALL' ? 'PENDING' : f).border : 'rgba(255,255,255,0.1)'}`,
              fontWeight: filter === f ? 700 : 400,
            }}
          />
        ))}
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ ...darkCard, textAlign: 'center', py: 8 }}>
          <AdminPanelSettings sx={{ fontSize: 56, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
            {filter === 'PENDING' ? 'No pending approvals. All caught up! 🎉' : `No ${filter.toLowerCase()} admins.`}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(u => {
            const sc = statusColor(u.status);
            return (
              <Grid xs={12} md={6} key={u.id}>
                <Box sx={{
                  ...darkCard,
                  border: `1px solid ${sc.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2,
                  flexWrap: 'wrap'
                }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                        {u.name}
                      </Typography>
                      <Chip label={u.status} size="small"
                        sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                      />
                    </Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      {u.email}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    {u.status === 'PENDING' && (
                      <>
                        <Button variant="contained" size="small" onClick={() => approve(u.id)}
                          sx={{ background: 'linear-gradient(45deg, #56ab2f, #a8e063)', color: '#000', fontWeight: 700, minWidth: 90 }}>
                          ✓ Approve
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => reject(u.id)}
                          sx={{ borderColor: '#e74c3c', color: '#e74c3c', fontWeight: 700, minWidth: 80, '&:hover': { bgcolor: 'rgba(231,76,60,0.1)' } }}>
                          ✕ Reject
                        </Button>
                      </>
                    )}
                    {u.status === 'APPROVED' && (
                      <Button variant="outlined" size="small" onClick={() => reject(u.id)}
                        sx={{ borderColor: '#e74c3c', color: '#e74c3c', fontWeight: 700, '&:hover': { bgcolor: 'rgba(231,76,60,0.1)' } }}>
                        Revoke Access
                      </Button>
                    )}
                    {u.status === 'REJECTED' && (
                      <Button variant="outlined" size="small" onClick={() => approve(u.id)}
                        sx={{ borderColor: '#56ab2f', color: '#56ab2f', fontWeight: 700, '&:hover': { bgcolor: 'rgba(86,171,47,0.1)' } }}>
                        Re-Approve
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN AdminDashboard — role-separated tabs
// ─────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { token, roles } = useSelector((state) => state.auth);
  const isSuperAdmin = roles?.includes('ROLE_SUPER_ADMIN');
  const isTheatreAdmin = roles?.includes('ROLE_THEATRE_ADMIN');

  // Super Admin sees: Bookings, Reports, Approve Admins
  // Theatre Admin sees: Movies, Screens, Shows, Bookings, Reports (NO Theatres tab)
  const tabs = isSuperAdmin ? [
    { label: 'Bookings', icon: <BookOnline />, component: <ManageBookingsTab token={token} /> },
    { label: 'Reports', icon: <Assessment />, component: <ReportsTab token={token} /> },
    { label: 'Approve Admins', icon: <AdminPanelSettings />, component: <ApproveAdminsTab token={token} /> },
  ] : isTheatreAdmin ? [
    { label: 'Movies', icon: <Movie />, component: <ManageMoviesTab token={token} /> },
    { label: 'Screens', icon: <Theaters />, component: <ManageScreensTab token={token} /> },
    { label: 'Shows', icon: <EventSeat />, component: <ManageShowsTab token={token} /> },
    { label: 'Bookings', icon: <BookOnline />, component: <ManageBookingsTab token={token} /> },
    { label: 'Reports', icon: <Assessment />, component: <ReportsTab token={token} /> },
  ] : [];

  const [tabIndex, setTabIndex] = useState(0);
  const [theatreName, setTheatreName] = useState('');

  // Fetch theatre name for theatre admins
  const { theatreId } = useSelector((state) => state.auth);
  useEffect(() => {
    if (isTheatreAdmin && theatreId) {
      axios.get(`/api/theatres/${theatreId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setTheatreName(res.data.theatreName || '')).catch(() => {});
    }
  }, [isTheatreAdmin, theatreId, token]);

  const dashboardTitle = isSuperAdmin ? '👑 Super Admin Dashboard' : '⚙️ Theatre Admin Dashboard';

  return (
    <Box sx={{ minHeight: '100vh', background: 'radial-gradient(1200px 620px at 50% -12%, rgba(229,183,105,0.10), transparent 60%), #0a0a0b', py: 4 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" fontWeight="900" sx={{
          color: '#fff', mb: 4,
          background: 'linear-gradient(135deg, #E5B769 0%, #C9922F 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {dashboardTitle}
        </Typography>

        {/* Theatre Admin: show their assigned theatre as a prominent banner */}
        {isTheatreAdmin && theatreName && (
          <Box sx={{
            mb: 3, px: 3, py: 2,
            background: 'linear-gradient(135deg, rgba(229,183,105,0.12) 0%, rgba(201,146,47,0.08) 100%)',
            border: '1px solid rgba(229,183,105,0.35)',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}>
            <Business sx={{ color: '#E5B769', fontSize: 22 }} />
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Your Assigned Theatre
              </Typography>
              <Typography sx={{ color: '#E5B769', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.02em' }}>
                {theatreName}
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.12)', mb: 4 }}>
          <Tabs
            value={tabIndex}
            onChange={(e, v) => setTabIndex(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 600, minHeight: 56 },
              '& .Mui-selected': { color: '#E5B769 !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#E5B769', height: 3 },
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

