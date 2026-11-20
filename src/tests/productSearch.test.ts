import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BOWL_PRODUCT,
  matchesProductSearch,
  normalizeVietnameseText,
} from '../services/productService';

describe('Product Search - Vietnamese Accent-Insensitive & Multi-Word Matching', () => {
  it('should normalize Vietnamese accents and đ/Đ cleanly', () => {
    expect(normalizeVietnameseText('Bát Ăn Chống Gù – Đế Chống Kiến')).toBe(
      'bat an chong gu de chong kien'
    );
  });

  it('should match product with Vietnamese text without accents', () => {
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, 'bat an')).toBe(true);
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, 'chong gu')).toBe(true);
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, 'cho meo')).toBe(true);
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, 'bat meo chong kien')).toBe(true);
  });

  it('should match keywords in description and variants', () => {
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, 'inox')).toBe(true);
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, 'size xl')).toBe(true);
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, 'petg')).toBe(true);
  });

  it('should return false when query does not match the product', () => {
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, 'moc khoa corgi')).toBe(false);
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, 'xyz123khongtontai')).toBe(false);
  });

  it('should match all products when search query is empty or whitespace', () => {
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, '')).toBe(true);
    expect(matchesProductSearch(DEFAULT_BOWL_PRODUCT, '   ')).toBe(true);
  });
});
