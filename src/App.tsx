/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Upload, 
  History as HistoryIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Scan,
  Loader2,
  X,
  Construction,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Detection {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  label: string;
  confidence: number;
}

interface Summary {
  compliant: number;
  violations: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
}

interface AnalysisResult {
  detections: Detection[];
  summary: Summary;
  timestamp: string;
  imageUrl: string;
}

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setResults(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;
    
    setIsScanning(true);
    setError(null);

    try {
      // Split base64 to get data and mimeType
      const [header, base64Data] = selectedImage.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          mimeType: mimeType,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed. Please try again.');
      }

      const data = await response.json();
      
      const newResult: AnalysisResult = {
        ...data,
        timestamp: new Date().toLocaleTimeString(),
        imageUrl: selectedImage,
      };

      // Add delay to appreciate the scanning animation
      setTimeout(() => {
        setResults(newResult);
        setHistory(prev => [newResult, ...prev].slice(0, 5));
        setIsScanning(false);
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setIsScanning(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-yellow-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Construction className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight uppercase">Aegis <span className="text-yellow-500">AI</span></h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Orbital Safety System v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">System Status</span>
                <span className="text-xs font-mono text-green-500 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  OPERATIONAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Analysis Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center overflow-hidden
              ${selectedImage ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-800 hover:border-yellow-500/50 bg-zinc-900/30'}
            `}
          >
            {selectedImage ? (
              <div className="relative w-full h-full group">
                <img 
                  src={selectedImage} 
                  alt="Upload preview" 
                  className="w-full h-full object-contain"
                />
                
                {/* Laser Scan Animation */}
                <AnimatePresence>
                  {isScanning && (
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent z-10 shadow-[0_0_15px_rgba(234,179,8,0.8)]"
                    />
                  )}
                </AnimatePresence>

                {/* Bounding Boxes */}
                {!isScanning && results && results.detections.map((det, idx) => {
                  const [ymin, xmin, ymax, xmax] = det.box_2d;
                  const isHelmet = det.label === 'helmet' || det.label === 'Hard hat' || det.label === 'Helmet';
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      style={{
                        position: 'absolute',
                        top: `${ymin / 10}%`,
                        left: `${xmin / 10}%`,
                        width: `${(xmax - xmin) / 10}%`,
                        height: `${(ymax - ymin) / 10}%`,
                      }}
                      className={`border-2 group/box ${isHelmet ? 'border-green-500' : 'border-red-500'}`}
                    >
                      <div className={`absolute -top-6 left-0 px-2 py-0.5 text-[10px] font-bold font-mono uppercase whitespace-nowrap flex items-center gap-2
                        ${isHelmet ? 'bg-green-500 text-green-950' : 'bg-red-500 text-red-950'}
                      `}>
                        <span>{isHelmet ? 'Helmet' : 'Violation'}</span>
                        <span className="opacity-70 text-[8px]">{(det.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Overlay Controls */}
                {!isScanning && (
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="p-2 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center p-8">
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                  <Upload className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Image Feed Required</h3>
                  <p className="text-zinc-500 max-w-xs mt-1">Upload a high-resolution safety inspection photo or drag and drop to begin.</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  SELECT ASSETS
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />
          </section>

          {/* Action Footer */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border ${error ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-800 border-zinc-700'}`}>
                {error ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <Info className="w-6 h-6 text-zinc-400" />}
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide">
                  {error ? 'Protocol Error' : 'System Ready'}
                </h4>
                <p className="text-xs text-zinc-500 font-mono">
                  {error || 'Upload an image and initialize scanning protocol to check compliance.'}
                </p>
              </div>
            </div>
            <button
              onClick={runAnalysis}
              disabled={!selectedImage || isScanning}
              className={`min-w-[180px] h-12 flex items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-widest text-xs transition-all
                ${!selectedImage || isScanning 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-95'}
              `}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ANALYZING
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  INITIALIZE SCAN
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Stats & History */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Real-time Stats */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Analysis Metrics</h3>
            </div>
            <div className="p-6 flex flex-col gap-6">
              {results ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">Compliant</p>
                      <p className="text-2xl font-bold font-mono text-green-500">
                        {results.summary.compliant.toString().padStart(2, '0')}
                      </p>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">Violations</p>
                      <p className="text-2xl font-bold font-mono text-red-500">
                        {results.summary.violations.toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl border flex items-center gap-4
                    ${results.summary.status === 'SAFE' ? 'bg-green-500/10 border-green-500/20' : 
                      results.summary.status === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'}
                  `}>
                    <div className={`p-2 rounded-lg 
                      ${results.summary.status === 'SAFE' ? 'bg-green-500/20' : 
                        results.summary.status === 'WARNING' ? 'bg-yellow-500/20' : 'bg-red-500/20'}
                    `}>
                       {results.summary.status === 'SAFE' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                        results.summary.status === 'WARNING' ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> : <ShieldAlert className="w-5 h-5 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">Protocol Delta</p>
                      <p className={`font-bold tracking-tight
                        ${results.summary.status === 'SAFE' ? 'text-green-500' : 
                          results.summary.status === 'WARNING' ? 'text-yellow-500' : 'text-red-500'}
                      `}>
                        {results.summary.status} STATUS
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center opacity-30">
                  <Scan className="w-12 h-12 mb-3" />
                  <p className="text-xs uppercase font-mono max-w-[160px]">Waiting for stream initialization</p>
                </div>
              )}
            </div>
          </div>

          {/* Scan History */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex-1 shadow-xl">
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-zinc-500" />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Log History</h3>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-500">{history.length}/5</span>
            </div>
            <div className="divide-y divide-zinc-800 overflow-y-auto max-h-[400px]">
              {history.length > 0 ? history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(item.imageUrl);
                    setResults(item);
                  }}
                  className="w-full p-4 flex items-center gap-4 hover:bg-zinc-800/50 transition-colors text-left group"
                >
                  <div className="w-12 h-12 rounded bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0">
                    <img src={item.imageUrl} alt="History thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-zinc-500">{item.timestamp}</span>
                      <span className={`text-[10px] font-bold uppercase
                        ${item.summary.status === 'SAFE' ? 'text-green-500' : item.summary.status === 'WARNING' ? 'text-yellow-500' : 'text-red-500'}
                      `}>
                        {item.summary.status}
                      </span>
                    </div>
                    <div className="text-xs font-medium flex items-center gap-2">
                      <span className="text-green-500">{item.summary.compliant} OK</span>
                      <span className="text-zinc-700">/</span>
                      <span className="text-red-500">{item.summary.violations} FAIL</span>
                    </div>
                  </div>
                </button>
              )) : (
                <div className="p-12 text-center text-zinc-600">
                  <p className="text-[10px] font-mono uppercase tracking-widest leading-loose">No entries recorded in current session log.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Grid Overlay Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
    </div>
  );
}

