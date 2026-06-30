import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  user: (localStorage.getItem('user') && localStorage.getItem('user') !== 'undefined') ? JSON.parse(localStorage.getItem('user')) : null,
  roles: (localStorage.getItem('roles') && localStorage.getItem('roles') !== 'undefined') ? JSON.parse(localStorage.getItem('roles')) : [],
  isAuthenticated: !!localStorage.getItem('token'),
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
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
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.username));
      localStorage.setItem('roles', JSON.stringify(action.payload.roles));
      localStorage.setItem('userId', action.payload.userId);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.roles = [];
      state.isAuthenticated = false;
      state.userId = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('roles');
      localStorage.removeItem('userId');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
