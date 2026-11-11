import { describe, it, expect, beforeEach } from 'vitest';
import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} from '../features/cart/cartSlice';
import { Product } from '../types/product';

const mockProduct: Product = {
  id: 'prod-test-01',
  category_id: 'cat-bowls',
  name: 'Bát Ăn In Tên Test',
  slug: 'bat-an-in-ten-test',
  description: 'Mô tả test',
  price: 250000,
  stock_quantity: 50,
  is_featured: true,
  is_active: true,
  specifications: {},
  images: [{ id: 'img-1', product_id: 'prod-test-01', image_url: 'http://test.com/img.jpg', display_order: 1, is_primary: true }],
  variants: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Redux Cart Slice: Precision Math & Customization Composite Keys', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty cart', () => {
    const initialState = cartReducer(undefined, { type: 'unknown' });
    expect(initialState.items).toEqual([]);
    expect(initialState.subtotal).toBe(0);
    expect(initialState.shippingFee).toBe(0);
    expect(initialState.total).toBe(0);
    expect(initialState.depositAmount).toBe(0);
  });

  it('should calculate subtotal, shipping fee, and 50% deposit correctly', () => {
    let state = cartReducer(undefined, { type: 'unknown' });
    state = cartReducer(
      state,
      addToCart({
        product: mockProduct,
        quantity: 1,
        customization: { petName: 'Bé Bắp' },
      })
    );

    expect(state.items.length).toBe(1);
    expect(state.subtotal).toBe(250000);
    expect(state.shippingFee).toBe(30000); // Under 500k -> 30k ship
    expect(state.total).toBe(280000);
    expect(state.depositAmount).toBe(140000); // 50% of 280k
  });

  it('should grant free shipping when subtotal >= 500.000 VND', () => {
    let state = cartReducer(undefined, { type: 'unknown' });
    state = cartReducer(
      state,
      addToCart({
        product: mockProduct,
        quantity: 2, // 250k x 2 = 500k
        customization: { petName: 'Bé Bắp' },
      })
    );

    expect(state.subtotal).toBe(500000);
    expect(state.shippingFee).toBe(0); // Free shipping threshold met!
    expect(state.total).toBe(500000);
    expect(state.depositAmount).toBe(250000);
  });

  it('should create separate line items when customizations differ', () => {
    let state = cartReducer(undefined, { type: 'unknown' });
    // First item for pet "Miu Miu"
    state = cartReducer(
      state,
      addToCart({
        product: mockProduct,
        quantity: 1,
        customization: { petName: 'Miu Miu' },
      })
    );

    // Second item of SAME product, but for pet "Corgi Béo"
    state = cartReducer(
      state,
      addToCart({
        product: mockProduct,
        quantity: 1,
        customization: { petName: 'Corgi Béo' },
      })
    );

    expect(state.items.length).toBe(2);
    expect(state.items[0].customization.petName).toBe('Miu Miu');
    expect(state.items[1].customization.petName).toBe('Corgi Béo');
  });

  it('should increment quantity when product and customization are identical', () => {
    let state = cartReducer(undefined, { type: 'unknown' });
    state = cartReducer(
      state,
      addToCart({
        product: mockProduct,
        quantity: 1,
        customization: { petName: 'Bé Bắp' },
      })
    );

    state = cartReducer(
      state,
      addToCart({
        product: mockProduct,
        quantity: 2,
        customization: { petName: 'Bé Bắp' },
      })
    );

    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(3);
  });

  it('should remove item when quantity is updated to 0 or removed', () => {
    let state = cartReducer(undefined, { type: 'unknown' });
    state = cartReducer(
      state,
      addToCart({
        product: mockProduct,
        quantity: 1,
        customization: { petName: 'Bé Bắp' },
      })
    );

    const itemId = state.items[0].id;
    state = cartReducer(state, updateQuantity({ id: itemId, quantity: 0 }));
    expect(state.items.length).toBe(0);
    expect(state.total).toBe(0);
  });
});
