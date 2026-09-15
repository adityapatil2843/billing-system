'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Barcode as BarcodeIcon,
  Search,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { playScanBeep } from '../lib/audio';
import { TestBarcode } from '../lib/types';

const SEEDED_BARCODES: TestBarcode[] = [
  { barcode: '8901234567890', name: 'Maggi 2-Min Noodles', category: 'Instant Food', price: 14, exists: true },
  { barcode: '8906012345678', name: 'Good Day Cookies', category: 'Biscuits', price: 30, exists: true },
  { barcode: '8901063012345', name: 'Amul Taaza Milk', category: 'Dairy', price: 28, exists: true },
  { barcode: '8901725189234', name: 'Tata Salt 1kg', category: 'Grocery', price: 30, exists: true },
  { barcode: '8906001234567', name: 'Lays Classic Salted', category: 'Snacks', price: 20, exists: true },
  { barcode: '8901138812345', name: 'Colgate Strong Teeth', category: 'Personal Care', price: 95, exists: true },
  { barcode: '9780812968255', name: 'Meditation Book', category: 'Book', price: 700, exists: true },
  { barcode: '0000000000000', name: 'Unregistered Barcode', category: 'Test Item', price: 0, exists: false },
];

interface ScannerSectionProps {
  onBarcodeScanned: (barcode: string) => void;
  isSearching: boolean;
}

export const ScannerSection: React.FC<ScannerSectionProps> = ({
  onBarcodeScanned,
  isSearching,
}) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for native BarcodeDetector API in modern browsers
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      setHasBarcodeDetector(true);
      try {
        // @ts-ignore
        detectorRef.current = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
      } catch (err) {
        console.warn('BarcodeDetector initialization warning:', err);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);

      // Start continuous detection loop if BarcodeDetector is available
      if (detectorRef.current) {
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2 || isSearching) return;
          try {
            const barcodes = await detectorRef.current.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code && code.trim()) {
                playScanBeep();
                onBarcodeScanned(code.trim());
              }
            }
          } catch (e) {
            // Frame skip
          }
        }, 400);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Unable to access camera. Please check browser permissions.');
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim() || isSearching) return;
    playScanBeep();
    onBarcodeScanned(manualBarcode.trim());
    setManualBarcode('');
  };

  const handleTestBarcodeClick = (barcode: string) => {
    playScanBeep();
    onBarcodeScanned(barcode);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarcodeIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Interactive Scanner</h2>
            <p className="text-xs text-slate-400">Scan physical barcode or choose instant test presets</p>
          </div>
        </div>

        {/* Camera Toggle Button */}
        <button
          onClick={isCameraActive ? stopCamera : startCamera}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            isCameraActive
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
          }`}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="h-4 w-4" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Open Camera Scanner
            </>
          )}
        </button>
      </div>

      {/* Camera Viewfinder (when active) */}
      {isCameraActive && (
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-cyan-500/30 bg-black aspect-video max-h-[280px] w-full flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          {/* Viewfinder Target & Laser Animation */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-44 w-64 rounded-xl border-2 border-dashed border-cyan-400/80 bg-cyan-500/5 shadow-2xl">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 h-5 w-5 border-t-2 border-l-2 border-cyan-300" />
              <div className="absolute -top-1 -right-1 h-5 w-5 border-t-2 border-r-2 border-cyan-300" />
              <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-cyan-300" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-cyan-300" />

              {/* Sweeping Laser Line */}
              <div className="animate-laser absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-md text-[11px] text-cyan-200">
            <span>Center the barcode in the frame</span>
            {hasBarcodeDetector ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap className="h-3 w-3" /> Auto-detect active
              </span>
            ) : (
              <span className="text-amber-400">Manual trigger ready</span>
            )}
          </div>
        </div>
      )}

      {cameraError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Manual Input Form */}
      <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <BarcodeIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="Type or paste barcode number (e.g. 8901234567890)..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <button
          type="submit"
          disabled={!manualBarcode.trim() || isSearching}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          {isSearching ? 'Looking up...' : 'Lookup'}
        </button>
      </form>

      {/* Quick Test Barcode Chips */}
      <div className="mt-5 border-t border-slate-800/80 pt-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Instant Test Barcodes (1-Click Verification)</span>
          </div>
          <span className="text-[11px] text-slate-500">Seeded in MongoDB</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SEEDED_BARCODES.map((item) => (
            <button
              key={item.barcode}
              type="button"
              onClick={() => handleTestBarcodeClick(item.barcode)}
              disabled={isSearching}
              className={`group flex flex-col items-start rounded-xl border p-2.5 text-left transition-all hover:scale-[1.02] ${
                item.exists
                  ? 'border-slate-800 bg-slate-950/80 hover:border-indigo-500/40 hover:bg-slate-900'
                  : 'border-dashed border-rose-800/50 bg-rose-950/20 hover:border-rose-500 hover:bg-rose-950/30'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-medium text-white group-hover:text-indigo-300 line-clamp-1">
                  {item.name}
                </span>
                {item.exists ? (
                  <span className="text-[10px] font-bold text-emerald-400">
                    ₹{item.price}
                  </span>
                ) : (
                  <span className="text-[9px] uppercase font-bold text-rose-400">
                    Not Added
                  </span>
                )}
              </div>
              <div className="mt-1 flex w-full items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{item.barcode.slice(0, 7)}...</span>
                <span className="text-[9px] text-slate-400">{item.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
