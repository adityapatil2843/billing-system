import {
  ApiResponse,
  CreateProductInput,
  CreateProductResponse,
  Product,
  ProductBarcodeResponse,
  ServerHealth,
  ShoppingList,
} from './types';

const STORAGE_KEY = 'scanbill_custom_api_url';

export function getDefaultConfiguredApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
}

export function getBaseApiUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom && custom.trim()) {
      // If deployed on Vercel or remote host, disregard stale localhost in localStorage
      const isRemoteHost = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const isCustomLocal = custom.includes('localhost') || custom.includes('127.0.0.1');
      if (isRemoteHost && isCustomLocal && process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
      }
      return custom.replace(/\/+$/, '');
    }
  }
  return getDefaultConfiguredApiUrl();
}

export function setCustomApiUrl(url: string) {
  if (typeof window === 'undefined') return;
  const clean = url.trim().replace(/\/+$/, '');
  const finalUrl = clean.endsWith('/api') ? clean : `${clean}/api`;
  localStorage.setItem(STORAGE_KEY, finalUrl);
}

export function resetApiUrl() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseApiUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check if the backend server is running.');
    }
    throw err;
  }
}

export const api = {
  /**
   * Health check to test connectivity with backend
   */
  async checkHealth(): Promise<{ health: ServerHealth; latency: number }> {
    const start = Date.now();
    const res = await request<ApiResponse<ServerHealth>>('/health');
    const latency = Date.now() - start;
    return { health: res.data, latency };
  },

  /**
   * Lookup product by barcode string
   */
  async getProductByBarcode(barcode: string): Promise<ProductBarcodeResponse> {
    const clean = barcode.trim();
    return request<ProductBarcodeResponse>(`/products/barcode/${encodeURIComponent(clean)}`);
  },

  /**
   * Fetch all products or search by keyword
   */
  async getProducts(search?: string): Promise<Product[]> {
    const query = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const res = await request<ApiResponse<Product[]>>(`/products${query}`);
    return res.data;
  },

  /**
   * Register a new product
   */
  async createProduct(data: CreateProductInput): Promise<CreateProductResponse> {
    return request<CreateProductResponse>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Create a new shopping list
   */
  async createShoppingList(name: string = 'Scan & Bill POS'): Promise<ShoppingList> {
    const res = await request<ApiResponse<ShoppingList>>('/shopping-lists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return res.data;
  },

  /**
   * Get an existing shopping list by ID
   */
  async getShoppingList(listId: string): Promise<ShoppingList> {
    const res = await request<ApiResponse<ShoppingList>>(`/shopping-lists/${listId}`);
    return res.data;
  },

  /**
   * Add an item to a shopping list by barcode
   */
  async addItem(listId: string, barcode: string, quantity: number = 1): Promise<ShoppingList> {
    const res = await request<ApiResponse<ShoppingList>>(`/shopping-lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify({ barcode: barcode.trim(), quantity }),
    });
    return res.data;
  },

  /**
   * Update item quantity in a shopping list
   */
  async updateQuantity(listId: string, itemId: string, quantity: number): Promise<ShoppingList> {
    const res = await request<ApiResponse<ShoppingList>>(`/shopping-lists/${listId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    return res.data;
  },

  /**
   * Remove an item from a shopping list
   */
  async removeItem(listId: string, itemId: string): Promise<ShoppingList> {
    const res = await request<ApiResponse<ShoppingList>>(`/shopping-lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  /**
   * Delete an entire shopping list
   */
  async deleteShoppingList(listId: string): Promise<boolean> {
    const res = await request<ApiResponse<any>>(`/shopping-lists/${listId}`, {
      method: 'DELETE',
    });
    return res.success;
  },
};
