export interface Product {
  _id?: string;
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  image?: string;
  unit?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductBarcodeResponse {
  success: boolean;
  exists: boolean;
  product?: Product;
  message?: string;
}

export interface CreateProductInput {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  image?: string;
  unit?: string;
  description?: string;
}

export interface CreateProductResponse {
  success: boolean;
  message?: string;
  product?: Product;
}

export interface CartItem {
  _id: string;
  product: string | Product;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShoppingList {
  _id: string;
  name: string;
  items: CartItem[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServerHealth {
  status: string;
  uptime: number;
  timestamp: string;
}

export interface TestBarcode {
  barcode: string;
  name: string;
  category: string;
  price: number;
  exists: boolean;
}
