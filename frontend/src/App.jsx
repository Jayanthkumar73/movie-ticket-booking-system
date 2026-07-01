import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import Navbar from './components/Navbar';
import { NOIR } from './theme';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MovieListPage from './pages/MovieListPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ShowsPage from './pages/ShowsPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import BookingConfirmPage from './pages/BookingConfirmPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import BookingHistoryPage from './pages/BookingHistoryPage';

function App() {
  return (
    <Router>
      <Box sx={{ minHeight: '100vh', bgcolor: NOIR.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Box sx={{ flex: 1 }}>
      <Routes>
        <Route path="/" element={<MovieListPage />} />
        <Route path="/movies" element={<MovieListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_THEATRE_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/movies/:id/shows" element={<ShowsPage />} />
        <Route path="/shows/:id/seats" element={<SeatSelectionPage />} />
        <Route path="/booking/confirm" element={
          <ProtectedRoute allowedRoles={['ROLE_CUSTOMER', 'ROLE_THEATRE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <BookingConfirmPage />
          </ProtectedRoute>
        } />
        <Route path="/booking/success" element={<BookingSuccessPage />} />
        <Route path="/bookings" element={
          <ProtectedRoute allowedRoles={['ROLE_CUSTOMER', 'ROLE_THEATRE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <BookingHistoryPage />
          </ProtectedRoute>
        } />
      </Routes>
      </Box>
      <Box component="footer" sx={{
        borderTop: `1px solid ${NOIR.border}`,
        py: 3, px: 2, textAlign: 'center',
        bgcolor: NOIR.bgElev,
      }}>
        <Typography sx={{ fontFamily: '"Fraunces", serif', color: NOIR.text, fontWeight: 600, letterSpacing: '0.02em' }}>
          AURORA<Box component="span" sx={{ color: NOIR.amber }}>.</Box>CINEMA
        </Typography>
        <Typography sx={{ color: NOIR.textFaint, fontSize: '0.8rem', mt: 0.5 }}>
          Where every seat tells a story · © {new Date().getFullYear()}
        </Typography>
      </Box>
      </Box>
    </Router>
  );
}

export default App;
