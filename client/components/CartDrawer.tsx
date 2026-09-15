'use client';

import React from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Receipt,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CartItem, ShoppingList } from '../lib/types';

interface CartDrawerProps {
  shoppingList: ShoppingList | null;
  onUpdateQuantity: (itemId: string, newQty: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onClearCart: () => Promise<void>;
  onCheckout: () => void;
  isUpdating: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  shoppingList,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isUpdating,
}) => {
  const items = shoppingList?.items || [];
  const total = shoppingList?.total || 0;
  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Current Cart</h2>
            <p className="text-xs text-slate-400">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in shopping list
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            disabled={isUpdating}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-rose-400"
            title="Clear all items in cart"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2.5 min-h-[220px] max-h-[500px]">
        {items.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-500 mb-2">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium text-slate-300">Your cart is empty</p>
            <p className="text-[11px] text-slate-500 max-w-[200px] mt-1">
              Scan a product barcode or click any test preset above to start adding items.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between rounded-xl border border-slate-800/90 bg-slate-950/70 p-3 transition hover:border-slate-700"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="truncate text-xs font-semibold text-white">{item.name}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>₹{item.price} each</span>
                  <span>•</span>
                  <span>{item.barcode}</span>
                </div>
                <div className="mt-1 text-xs font-bold text-emerald-400">
                  ₹{item.subtotal}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.quantity > 1) {
                        onUpdateQuantity(item._id, item.quantity - 1);
                      } else {
                        onRemoveItem(item._id);
                      }
                    }}
                    disabled={isUpdating}
                    className="rounded p-1 text-slate-300 hover:bg-slate-800"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-6 text-center text-xs font-bold text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                    disabled={isUpdating}
                    className="rounded p-1 text-slate-300 hover:bg-slate-800"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(item._id)}
                  disabled={isUpdating}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {items.length > 0 && (
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal ({itemCount} units)</span>
              <span className="font-semibold text-white">₹{total}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST Tax (5% approx)</span>
              <span className="text-slate-300">₹{(total * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800/80">
              <span>Total Payable</span>
              <span className="text-emerald-400">₹{(total * 1.05).toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            disabled={isUpdating || items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:opacity-95 disabled:opacity-50"
          >
            <Receipt className="h-4 w-4" />
            <span>Generate Bill & Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
