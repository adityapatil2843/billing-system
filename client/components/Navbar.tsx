'use client';

import React from 'react';
import {
  Barcode,
  Server,
  RefreshCw,
  PlusCircle,
  ShoppingBag,
  Settings,
  Package,
} from 'lucide-react';
import { ServerHealth } from '../lib/types';

interface NavbarProps {
  serverStatus: 'connected' | 'error' | 'checking';
  serverHealth: ServerHealth | null;
  serverLatency: number | null;
  onRefreshHealth: () => void;
  onOpenSettings: () => void;
  onOpenAddProduct: () => void;
  onOpenCatalog: () => void;
  cartCount: number;
  onToggleCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  serverStatus,
  serverLatency,
  onRefreshHealth,
  onOpenSettings,
  onOpenAddProduct,
  onOpenCatalog,
  cartCount,
  onToggleCart,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
            <Barcode className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white sm:text-xl">
                Scan<span className="text-indigo-400">&</span>Bill
              </span>
              <span className="rounded-md bg-indigo-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 border border-indigo-800/60">
                POS
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Smart Supermarket Barcode Checkout System
            </p>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Server Connection Status Pill */}
          <div
            onClick={onRefreshHealth}
            title="Click to re-check server connection"
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              serverStatus === 'connected'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : serverStatus === 'checking'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  serverStatus === 'connected'
                    ? 'bg-emerald-400'
                    : serverStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  serverStatus === 'connected'
                    ? 'bg-emerald-500'
                    : serverStatus === 'checking'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </span>

            <span className="hidden sm:inline">
              {serverStatus === 'connected'
                ? `Server Online ${serverLatency ? `(${serverLatency}ms)` : ''}`
                : serverStatus === 'checking'
                ? 'Checking...'
                : 'Server Offline'}
            </span>
            <RefreshCw
              className={`h-3 w-3 ${serverStatus === 'checking' ? 'animate-spin' : ''}`}
            />
          </div>

          {/* Browse Catalog Button */}
          <button
            onClick={onOpenCatalog}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 sm:text-sm"
          >
            <Package className="h-4 w-4 text-cyan-400" />
            <span className="hidden md:inline">Catalog</span>
          </button>

          {/* Register New Product Button */}
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-600/40 bg-indigo-600/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-600/20 sm:text-sm"
          >
            <PlusCircle className="h-4 w-4 text-indigo-400" />
            <span className="hidden md:inline">Add Product</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Backend Server IP Settings"
            className="rounded-lg border border-slate-800 bg-slate-900/90 p-2 text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Cart Mobile Toggle */}
          <button
            onClick={onToggleCart}
            className="relative flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 sm:text-sm lg:hidden"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-indigo-700">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
