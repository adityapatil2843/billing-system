'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Package,
  Plus,
  Tag,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { Product } from '../lib/types';
import { api } from '../lib/api';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchProducts = async (term?: string) => {
    setLoading(true);
    try {
      const list = await api.getProducts(term);
      setProducts(list || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(search);
  };

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Product Inventory Catalog</h2>
              <p className="text-xs text-slate-400">
                {products.length} registered products in MongoDB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="border-b border-slate-800/80 p-4 space-y-3 bg-slate-950/40">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, category, or brand..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Category Pills */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as string)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-slate-400 text-xs">
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
              Loading inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <Package className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No products found matching your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredProducts.map((p) => (
                <div
                  key={p._id || p.barcode}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-indigo-500/40 transition"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-500 overflow-hidden">
                      {p.image && p.image.startsWith('http') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package className="h-6 w-6" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{p.barcode}</span>
                        {p.brand && <span>• {p.brand}</span>}
                      </div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">
                        ₹{p.price} {p.unit && <span className="text-[10px] text-slate-500 font-normal">({p.unit})</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600/20 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition ml-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
