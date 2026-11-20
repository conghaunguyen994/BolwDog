import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from '../../types/cart';
import { Product, ProductVariant } from '../../types/product';
import { PetCustomization } from '../../types/order';
import { SaleCampaignConfig } from '../../types/settings';
import { calculateDiscountedPrice, getProductDiscountPercentage } from '../../utils/sale';

const CART_STORAGE_KEY = 'bowldog_cart_v1';
const DEFAULT_DEPOSIT_PERCENTAGE = 50;

function normalizeDepositPercentage(pct?: number): number {
  const numeric = Number(pct);
  if (!Number.isFinite(numeric)) return DEFAULT_DEPOSIT_PERCENTAGE;
  return Math.min(100, Math.max(0, numeric));
}

function getBaseItemPrice(product: Product, variant?: ProductVariant): number {
  return (Number(product?.price) || 0) + (variant ? Number(variant.additional_price) || 0 : 0);
}

function applySaleToItems(items: CartItem[], saleCampaign?: SaleCampaignConfig | null) {
  const now = new Date();
  for (const item of items) {
    const basePrice =
      item.product && typeof item.product.price === 'number'
        ? getBaseItemPrice(item.product, item.selectedVariant)
        : item.originalUnitPrice ?? item.unitPrice;
    const discountPct = getProductDiscountPercentage(item.product?.id, saleCampaign, now);
    item.originalUnitPrice = basePrice;
    item.discountPercentage = discountPct;
    item.unitPrice = calculateDiscountedPrice(basePrice, discountPct);
  }
}

function calculateCartTotals(
  items: CartItem[],
  depositPercentage = DEFAULT_DEPOSIT_PERCENTAGE,
  saleCampaign?: SaleCampaignConfig | null
) {
  applySaleToItems(items, saleCampaign);
  const safePct = normalizeDepositPercentage(depositPercentage);
  const originalSubtotal = items.reduce(
    (sum, item) => sum + (item.originalUnitPrice ?? item.unitPrice) * item.quantity,
    0
  );
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = Math.max(0, originalSubtotal - subtotal);
  const shippingFee = items.length === 0 ? 0 : subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;
  const depositAmount = Math.round(total * (safePct / 100));
  return {
    originalSubtotal,
    discountAmount,
    subtotal,
    shippingFee,
    total,
    depositAmount,
    depositPercentage: safePct,
  };
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
        const totals = calculateCartTotals(items, DEFAULT_DEPOSIT_PERCENTAGE, null);
        return { items, ...totals, saleCampaign: null };
      }
    }
  } catch (e) {
    console.error('Failed to parse cart storage:', e);
  }
  return {
    items: [],
    originalSubtotal: 0,
    discountAmount: 0,
    subtotal: 0,
    shippingFee: 0,
    total: 0,
    depositAmount: 0,
    depositPercentage: DEFAULT_DEPOSIT_PERCENTAGE,
    saleCampaign: null,
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
      const originalUnitPrice = getBaseItemPrice(product, variant);
      const discountPercentage = getProductDiscountPercentage(product.id, state.saleCampaign);
      const unitPrice = calculateDiscountedPrice(originalUnitPrice, discountPercentage);

      // Create a deterministic key based on product ID, variant ID, and serialized customization
      const customHash = JSON.stringify(customization);
      const itemId = `${product.id}-${variant?.id || 'base'}-${customHash}`;

      const existingIndex = state.items.findIndex((it) => it.id === itemId);
      if (existingIndex > -1) {
        state.items[existingIndex].quantity += quantity;
        state.items[existingIndex].product = product;
        state.items[existingIndex].selectedVariant = variant;
      } else {
        state.items.push({
          id: itemId,
          product,
          selectedVariant: variant,
          quantity,
          originalUnitPrice,
          discountPercentage,
          unitPrice,
          customization,
        });
      }

      const totals = calculateCartTotals(state.items, state.depositPercentage, state.saleCampaign);
      state.originalSubtotal = totals.originalSubtotal;
      state.discountAmount = totals.discountAmount;
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.total = totals.total;
      state.depositAmount = totals.depositAmount;

      saveCartToStorage(state.items);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      const totals = calculateCartTotals(state.items, state.depositPercentage, state.saleCampaign);
      state.originalSubtotal = totals.originalSubtotal;
      state.discountAmount = totals.discountAmount;
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
      const totals = calculateCartTotals(state.items, state.depositPercentage, state.saleCampaign);
      state.originalSubtotal = totals.originalSubtotal;
      state.discountAmount = totals.discountAmount;
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.total = totals.total;
      state.depositAmount = totals.depositAmount;

      saveCartToStorage(state.items);
    },

    setDepositPercentage: (state, action: PayloadAction<number>) => {
      const totals = calculateCartTotals(state.items, action.payload, state.saleCampaign);
      state.depositPercentage = totals.depositPercentage;
      state.originalSubtotal = totals.originalSubtotal;
      state.discountAmount = totals.discountAmount;
      state.subtotal = totals.subtotal;
      state.shippingFee = totals.shippingFee;
      state.total = totals.total;
      state.depositAmount = totals.depositAmount;
    },

    setSaleCampaign: (state, action: PayloadAction<SaleCampaignConfig | null | undefined>) => {
      state.saleCampaign = action.payload || null;
      const totals = calculateCartTotals(state.items, state.depositPercentage, state.saleCampaign);
      state.originalSubtotal = totals.originalSubtotal;
      state.discountAmount = totals.discountAmount;
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
      state.originalSubtotal = 0;
      state.discountAmount = 0;
      state.subtotal = 0;
      state.shippingFee = 0;
      state.total = 0;
      state.depositAmount = 0;
      clearCartStorage();
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setDepositPercentage,
  setSaleCampaign,
  updateCustomization,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
