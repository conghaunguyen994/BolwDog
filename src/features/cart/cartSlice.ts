import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from '../../types/cart';
import { Product, ProductVariant } from '../../types/product';
import { PetCustomization } from '../../types/order';

const CART_STORAGE_KEY = 'bowldog_cart_v1';

function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = items.length === 0 ? 0 : subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;
  const depositAmount = Math.round(total * 0.5); // 50% deposit
  return { subtotal, shippingFee, total, depositAmount };
}

function saveCartToStorage(items: CartItem[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  } catch (err) {
    console.error('Failed to save cart to localStorage', err);
  }
}

function clearCartStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to remove cart from localStorage', err);
  }
}

function loadInitialCart(): CartState {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const items: CartItem[] = JSON.parse(saved);
        const totals = calculateCartTotals(items);
        return { items, ...totals };
      }
    }
  } catch (e) {
    console.error('Failed to parse cart storage:', e);
  }
  return {
    items: [],
    subtotal: 0,
    shippingFee: 0,
    total: 0,
    depositAmount: 0,
  };
}

const initialState: CartState = loadInitialCart();

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{
        product: Product;
        variant?: ProductVariant;
        quantity: number;
        customization: PetCustomization;
      }>
    ) => {
      const { product, variant, quantity, customization } = action.payload;
      const unitPrice = product.price + (variant ? variant.additional_price : 0);
      
      // Create a deterministic key based on product ID, variant ID, and serialized customization
      const customHash = JSON.stringify(customization);
      const itemId = `${product.id}-${variant?.id || 'base'}-${customHash}`;

      const existingIndex = state.items.findIndex((it) => it.id === itemId);
      if (existingIndex > -1) {
        state.items[existingIndex].quantity += quantity;
      } else {
        state.items.push({
          id: itemId,
          product,
          selectedVariant: variant,
          quantity,
          unitPrice,
          customization,
        });
      }

      const totals = calculateCartTotals(state.items);
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.total = totals.total;
      state.depositAmount = totals.depositAmount;

      saveCartToStorage(state.items);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      const totals = calculateCartTotals(state.items);
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.total = totals.total;
      state.depositAmount = totals.depositAmount;

      saveCartToStorage(state.items);
    },

    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((it) => it.id === action.payload.id);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((it) => it.id !== action.payload.id);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
      const totals = calculateCartTotals(state.items);
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.total = totals.total;
      state.depositAmount = totals.depositAmount;

      saveCartToStorage(state.items);
    },

    updateCustomization: (
      state,
      action: PayloadAction<{ id: string; customization: PetCustomization }>
    ) => {
      const item = state.items.find((it) => it.id === action.payload.id);
      if (item) {
        item.customization = { ...item.customization, ...action.payload.customization };
        saveCartToStorage(state.items);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.shippingFee = 0;
      state.total = 0;
      state.depositAmount = 0;
      clearCartStorage();
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, updateCustomization, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

