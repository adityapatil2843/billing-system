'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  PlusCircle,
  Sparkles,
  Barcode,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CreateProductInput, Product } from '../lib/types';
import { api } from '../lib/api';

interface AddProductModalProps {
  isOpen: boolean;
  initialBarcode?: string;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
}

// Compress and convert image file to optimized Base64 JPEG data URL
const processAndCompressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  initialBarcode = '',
  onClose,
  onProductCreated,
}) => {
  const barcodeCameraInputRef = useRef<HTMLInputElement>(null);
  const barcodeGalleryInputRef = useRef<HTMLInputElement>(null);
  const productImageCameraRef = useRef<HTMLInputElement>(null);
  const productImageGalleryRef = useRef<HTMLInputElement>(null);

  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [image, setImage] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcode(initialBarcode || '');
      setError(null);
      setSuccessMsg(null);
      setShowUrlInput(false);
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

  // Decode Barcode from photo / image file
  const handleBarcodeFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningBarcode(true);
    setError(null);

    try {
      const imageUrl = URL.createObjectURL(file);
      let foundCode: string | null = null;

      // 1. Native BarcodeDetector API
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          });
          const img = new Image();
          img.src = imageUrl;
          await img.decode();
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0) {
            foundCode = barcodes[0].rawValue;
          }
        } catch {
          // Fallback to ZXing
        }
      }

      // 2. Fallback to ZXing MultiFormat Reader
      if (!foundCode) {
        const reader = new BrowserMultiFormatReader();
        const result = await reader.decodeFromImageUrl(imageUrl);
        if (result) foundCode = result.getText();
      }

      URL.revokeObjectURL(imageUrl);

      if (foundCode) {
        setBarcode(foundCode.trim());
        setSuccessMsg(`Barcode scanned: ${foundCode.trim()}`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError('No barcode detected in the photo. Please make sure the barcode is well-lit and in focus.');
      }
    } catch {
      setError('Failed to decode barcode from image. Ensure the barcode is clear.');
    } finally {
      setIsScanningBarcode(false);
      if (barcodeCameraInputRef.current) barcodeCameraInputRef.current.value = '';
      if (barcodeGalleryInputRef.current) barcodeGalleryInputRef.current.value = '';
    }
  };

  // Handle Product Image Upload / Capture
  const handleProductImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setError(null);

    try {
      const compressedDataUrl = await processAndCompressImage(file);
      setImage(compressedDataUrl);
      setSuccessMsg('Product image uploaded successfully!');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch {
      setError('Failed to process image file. Please try another image.');
    } finally {
      setIsProcessingImage(false);
      if (productImageCameraRef.current) productImageCameraRef.current.value = '';
      if (productImageGalleryRef.current) productImageGalleryRef.current.value = '';
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-8 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl">
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
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
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
            {/* Barcode Field with Live Snap and File Upload */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Barcode Number <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-indigo-400">Scan or Type</span>
              </div>
              <div className="flex gap-1.5 items-center mt-1">
                <div className="relative flex-1">
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

                {/* Hidden File Inputs for Barcode */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={barcodeCameraInputRef}
                  onChange={handleBarcodeFileScan}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={barcodeGalleryInputRef}
                  onChange={handleBarcodeFileScan}
                />

                {/* Snap with Camera Button */}
                <button
                  type="button"
                  onClick={() => barcodeCameraInputRef.current?.click()}
                  disabled={isScanningBarcode}
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 hover:bg-slate-700 hover:text-indigo-300 transition disabled:opacity-50"
                  title="Snap barcode photo with Camera"
                >
                  {isScanningBarcode ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>

                {/* Upload from Gallery Button */}
                <button
                  type="button"
                  onClick={() => barcodeGalleryInputRef.current?.click()}
                  disabled={isScanningBarcode}
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition disabled:opacity-50"
                  title="Upload barcode image from Phone / Gallery"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Product Name */}
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

            {/* Product Image Upload / Live Camera / URL Option */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">Product Image</label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                >
                  <LinkIcon className="h-2.5 w-2.5" />
                  {showUrlInput ? 'Hide URL' : 'Paste URL'}
                </button>
              </div>

              {/* Hidden File Inputs for Product Photo */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={productImageCameraRef}
                onChange={handleProductImageFile}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={productImageGalleryRef}
                onChange={handleProductImageFile}
              />

              {/* Image Preview or Action Buttons */}
              {image ? (
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 p-1.5">
                  <img
                    src={image}
                    alt="Product Preview"
                    className="h-9 w-9 rounded-lg object-cover border border-slate-800"
                  />
                  <span className="flex-1 text-[11px] text-slate-400 truncate">
                    {image.startsWith('data:') ? 'Photo attached from device' : image}
                  </span>
                  <button
                    type="button"
                    onClick={() => productImageCameraRef.current?.click()}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-indigo-400"
                    title="Retake live photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                    title="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => productImageCameraRef.current?.click()}
                    disabled={isProcessingImage}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Live Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => productImageGalleryRef.current?.click()}
                    disabled={isProcessingImage}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5 text-cyan-400" />
                    <span>From Phone</span>
                  </button>
                </div>
              )}

              {/* Optional URL input fallback */}
              {showUrlInput && (
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              )}
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
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isScanningBarcode || isProcessingImage}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                'Register Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

