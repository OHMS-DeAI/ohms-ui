import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock fetch
global.fetch = vi.fn()

// Mock console methods to reduce noise in tests
console.log = vi.fn()
console.info = vi.fn()
console.warn = vi.fn()
console.error = vi.fn()

// Mock crypto.randomUUID for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-1234-5678-9012',
    getRandomValues: (arr: any) => arr.map(() => Math.floor(Math.random() * 256))
  }
})

// Mock IndexedDB for DFINITY auth client
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  readyState: 'done'
}

const mockIDBDatabase = {
  version: 1,
  objectStoreNames: [],
  createObjectStore: vi.fn().mockReturnValue({
    add: vi.fn().mockReturnValue(mockIDBRequest),
    get: vi.fn().mockReturnValue(mockIDBRequest),
    put: vi.fn().mockReturnValue(mockIDBRequest),
    delete: vi.fn().mockReturnValue(mockIDBRequest),
    createIndex: vi.fn()
  }),
  transaction: vi.fn().mockReturnValue({
    objectStore: vi.fn().mockReturnValue({
      add: vi.fn().mockReturnValue(mockIDBRequest),
      get: vi.fn().mockReturnValue(mockIDBRequest),
      put: vi.fn().mockReturnValue(mockIDBRequest),
      delete: vi.fn().mockReturnValue(mockIDBRequest)
    }),
    oncomplete: null,
    onerror: null,
    onabort: null
  })
}

const mockIDBOpenRequest = {
  ...mockIDBRequest,
  result: mockIDBDatabase,
  onupgradeneeded: null,
  onblocked: null
}

global.indexedDB = {
  open: vi.fn().mockReturnValue(mockIDBOpenRequest),
  deleteDatabase: vi.fn().mockReturnValue(mockIDBRequest),
  databases: vi.fn().mockResolvedValue([])
} as any

// Mock IDBKeyRange
global.IDBKeyRange = {
  bound: vi.fn(),
  only: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn()
} as any

// Setup common test utilities
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})