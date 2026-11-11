import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.isAdmin = action.payload?.role === 'admin';
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.isLoading = false;
    },
  },
});

export const { setAuthLoading, setUser, logout } = authSlice.actions;
export default authSlice.reducer;

