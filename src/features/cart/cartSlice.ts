import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from '../../types/cart';
import { Product, ProductVariant } from '../../types/product';
import { PetCustomization } from '../../types/order';
import { FreeshipVoucherConfig, SaleCampaignConfig } from '../../types/settings';
import {
  calculateDiscountedPrice,
  getProductDiscountPercentage,
  isFreeshipCodeValid,
} from '../../utils/sale';

const CART_STORAGE_KEY = 'bowldog_cart_v1';
const FREESHIP_STORAGE_KEY = 'bowldog_freeship_code_v1';
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
  saleCampaign?: SaleCampaignConfig | null,
  appliedFreeshipCode?: string | null,
  freeshipVoucherConfig?: FreeshipVoucherConfig | null
) {
  applySaleToItems(items, saleCampaign);
  const selectedItems = items.filter((item) => item.selected !== false);
  const safePct = normalizeDepositPercentage(depositPercentage);
  const originalSubtotal = selectedItems.reduce(
    (sum, item) => sum + (item.originalUnitPrice ?? item.unitPrice) * item.quantity,
    0
  );
  const subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = Math.max(0, originalSubtotal - subtotal);
  const baseShippingFee = selectedItems.length === 0 ? 0 : subtotal >= 500000 ? 0 : 30000;
  const hasFreeshipVoucher =
    selectedItems.length > 0 && isFreeshipCodeValid(appliedFreeshipCode, freeshipVoucherConfig);
  const shippingDiscountAmount = hasFreeshipVoucher ? baseShippingFee : 0;
  const shippingFee = Math.max(0, baseShippingFee - shippingDiscountAmount);
  const total = subtotal + shippingFee;
  const depositAmount = Math.round(total * (safePct / 100));
  return {
    originalSubtotal,
    discountAmount,
    subtotal,
    baseShippingFee,
    shippingDiscountAmount,
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

function saveFreeshipCodeToStorage(code?: string | null) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (code && code.trim()) {
        window.localStorage.setItem(FREESHIP_STORAGE_KEY, code.trim());
      } else {
        window.localStorage.removeItem(FREESHIP_STORAGE_KEY);
      }
    }
  } catch {
    // ignore storage errors
  }
}

function clearCartStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      window.localStorage.removeItem(FREESHIP_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to remove cart from localStorage', err);
  }
}

function loadInitialCart(): CartState {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      const savedCode = window.localStorage.getItem(FREESHIP_STORAGE_KEY) || null;
      if (saved) {
        const items: CartItem[] = JSON.parse(saved);
        const totals = calculateCartTotals(
          items,
          DEFAULT_DEPOSIT_PERCENTAGE,
          null,
          savedCode,
          null
        );
        return {
          items,
          ...totals,
          saleCampaign: null,
          freeshipVoucherConfig: null,
          appliedFreeshipCode: savedCode,
        };
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
    baseShippingFee: 0,
    shippingDiscountAmount: 0,
    shippingFee: 0,
    total: 0,
    depositAmount: 0,
    depositPercentage: DEFAULT_DEPOSIT_PERCENTAGE,
    saleCampaign: null,
    freeshipVoucherConfig: null,
    appliedFreeshipCode: null,
  };
}

const initialState: CartState = loadInitialCart();

function syncTotalsIntoState(state: CartState) {
  const totals = calculateCartTotals(
    state.items,
    state.depositPercentage,
    state.saleCampaign,
    state.appliedFreeshipCode,
    state.freeshipVoucherConfig
  );
  state.depositPercentage = totals.depositPercentage;
  state.originalSubtotal = totals.originalSubtotal;
  state.discountAmount = totals.discountAmount;
  state.subtotal = totals.subtotal;
  state.baseShippingFee = totals.baseShippingFee;
  state.shippingDiscountAmount = totals.shippingDiscountAmount;
  state.shippingFee = totals.shippingFee;
  state.total = totals.total;
  state.depositAmount = totals.depositAmount;
}

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

      const customHash = JSON.stringify(customization);
      const itemId = `${product.id}-${variant?.id || 'base'}-${customHash}`;

      const existingIndex = state.items.findIndex((it) => it.id === itemId);
      if (existingIndex > -1) {
        state.items[existingIndex].quantity += quantity;
        state.items[existingIndex].product = product;
        state.items[existingIndex].selectedVariant = variant;
        state.items[existingIndex].selected = true;
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
          selected: true,
        });
      }

      syncTotalsIntoState(state);
      saveCartToStorage(state.items);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      syncTotalsIntoState(state);
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
      syncTotalsIntoState(state);
      saveCartToStorage(state.items);
    },

    setDepositPercentage: (state, action: PayloadAction<number>) => {
      state.depositPercentage = normalizeDepositPercentage(action.payload);
      syncTotalsIntoState(state);
    },

    setSaleCampaign: (state, action: PayloadAction<SaleCampaignConfig | null | undefined>) => {
      state.saleCampaign = action.payload || null;
      syncTotalsIntoState(state);
      saveCartToStorage(state.items);
    },

    setFreeshipVoucherConfig: (
      state,
      action: PayloadAction<FreeshipVoucherConfig | null | undefined>
    ) => {
      state.freeshipVoucherConfig = action.payload || null;
      if (
        state.appliedFreeshipCode &&
        !isFreeshipCodeValid(state.appliedFreeshipCode, state.freeshipVoucherConfig)
      ) {
        state.appliedFreeshipCode = null;
        saveFreeshipCodeToStorage(null);
      }
      syncTotalsIntoState(state);
    },

    applyFreeshipCode: (state, action: PayloadAction<string | null | undefined>) => {
      const cleaned = action.payload ? String(action.payload).trim() : null;
      state.appliedFreeshipCode = cleaned || null;
      saveFreeshipCodeToStorage(state.appliedFreeshipCode);
      syncTotalsIntoState(state);
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

    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const item = state.items.find((it) => it.id === action.payload);
      if (item) {
        item.selected = item.selected === false ? true : false;
        syncTotalsIntoState(state);
        saveCartToStorage(state.items);
      }
    },

    toggleAllSelection: (state, action: PayloadAction<boolean>) => {
      for (const item of state.items) {
        item.selected = action.payload;
      }
      syncTotalsIntoState(state);
      saveCartToStorage(state.items);
    },

    removeSelectedItems: (state) => {
      state.items = state.items.filter((item) => item.selected === false);
      state.appliedFreeshipCode = null;
      saveFreeshipCodeToStorage(null);
      syncTotalsIntoState(state);
      saveCartToStorage(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      state.originalSubtotal = 0;
      state.discountAmount = 0;
      state.subtotal = 0;
      state.baseShippingFee = 0;
      state.shippingDiscountAmount = 0;
      state.shippingFee = 0;
      state.total = 0;
      state.depositAmount = 0;
      state.appliedFreeshipCode = null;
      clearCartStorage();
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  toggleItemSelection,
  toggleAllSelection,
  removeSelectedItems,
  setDepositPercentage,
  setSaleCampaign,
  setFreeshipVoucherConfig,
  applyFreeshipCode,
  updateCustomization,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
