import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

interface FilterState {
  categoryId: string; // 'all' or UUID
  searchQuery: string;
  sortBy: SortOption;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
}

const initialState: FilterState = {
  categoryId: 'all',
  searchQuery: '',
  sortBy: 'newest',
  minPrice: 0,
  maxPrice: 1000000,
  inStockOnly: false,
};

export const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCategoryId: (state, action: PayloadAction<string>) => {
      state.categoryId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action: PayloadAction<SortOption>) => {
      state.sortBy = action.payload;
    },
    setPriceRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.minPrice = action.payload.min;
      state.maxPrice = action.payload.max;
    },
    setInStockOnly: (state, action: PayloadAction<boolean>) => {
      state.inStockOnly = action.payload;
    },
    resetFilters: () => initialState,
  },
});

export const {
  setCategoryId,
  setSearchQuery,
  setSortBy,
  setPriceRange,
  setInStockOnly,
  resetFilters,
} = filterSlice.actions;

export default filterSlice.reducer;

