'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { ScannerSection } from '../components/ScannerSection';
import { ScannedProductCard } from '../components/ScannedProductCard';
import { CartDrawer } from '../components/CartDrawer';
import { SettingsModal } from '../components/SettingsModal';
import { ProductNotFoundModal } from '../components/ProductNotFoundModal';
import { AddProductModal } from '../components/AddProductModal';
import { ProductCatalogModal } from '../components/ProductCatalogModal';
import { InvoiceModal } from '../components/InvoiceModal';
import { api } from '../lib/api';
import { Product, ShoppingList, ServerHealth } from '../lib/types';
import { Sparkles, CheckCircle, AlertCircle, ShoppingCart, Zap, Barcode } from 'lucide-react';

const SHOPPING_LIST_STORAGE_KEY = 'scanbill_active_list_id';

export default function HomePage() {
  // Server Health State
  const [serverStatus, setServerStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
  const [serverLatency, setServerLatency] = useState<number | null>(null);

  // Cart & Shopping List State
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [isCartUpdating, setIsCartUpdating] = useState(false);

  // Scanned Product State
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [addProductPrefill, setAddProductPrefill] = useState('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 1. Health check
  const checkServerHealth = useCallback(async () => {
    setServerStatus('checking');
    try {
      const { health, latency } = await api.checkHealth();
      setServerHealth(health);
      setServerLatency(latency);
      setServerStatus('connected');
    } catch {
      setServerStatus('error');
      setServerHealth(null);
      setServerLatency(null);
    }
  }, []);

  // 2. Initialize or recover active Shopping List
  const initCart = useCallback(async () => {
    try {
      const savedListId = typeof window !== 'undefined' ? localStorage.getItem(SHOPPING_LIST_STORAGE_KEY) : null;
      if (savedListId) {
        try {
          const existingList = await api.getShoppingList(savedListId);
          if (existingList && existingList._id) {
            setActiveList(existingList);
            return;
          }
        } catch {
          // If previous list doesn't exist anymore on server, create a fresh one
        }
      }

      const freshList = await api.createShoppingList('POS Counter Checkout');
      if (freshList && freshList._id) {
        localStorage.setItem(SHOPPING_LIST_STORAGE_KEY, freshList._id);
        setActiveList(freshList);
      }
    } catch (err) {
      console.warn('Could not initialize shopping list:', err);
    }
  }, []);

  useEffect(() => {
    checkServerHealth();
    initCart();
  }, [checkServerHealth, initCart]);

  // Periodic health check every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      checkServerHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [checkServerHealth]);

  // Handle Barcode Lookups
  const handleBarcodeScanned = async (barcode: string) => {
    setIsSearching(true);
    setScannedProduct(null);
    setNotFoundBarcode(null);

    try {
      const res = await api.getProductByBarcode(barcode);
      if (res.success && res.exists && res.product) {
        setScannedProduct(res.product);
        showToast(`Found: ${res.product.name} (₹${res.product.price})`, 'success');
      } else {
        setNotFoundBarcode(barcode);
      }
    } catch (err: any) {
      showToast(err.message || 'Error looking up barcode', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Add Scanned Product to Active Shopping List
  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    if (!activeList?._id) {
      await initCart();
    }
    const currentListId = activeList?._id || localStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
    if (!currentListId) {
      showToast('Cannot connect to shopping list on server', 'error');
      return;
    }

    setIsAddingToCart(true);
    try {
      const updatedList = await api.addItem(currentListId, product.barcode, quantity);
      setActiveList(updatedList);
      showToast(`Added ${quantity}x ${product.name} to cart`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add item to cart', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Update Item Quantity in Cart
  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (!activeList?._id) return;
    setIsCartUpdating(true);
    try {
      const updated = await api.updateQuantity(activeList._id, itemId, newQty);
      setActiveList(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to update quantity', 'error');
    } finally {
      setIsCartUpdating(false);
    }
  };

  // Remove Item from Cart
  const handleRemoveItem = async (itemId: string) => {
    if (!activeList?._id) return;
    setIsCartUpdating(true);
    try {
      const updated = await api.removeItem(activeList._id, itemId);
      setActiveList(updated);
      showToast('Item removed from cart', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove item', 'error');
    } finally {
      setIsCartUpdating(false);
    }
  };

  // Clear Cart
  const handleClearCart = async () => {
    if (!activeList?._id) return;
    setIsCartUpdating(true);
    try {
      await api.deleteShoppingList(activeList._id);
      localStorage.removeItem(SHOPPING_LIST_STORAGE_KEY);
      const freshList = await api.createShoppingList('POS Counter Checkout');
      localStorage.setItem(SHOPPING_LIST_STORAGE_KEY, freshList._id);
      setActiveList(freshList);
      showToast('Cart cleared', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to clear cart', 'error');
    } finally {
      setIsCartUpdating(false);
    }
  };

  // Start New Customer Bill
  const handleStartNewBill = async () => {
    setIsInvoiceOpen(false);
    await handleClearCart();
    setScannedProduct(null);
  };

  const totalItemCount = activeList?.items?.reduce((acc, it) => acc + it.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-md transition-all animate-bounce ${
            toast.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200'
              : 'border-rose-500/40 bg-rose-950/90 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        serverStatus={serverStatus}
        serverHealth={serverHealth}
        serverLatency={serverLatency}
        onRefreshHealth={checkServerHealth}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddProduct={() => {
          setAddProductPrefill('');
          setIsAddProductOpen(true);
        }}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        cartCount={totalItemCount}
        onToggleCart={() => setIsMobileCartOpen(!isMobileCartOpen)}
      />

      {/* Main Container */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Scanner & Product Preview (7 cols on lg) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Interactive Scanner */}
            <ScannerSection
              onBarcodeScanned={handleBarcodeScanned}
              isSearching={isSearching}
            />

            {/* Identified Product Card (if barcode was scanned) */}
            {scannedProduct && (
              <ScannedProductCard
                product={scannedProduct}
                onAddToCart={handleAddToCart}
                onClear={() => setScannedProduct(null)}
                isAdding={isAddingToCart}
              />
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Barcode className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Scanner Engine</span>
                </div>
                <div className="mt-1 text-sm font-bold text-white">
                  Real-time POS
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShoppingCart className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Active Cart</span>
                </div>
                <div className="mt-1 text-sm font-bold text-indigo-300">
                  ₹{activeList?.total || 0}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Database Link</span>
                </div>
                <div className="mt-1 text-sm font-bold text-emerald-400">
                  {serverStatus === 'connected' ? 'MongoDB Atlas' : 'Offline'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Shopping Cart (5 cols on lg) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <CartDrawer
                shoppingList={activeList}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onCheckout={() => setIsInvoiceOpen(true)}
                isUpdating={isCartUpdating}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => {
          checkServerHealth();
          initCart();
        }}
      />

      <ProductNotFoundModal
        isOpen={!!notFoundBarcode}
        barcode={notFoundBarcode}
        onClose={() => setNotFoundBarcode(null)}
        onRegisterProduct={(code) => {
          setAddProductPrefill(code);
          setIsAddProductOpen(true);
        }}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        initialBarcode={addProductPrefill}
        onClose={() => setIsAddProductOpen(false)}
        onProductCreated={(prod) => {
          setScannedProduct(prod);
          showToast(`"${prod.name}" registered in database!`, 'success');
        }}
      />

      <ProductCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectProduct={(prod) => {
          setScannedProduct(prod);
          showToast(`Selected: ${prod.name}`, 'success');
        }}
      />

      <InvoiceModal
        isOpen={isInvoiceOpen}
        shoppingList={activeList}
        onClose={() => setIsInvoiceOpen(false)}
        onNewBill={handleStartNewBill}
      />
    </div>
  );
}
