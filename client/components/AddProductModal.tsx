'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Sparkles,
  Barcode,
  Tag,
  DollarSign,
  Layers,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { CreateProductInput, Product } from '../lib/types';
import { api } from '../lib/api';

interface AddProductModalProps {
  isOpen: boolean;
  initialBarcode?: string;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  initialBarcode = '',
  onClose,
  onProductCreated,
}) => {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcode(initialBarcode || '');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialBarcode]);

  if (!isOpen) return null;

  const handleFillSample = () => {
    const randomCode = '890' + Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(barcode.trim() ? barcode : randomCode);
    setName('Organic Almond Butter');
    setBrand('NuttyDelight');
    setCategory('Grocery');
    setPrice('320');
    setUnit('250 g');
    setImage('https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400');
    setDescription('100% stone-ground creamy California almond butter with no added sugar.');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!barcode.trim()) {
      setError('Barcode is required.');
      return;
    }
    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid positive price.');
      return;
    }

    setLoading(true);

    try {
      const payload: CreateProductInput = {
        barcode: barcode.trim(),
        name: name.trim(),
        brand: brand.trim() || undefined,
        category: category.trim() || undefined,
        price: numPrice,
        unit: unit.trim() || undefined,
        image: image.trim() || undefined,
        description: description.trim() || undefined,
      };

      const res = await api.createProduct(payload);
      if (res.success && res.product) {
        setSuccessMsg(`"${res.product.name}" registered successfully!`);
        onProductCreated(res.product);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Failed to create product');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Register New Product</h2>
              <p className="text-xs text-slate-400">Add an inventory item with barcode details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fill Sample Button */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Need sample data for fast testing?</span>
          </div>
          <button
            type="button"
            onClick={handleFillSample}
            className="rounded-lg bg-indigo-600/20 px-2.5 py-1 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-600/30"
          >
            Fill Sample
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Barcode Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative mt-1">
                <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 8901234567890"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">
                Product Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maggi Noodles"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-300">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Nestle"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Instant Food"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">
                Price (₹) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300">Unit / Pack</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 500 g or 1 pack"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Image URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short product details..."
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
