'use client';

import React, { useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Sparkles,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ShoppingList } from '../lib/types';
import { playSuccessChime } from '../lib/audio';

interface InvoiceModalProps {
  isOpen: boolean;
  shoppingList: ShoppingList | null;
  onClose: () => void;
  onNewBill: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  shoppingList,
  onClose,
  onNewBill,
}) => {
  const invoiceNumber = useMemo(() => {
    return 'INV-' + Math.floor(100000 + Math.random() * 900000);
  }, [isOpen]);

  const currentDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      playSuccessChime();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }
    }
  }, [isOpen]);

  if (!isOpen || !shoppingList) return null;

  const items = shoppingList.items || [];
  const subtotal = shoppingList.total || 0;
  const taxRate = 0.05; // 5% GST (2.5% CGST + 2.5% SGST)
  const gstAmount = Math.round(subtotal * taxRate * 100) / 100;
  const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-6 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Top Controls (Hidden when printing) */}
        <div className="no-print mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Bill Generated Successfully</h3>
              <p className="text-[11px] text-slate-400">Receipt is ready for customer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Paper */}
        <div
          id="printable-receipt"
          className="rounded-xl border border-slate-300 bg-white p-6 font-mono text-xs text-slate-900 shadow-inner"
        >
          {/* Store Branding Header */}
          <div className="text-center border-b border-dashed border-slate-400 pb-3">
            <h2 className="text-base font-black tracking-wider uppercase text-slate-950">
              SCAN & BILL SUPERMARKET
            </h2>
            <p className="text-[10px] text-slate-600">Smart Express Checkout Counter #02</p>
            <p className="text-[10px] text-slate-500">GSTIN: 27AABCS1429B1Z | Tel: +91 98765 43210</p>
          </div>

          {/* Meta Info */}
          <div className="mt-2.5 flex justify-between text-[11px] border-b border-dashed border-slate-300 pb-2">
            <div>
              <div><span className="font-semibold">Invoice:</span> {invoiceNumber}</div>
              <div><span className="font-semibold">Cashier:</span> Terminal POS</div>
            </div>
            <div className="text-right">
              <div><span className="font-semibold">Date:</span> {currentDate}</div>
              <div><span className="font-semibold">Mode:</span> UPI / Card</div>
            </div>
          </div>

          {/* Table Header */}
          <div className="mt-3 border-b border-slate-900 pb-1 text-[11px] font-bold">
            <div className="flex justify-between">
              <span className="w-1/2">ITEM / BARCODE</span>
              <span className="w-1/6 text-center">RATE</span>
              <span className="w-1/6 text-center">QTY</span>
              <span className="w-1/6 text-right">AMT</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="divide-y divide-dashed divide-slate-200 py-1">
            {items.map((it) => (
              <div key={it._id} className="flex justify-between py-1.5 text-[11px]">
                <div className="w-1/2 pr-1">
                  <div className="font-semibold truncate text-slate-900">{it.name}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{it.barcode}</div>
                </div>
                <div className="w-1/6 text-center pt-0.5">₹{it.price}</div>
                <div className="w-1/6 text-center pt-0.5 font-semibold">x{it.quantity}</div>
                <div className="w-1/6 text-right pt-0.5 font-bold">₹{it.subtotal}</div>
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="mt-2 border-t-2 border-slate-900 pt-2 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>Items Total ({items.length} lines):</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[10px]">
              <span>CGST (2.5%):</span>
              <span>₹{(gstAmount / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[10px]">
              <span>SGST (2.5%):</span>
              <span>₹{(gstAmount / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-900 pt-1.5 text-sm font-black text-slate-950">
              <span>GRAND TOTAL:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer Barcode Stamp */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-400 text-center">
            <div className="mx-auto flex justify-center py-1">
              <div className="h-9 w-48 bg-[repeating-linear-gradient(90deg,#111_0px,#111_2px,#fff_2px,#fff_4px,#111_4px,#111_7px,#fff_7px,#fff_9px,#111_9px,#111_13px)] opacity-85" />
            </div>
            <p className="mt-1 font-mono text-[9px] text-slate-500">{invoiceNumber}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-800">
              THANK YOU FOR SHOPPING WITH US!
            </p>
          </div>
        </div>

        {/* Bottom Actions (Hidden when printing) */}
        <div className="no-print mt-5 flex items-center justify-between">
          <button
            onClick={onNewBill}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Customer / Clear Cart
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
