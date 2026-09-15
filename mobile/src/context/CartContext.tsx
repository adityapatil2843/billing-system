import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiService } from '../services/api';
import {
  CartItem,
  CreateProductInput,
  CreateProductResponse,
  ProductBarcodeResponse,
  ShoppingList,
} from '../types/api';

type ServerStatus = 'checking' | 'connected' | 'error';

interface CartContextType {
  serverUrl: string;
  serverStatus: ServerStatus;
  serverLatency: number | null;
  activeList: ShoppingList | null;
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  isSyncing: boolean;
  errorMessage: string | null;
  checkConnection: () => Promise<boolean>;
  updateServerUrl: (newUrl: string) => Promise<boolean>;
  lookupBarcode: (barcode: string) => Promise<ProductBarcodeResponse>;
  createProduct: (data: CreateProductInput) => Promise<CreateProductResponse>;
  addItemToCart: (barcode: string, quantity?: number) => Promise<{ success: boolean; message?: string }>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItemFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrl] = useState<string>(apiService.getBaseUrl());
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
  const [serverLatency, setServerLatency] = useState<number | null>(null);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or fetch active shopping list from server
  const initShoppingList = useCallback(async () => {
    try {
      setIsSyncing(true);
      const newList = await apiService.createShoppingList('Scan & Bill Cart');
      setActiveList(newList);
    } catch (err: any) {
      console.warn('Could not initialize shopping list:', err.message);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Check connection to server
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setServerStatus('checking');
    setErrorMessage(null);
    const start = Date.now();
    try {
      await apiService.checkHealth();
      const latency = Date.now() - start;
      setServerLatency(latency);
      setServerStatus('connected');
      return true;
    } catch (err: any) {
      setServerStatus('error');
      const msg = err.response?.data?.message || err.message || 'Cannot reach server';
      setErrorMessage(msg);
      setServerLatency(null);
      return false;
    }
  }, []);

  // Update server URL live
  const updateServerUrl = async (newUrl: string): Promise<boolean> => {
    apiService.setBaseUrl(newUrl);
    setServerUrl(apiService.getBaseUrl());
    return await checkConnection();
  };

  // Initial connection test on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Flow 1: Lookup product by barcode without creating or modifying anything
  const lookupBarcode = async (barcode: string): Promise<ProductBarcodeResponse> => {
    try {
      setIsSyncing(true);
      const res = await apiService.getProductByBarcode(barcode);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Network error looking up barcode';
      return {
        success: false,
        exists: false,
        message: msg,
      };
    } finally {
      setIsSyncing(false);
    }
  };

  // Flow 2: Create product in MongoDB
  const createProduct = async (data: CreateProductInput): Promise<CreateProductResponse> => {
    try {
      setIsSyncing(true);
      setErrorMessage(null);
      const res = await apiService.createProduct(data);
      return res;
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to create product';
      return {
        success: false,
        message: msg,
      };
    } finally {
      setIsSyncing(false);
    }
  };

  // Add item to cart by barcode
  const addItemToCart = async (
    barcode: string,
    quantity: number = 1
  ): Promise<{ success: boolean; message?: string }> => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      let currentListId = activeList?._id;
      if (!currentListId) {
        const newList = await apiService.createShoppingList('Scan & Bill Cart');
        currentListId = newList._id;
        setActiveList(newList);
      }

      const updatedList = await apiService.addItemToShoppingList(currentListId, barcode, quantity);
      setActiveList(updatedList);
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add item';
      setErrorMessage(msg);
      return { success: false, message: msg };
    } finally {
      setIsSyncing(false);
    }
  };

  // Update item quantity (+ or -)
  const updateItemQuantity = async (itemId: string, quantity: number) => {
    if (!activeList) return;
    setIsSyncing(true);
    try {
      if (quantity <= 0) {
        await removeItemFromCart(itemId);
        return;
      }
      const updatedList = await apiService.updateItemQuantity(activeList._id, itemId, quantity);
      setActiveList(updatedList);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update quantity';
      setErrorMessage(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  // Remove item from cart
  const removeItemFromCart = async (itemId: string) => {
    if (!activeList) return;
    setIsSyncing(true);
    try {
      const updatedList = await apiService.removeItemFromShoppingList(activeList._id, itemId);
      setActiveList(updatedList);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove item';
      setErrorMessage(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!activeList) return;
    setIsSyncing(true);
    try {
      await apiService.deleteShoppingList(activeList._id);
      const freshList = await apiService.createShoppingList('Scan & Bill Cart');
      setActiveList(freshList);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to clear cart';
      setErrorMessage(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const cartItems = activeList?.items || [];
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = activeList?.total || 0;

  return (
    <CartContext.Provider
      value={{
        serverUrl,
        serverStatus,
        serverLatency,
        activeList,
        cartItems,
        cartCount,
        cartTotal,
        isSyncing,
        errorMessage,
        checkConnection,
        updateServerUrl,
        lookupBarcode,
        createProduct,
        addItemToCart,
        updateItemQuantity,
        removeItemFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
