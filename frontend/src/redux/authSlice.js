import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  user: (localStorage.getItem('user') && localStorage.getItem('user') !== 'undefined') ? JSON.parse(localStorage.getItem('user')) : null,
  roles: (localStorage.getItem('roles') && localStorage.getItem('roles') !== 'undefined') ? JSON.parse(localStorage.getItem('roles')) : [],
  isAuthenticated: !!localStorage.getItem('token'),
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  theatreId: localStorage.getItem('theatreId') ? Number(localStorage.getItem('theatreId')) : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.username;
      state.roles = action.payload.roles;
      state.isAuthenticated = true;
      state.userId = action.payload.userId;
      state.theatreId = action.payload.theatreId || null;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.username));
      localStorage.setItem('roles', JSON.stringify(action.payload.roles));
      localStorage.setItem('userId', action.payload.userId);
      if (action.payload.theatreId) {
        localStorage.setItem('theatreId', action.payload.theatreId);
      } else {
        localStorage.removeItem('theatreId');
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.roles = [];
      state.isAuthenticated = false;
      state.userId = null;
      state.theatreId = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('roles');
      localStorage.removeItem('userId');
      localStorage.removeItem('theatreId');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
