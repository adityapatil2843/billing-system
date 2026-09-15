'use client';

import React from 'react';
import { AlertCircle, PlusCircle, X, Barcode, ArrowRight } from 'lucide-react';

interface ProductNotFoundModalProps {
  isOpen: boolean;
  barcode: string | null;
  onClose: () => void;
  onRegisterProduct: (prefillBarcode: string) => void;
}

export const ProductNotFoundModal: React.FC<ProductNotFoundModalProps> = ({
  isOpen,
  barcode,
  onClose,
  onRegisterProduct,
}) => {
  if (!isOpen || !barcode) return null;

  const handleRegister = () => {
    onRegisterProduct(barcode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Product Not Found</h3>
              <p className="text-xs text-slate-400">Barcode is not registered in system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Barcode className="h-4 w-4 text-indigo-400" />
              <span>Scanned Barcode</span>
            </div>
            <div className="mt-1 font-mono text-lg font-bold tracking-wider text-amber-300">
              {barcode}
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            This barcode does not match any existing product in your inventory database.
            Would you like to register it now to set its name, category, and price?
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRegister}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95"
            >
              <PlusCircle className="h-4 w-4" />
              Register This Product
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
