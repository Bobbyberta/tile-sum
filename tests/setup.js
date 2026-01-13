// Test setup file for Vitest
import { beforeEach, afterEach, vi } from 'vitest';

// Create localStorage mock with actual storage
let store = {};

const localStorageMock = {
  getItem: vi.fn((key) => {
    return store[key] || null;
  }),
  setItem: vi.fn((key, value) => {
    store[key] = String(value);
  }),
  removeItem: vi.fn((key) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    store = {};
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: vi.fn((index) => {
    const keys = Object.keys(store);
    return keys[index] || null;
  })
};

// Replace localStorage before jsdom initializes
vi.stubGlobal('localStorage', localStorageMock);

// Setup localStorage mock before each test
beforeEach(() => {
  // Clear the store before each test
  store = {};
  // Reset all mock function calls
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
  // Clear store after each test
  store = {};
});
