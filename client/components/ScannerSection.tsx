'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Barcode as BarcodeIcon,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Upload,
  SwitchCamera,
  Flashlight,
  FlashlightOff,
  Image as ImageIcon,
} from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
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
  const [cameraError, setCameraError] = useState<{ message: string; isPermission?: boolean; isInsecure?: boolean } | null>(null);
  const [activeEngine, setActiveEngine] = useState<'Native API' | 'ZXing Optical' | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isDecodingFile, setIsDecodingFile] = useState(false);
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const nativeDetectorRef = useRef<any>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check device capabilities on mount
  useEffect(() => {
    // Check Native BarcodeDetector API
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        // @ts-ignore
        nativeDetectorRef.current = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
      } catch (err) {
        console.warn('Native BarcodeDetector not available:', err);
      }
    }

    // Initialize ZXing Reader
    zxingReaderRef.current = new BrowserMultiFormatReader();

    // Query cameras if mediaDevices is supported
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCameraId) {
          // Prefer back/environment camera if available
          const backCam = videoDevices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
        }
      }).catch(() => {});
    }
  }, [selectedCameraId]);

  // Handle successful scan with sound & debouncing
  const handleScanFound = useCallback((rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const now = Date.now();
    // Debounce: don't trigger the same barcode within 2 seconds, or any scan within 800ms
    if (
      code === lastScannedCodeRef.current &&
      now - lastScannedTimeRef.current < 2000
    ) {
      return;
    }
    if (now - lastScannedTimeRef.current < 800) {
      return;
    }

    lastScannedTimeRef.current = now;
    lastScannedCodeRef.current = code;

    playScanBeep();
    setScanSuccessFeedback(`Detected: ${code}`);
    setTimeout(() => setScanSuccessFeedback(null), 2500);

    onBarcodeScanned(code);
  }, [onBarcodeScanned]);

  // Stop camera stream & readers
  const stopCamera = useCallback(() => {
    if (zxingControlsRef.current) {
      zxingControlsRef.current.stop();
      zxingControlsRef.current = null;
    }
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
    setIsTorchOn(false);
    setTorchAvailable(false);
    setIsCameraActive(false);
    setActiveEngine(null);
  }, []);

  // Start camera stream
  const startCamera = async (deviceIdToUse?: string) => {
    setCameraError(null);
    stopCamera();

    // 1. Check if mediaDevices is supported in current context
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isInsecure = typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost';
      setCameraError({
        message: isInsecure
          ? 'Browsers restrict camera access over unencrypted HTTP. To use live camera on mobile, open via HTTPS or localhost. Alternatively, use the "Snap / Upload Photo" button below!'
          : 'Camera access API (navigator.mediaDevices) is not supported in this browser.',
        isInsecure,
      });
      return;
    }

    try {
      let stream: MediaStream | null = null;
      const targetDeviceId = deviceIdToUse || selectedCameraId;

      // Primary constraint attempt
      try {
        const constraints: MediaStreamConstraints = {
          video: targetDeviceId
            ? { deviceId: { exact: targetDeviceId } }
            : {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        console.warn('Strict constraints failed, falling back to default video stream:', err);
        // Fallback constraint attempt (works on all webcams and laptops)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (!stream) {
        throw new Error('Failed to acquire video stream');
      }

      streamRef.current = stream;

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setTorchAvailable(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);

      // 2. Start detection loop: Use native BarcodeDetector if available, otherwise fallback to ZXing
      if (nativeDetectorRef.current && videoRef.current) {
        setActiveEngine('Native API');
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2 || isSearching) return;
          try {
            const barcodes = await nativeDetectorRef.current.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code && code.trim()) {
                handleScanFound(code.trim());
              }
            }
          } catch {
            // Frame skip
          }
        }, 300);
      } else if (zxingReaderRef.current && videoRef.current) {
        // Universal ZXing Browser Multi-Format Decoder
        setActiveEngine('ZXing Optical');
        try {
          const controls = await zxingReaderRef.current.decodeFromStream(
            stream,
            videoRef.current,
            (result, error) => {
              if (result && !isSearching) {
                const text = result.getText();
                if (text && text.trim()) {
                  handleScanFound(text.trim());
                }
              }
            }
          );
          zxingControlsRef.current = controls;
        } catch (zxingErr) {
          console.warn('ZXing stream decode initialization issue:', zxingErr);
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errMsg = err.message || 'Unable to open camera.';
      let isPerm = false;

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was denied. Please click the lock/settings icon in your browser address bar, allow camera permissions, and try again.';
        isPerm = true;
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No video camera detected on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Camera is already in use by another application or browser tab.';
      } else if (err.name === 'OverconstrainedError') {
        errMsg = 'The requested camera settings are not supported on this device.';
      }

      setCameraError({
        message: errMsg,
        isPermission: isPerm,
      });
      setIsCameraActive(false);
    }
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await (track.applyConstraints as any)({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Switch Camera device
  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCam = availableCameras[nextIndex];
    setSelectedCameraId(nextCam.deviceId);
    if (isCameraActive) {
      await startCamera(nextCam.deviceId);
    }
  };

  // Handle Photo / File Barcode Decoding
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    setCameraError(null);

    try {
      const imageUrl = URL.createObjectURL(file);
      let foundCode: string | null = null;

      // 1. Try ZXing Browser reader from image URL
      if (zxingReaderRef.current) {
        try {
          const result = await zxingReaderRef.current.decodeFromImageUrl(imageUrl);
          if (result && result.getText()) {
            foundCode = result.getText();
          }
        } catch {
          // Fall through
        }
      }

      // 2. Try Native BarcodeDetector if ZXing didn't catch or not yet run
      if (!foundCode && nativeDetectorRef.current) {
        try {
          const img = new Image();
          img.src = imageUrl;
          await img.decode();
          const barcodes = await nativeDetectorRef.current.detect(img);
          if (barcodes && barcodes.length > 0) {
            foundCode = barcodes[0].rawValue;
          }
        } catch {
          // Fall through
        }
      }

      URL.revokeObjectURL(imageUrl);

      if (foundCode) {
        handleScanFound(foundCode);
      } else {
        setCameraError({
          message: 'No readable barcode found in the uploaded image. Please ensure the barcode is sharp, well-lit, and in focus.',
        });
      }
    } catch (err: any) {
      setCameraError({
        message: err.message || 'Failed to process image file.',
      });
    } finally {
      setIsDecodingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    handleScanFound(manualBarcode.trim());
    setManualBarcode('');
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
            <BarcodeIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Interactive Scanner</span>
              {activeEngine && (
                <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-800/60">
                  {activeEngine}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Live camera, instant photo snapshot, or manual input
            </p>
          </div>
        </div>

        {/* Camera Control Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Snap / Upload Photo Input (Fallback for HTTP / mobile) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileScan}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDecodingFile || isSearching}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
            title="Take a photo or upload an image with barcode"
          >
            <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
            <span>{isDecodingFile ? 'Decoding...' : 'Snap Photo'}</span>
          </button>

          {/* Toggle Live Camera */}
          <button
            type="button"
            onClick={isCameraActive ? stopCamera : () => startCamera()}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shadow-md ${
              isCameraActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="h-3.5 w-3.5" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" />
                <span>Live Camera</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Scan Feedback Flash */}
      {scanSuccessFeedback && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/80 px-4 py-2.5 text-xs text-emerald-200 shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">{scanSuccessFeedback}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Scanned</span>
        </div>
      )}

      {/* Live Camera Viewfinder */}
      {isCameraActive && (
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-cyan-500/40 bg-black aspect-video max-h-[300px] w-full flex items-center justify-center shadow-2xl">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full object-cover"
          />

          {/* Viewfinder Target Frame & Laser Animation */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-40 w-60 sm:h-44 sm:w-72 rounded-xl border-2 border-dashed border-cyan-400/80 bg-cyan-500/5 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              {/* Corner brackets */}
              <div className="absolute -top-1.5 -left-1.5 h-6 w-6 border-t-3 border-l-3 border-cyan-300 rounded-tl" />
              <div className="absolute -top-1.5 -right-1.5 h-6 w-6 border-t-3 border-r-3 border-cyan-300 rounded-tr" />
              <div className="absolute -bottom-1.5 -left-1.5 h-6 w-6 border-b-3 border-l-3 border-cyan-300 rounded-bl" />
              <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 border-b-3 border-r-3 border-cyan-300 rounded-br" />

              {/* Sweeping Laser Line */}
              <div className="animate-laser absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444]" />
            </div>
          </div>

          {/* On-Screen Camera Controls (Switch camera, Torch) */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {torchAvailable && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/50'
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                title="Toggle Torch / Flashlight"
              >
                {isTorchOn ? <Flashlight className="h-4 w-4" /> : <FlashlightOff className="h-4 w-4" />}
              </button>
            )}

            {availableCameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition"
                title="Switch Camera (Front/Rear)"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Bottom Viewfinder Info Bar */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-black/75 px-3 py-1.5 backdrop-blur-md text-[11px] text-cyan-200">
            <span>Center barcode within frame</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Zap className="h-3 w-3 animate-pulse" /> Auto-detect active
            </span>
          </div>
        </div>
      )}

      {/* Camera Error / Permission Notice */}
      {cameraError && (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-300">Camera Notice</p>
              <p className="mt-0.5 leading-relaxed text-rose-200">{cameraError.message}</p>
            </div>
          </div>

          {cameraError.isInsecure && (
            <div className="rounded-lg bg-slate-950/70 p-2.5 text-[11px] text-slate-300 border border-slate-800">
              <p className="font-semibold text-amber-300 mb-1">💡 Mobile Tip:</p>
              <p>
                Mobile browsers disable webcam streams over HTTP. You can either tap{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-bold text-cyan-400 underline hover:text-cyan-300"
                >
                  Snap Photo
                </button>{' '}
                to use your phone camera, or set up HTTPS / localhost.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Barcode Input Form */}
      <form onSubmit={handleManualSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <BarcodeIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            inputMode="numeric"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="Type or paste barcode number (e.g. 8901234567890)..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <button
          type="submit"
          disabled={!manualBarcode.trim() || isSearching}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 disabled:opacity-50 min-h-[42px]"
        >
          <Search className="h-4 w-4" />
          <span>{isSearching ? 'Looking up...' : 'Lookup'}</span>
        </button>
      </form>

      {/* Quick Test Barcode Chips */}
      <div className="mt-5 border-t border-slate-800/80 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Instant Test Presets (1-Click)</span>
          </div>
          <span className="text-[10px] text-slate-500">Tap to simulate barcode scan</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SEEDED_BARCODES.map((item) => (
            <button
              key={item.barcode}
              type="button"
              onClick={() => handleScanFound(item.barcode)}
              disabled={isSearching}
              className={`group flex flex-col items-start rounded-xl border p-2.5 text-left transition-all active:scale-95 hover:scale-[1.02] ${
                item.exists
                  ? 'border-slate-800 bg-slate-950/80 hover:border-indigo-500/40 hover:bg-slate-900'
                  : 'border-dashed border-rose-800/50 bg-rose-950/20 hover:border-rose-500 hover:bg-rose-950/30'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-semibold text-white group-hover:text-indigo-300 line-clamp-1">
                  {item.name}
                </span>
                {item.exists ? (
                  <span className="text-[10px] font-bold text-emerald-400">
                    ₹{item.price}
                  </span>
                ) : (
                  <span className="text-[8px] uppercase font-bold text-rose-400">
                    New
                  </span>
                )}
              </div>
              <div className="mt-1 flex w-full items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{item.barcode.slice(0, 7)}...</span>
                <span className="text-[9px] text-slate-400 truncate max-w-[65px]">{item.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
