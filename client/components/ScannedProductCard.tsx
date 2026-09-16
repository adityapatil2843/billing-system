'use client';

import React, { useState } from 'react';
import {
  Check,
  Plus,
  Minus,
  ShoppingCart,
  Tag,
  Package,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';
import { Product } from '../lib/types';

interface ScannedProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => Promise<void>;
  onClear: () => void;
  isAdding: boolean;
}

export const ScannedProductCard: React.FC<ScannedProductCardProps> = ({
  product,
  onAddToCart,
  onClear,
  isAdding,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = async () => {
    await onAddToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const subtotal = product.price * quantity;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 p-4 sm:p-5 backdrop-blur-xl shadow-2xl">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 truncate">
            Product Identified
          </span>
          <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300 shrink-0">
            {product.barcode}
          </span>
        </div>
        <button
          onClick={onClear}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
        {/* Product Image / Icon */}
        <div className="flex items-center gap-3 md:block">
          <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2">
            {product.image && product.image.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain"
                onError={(e) => {
                  // Fallback to icon if broken URL
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-slate-600" />
            )}
            {product.category && (
              <span className="absolute bottom-1 right-1 rounded bg-slate-900/90 px-1 py-0.5 text-[8px] sm:text-[9px] font-medium text-slate-400">
                {product.category}
              </span>
            )}
          </div>

          {/* Mobile-only compact name & price preview if stacked */}
          <div className="md:hidden flex-1">
            <h3 className="text-base font-bold text-white">{product.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {product.brand && (
                <span className="rounded bg-indigo-950/70 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                  {product.brand}
                </span>
              )}
              {product.unit && (
                <span className="text-[11px] text-slate-400">({product.unit})</span>
              )}
            </div>
            <div className="mt-1 text-lg font-extrabold text-emerald-400">
              ₹{product.price}
            </div>
          </div>
        </div>

        {/* Info (Desktop & tablet) */}
        <div className="hidden md:block flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-white">{product.name}</h3>
            {product.brand && (
              <span className="rounded-md bg-indigo-950/70 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-800/40">
                {product.brand}
              </span>
            )}
            {product.unit && (
              <span className="text-xs text-slate-400">({product.unit})</span>
            )}
          </div>

          {product.description && (
            <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>
          )}

          <div className="pt-1 text-2xl font-black tracking-tight text-white">
            ₹{product.price}
            <span className="ml-1 text-xs font-normal text-slate-400">/ unit</span>
          </div>
        </div>

        {/* Quantity Controls & Add to Cart */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between gap-3 border-t border-slate-800 pt-3 md:border-t-0 md:pt-0">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Qty:</span>
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 p-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || isAdding}
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-8 text-center text-sm font-bold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={isAdding}
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] sm:text-[11px] text-slate-400">Subtotal</div>
              <div className="text-sm sm:text-base font-bold text-emerald-400">₹{subtotal}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isAdding}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-lg transition-all min-h-[40px] w-full sm:w-auto ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-500'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" /> Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
