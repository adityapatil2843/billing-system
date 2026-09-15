import axios, { AxiosInstance } from 'axios';
import { getDefaultApiBaseUrl } from '../config/api.config';
import {
  ApiResponse,
  CartItem,
  CreateProductInput,
  CreateProductResponse,
  Product,
  ProductBarcodeResponse,
  ServerHealth,
  ShoppingList,
} from '../types/api';

class ApiService {
  private client: AxiosInstance;
  private currentBaseUrl: string;

  constructor() {
    this.currentBaseUrl = getDefaultApiBaseUrl();
    this.client = axios.create({
      baseURL: this.currentBaseUrl,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public getBaseUrl(): string {
    return this.currentBaseUrl;
  }

  public setBaseUrl(url: string) {
    const cleanUrl = url.replace(/\/+$/, '');
    this.currentBaseUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
    this.client.defaults.baseURL = this.currentBaseUrl;
  }

  /**
   * Health check to test connectivity with backend
   */
  public async checkHealth(): Promise<ServerHealth> {
    const response = await this.client.get<ApiResponse<ServerHealth>>('/health');
    return response.data.data;
  }

  /**
   * Fetch a product by its barcode string (Flow 1: Scan Product)
   */
  public async getProductByBarcode(barcode: string): Promise<ProductBarcodeResponse> {
    const cleanBarcode = barcode.trim();
    const response = await this.client.get<ProductBarcodeResponse>(`/products/barcode/${cleanBarcode}`);
    return response.data;
  }

  /**
   * Create a new product (Flow 2: Add Product)
   */
  public async createProduct(productData: CreateProductInput): Promise<CreateProductResponse> {
    const response = await this.client.post<CreateProductResponse>('/products', productData);
    return response.data;
  }

  /**
   * Search / list all products
   */
  public async getProducts(search?: string): Promise<Product[]> {
    const params = search ? { search } : {};
    const response = await this.client.get<ApiResponse<Product[]>>('/products', { params });
    return response.data.data;
  }

  /**
   * Create a new shopping list
   */
  public async createShoppingList(name: string = 'Scan & Bill Cart'): Promise<ShoppingList> {
    const response = await this.client.post<ApiResponse<ShoppingList>>('/shopping-lists', { name });
    return response.data.data;
  }

  /**
   * Get an existing shopping list by ID
   */
  public async getShoppingList(listId: string): Promise<ShoppingList> {
    const response = await this.client.get<ApiResponse<ShoppingList>>(`/shopping-lists/${listId}`);
    return response.data.data;
  }

  /**
   * Add an item to a shopping list by barcode
   */
  public async addItemToShoppingList(
    listId: string,
    barcode: string,
    quantity: number = 1
  ): Promise<ShoppingList> {
    const response = await this.client.post<ApiResponse<ShoppingList>>(
      `/shopping-lists/${listId}/items`,
      {
        barcode: barcode.trim(),
        quantity,
      }
    );
    return response.data.data;
  }

  /**
   * Update item quantity in a shopping list
   */
  public async updateItemQuantity(
    listId: string,
    itemId: string,
    quantity: number
  ): Promise<ShoppingList> {
    const response = await this.client.put<ApiResponse<ShoppingList>>(
      `/shopping-lists/${listId}/items/${itemId}`,
      { quantity }
    );
    return response.data.data;
  }

  /**
   * Remove an item from a shopping list
   */
  public async removeItemFromShoppingList(listId: string, itemId: string): Promise<ShoppingList> {
    const response = await this.client.delete<ApiResponse<ShoppingList>>(
      `/shopping-lists/${listId}/items/${itemId}`
    );
    return response.data.data;
  }

  /**
   * Delete an entire shopping list
   */
  public async deleteShoppingList(listId: string): Promise<boolean> {
    const response = await this.client.delete<ApiResponse<any>>(`/shopping-lists/${listId}`);
    return response.data.success;
  }
}

export const apiService = new ApiService();
