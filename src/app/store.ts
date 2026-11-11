import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../features/cart/cartSlice';
import themeReducer from '../features/theme/themeSlice';
import authReducer from '../features/auth/authSlice';
import filterReducer from '../features/products/filterSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    theme: themeReducer,
    auth: authReducer,
    filters: filterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

