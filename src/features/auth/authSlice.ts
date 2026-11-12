import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isBlocked?: boolean;
  blockedReason?: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isBlocked: false,
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
      state.isBlocked = Boolean(action.payload?.isBlocked);
      state.blockedReason = action.payload?.blockedReason;
      state.isLoading = false;
    },
    setBlockedState: (state, action: PayloadAction<{ isBlocked: boolean; reason?: string }>) => {
      state.isBlocked = action.payload.isBlocked;
      state.blockedReason = action.payload.reason;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.isBlocked = false;
      state.blockedReason = undefined;
      state.isLoading = false;
    },
  },
});

export const { setAuthLoading, setUser, setBlockedState, logout } = authSlice.actions;
export default authSlice.reducer;

