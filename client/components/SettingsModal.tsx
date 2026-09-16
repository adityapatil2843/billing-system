'use client';

import React, { useState, useEffect } from 'react';
import { X, Server, Check, AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { getBaseApiUrl, getDefaultConfiguredApiUrl, setCustomApiUrl, resetApiUrl, api } from '../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency?: number;
  } | null>(null);

  const defaultApiUrl = getDefaultConfiguredApiUrl();

  useEffect(() => {
    if (isOpen) {
      setUrl(getBaseApiUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Temporarily test current input
      const cleanUrl = url.trim().replace(/\/+$/, '');
      const finalUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
      const start = Date.now();
      const res = await fetch(`${finalUrl}/health`, { signal: AbortSignal.timeout(6000) });
      const latency = Date.now() - start;
      if (res.ok) {
        setTestResult({
          success: true,
          message: `Connected successfully! Response time: ${latency}ms`,
          latency,
        });
      } else {
        setTestResult({
          success: false,
          message: `Server returned HTTP ${res.status}: ${res.statusText}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Unable to connect to specified backend endpoint. (Note: HTTPS sites cannot connect to HTTP endpoints due to mixed content)',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setCustomApiUrl(url);
    onSaved();
    onClose();
  };

  const handleReset = () => {
    resetApiUrl();
    setUrl(defaultApiUrl);
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Backend Connection</h2>
              <p className="text-xs text-slate-400">Configure Express API endpoint</p>
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
          <div>
            <label className="block text-xs font-medium text-slate-300">
              API Base URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-backend.onrender.com/api"
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Set your live production backend URL (e.g. <code className="rounded bg-slate-800 px-1 py-0.5 text-indigo-300">https://scan-bill-server.onrender.com/api</code>) or localhost.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUrl(defaultApiUrl)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white"
            >
              Default Config
            </button>
            <button
              type="button"
              onClick={() => setUrl('http://localhost:5000/api')}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white"
            >
              Localhost (5000)
            </button>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                testResult.success
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              )}
              <div>
                <p className="font-medium">{testResult.success ? 'Success' : 'Connection Failed'}</p>
                <p className="opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Default
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !url.trim()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
