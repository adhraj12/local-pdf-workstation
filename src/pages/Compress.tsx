import { useState } from 'react';
import { Loader2, FileText, Download, CheckCircle, Zap, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { compressPDF } from '../utils/pdf';
import { cn } from '../lib/utils';

export function Compress() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedPdf, setCompressedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionMode, setCompressionMode] = useState<'extreme' | 'medium' | 'low'>('medium');
  const [stats, setStats] = useState<{ original: number; compressed: number; isOptimized: boolean } | null>(null);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setCompressedPdf(null);
      setStats(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      // Brief delay to make the process feel robust
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = await compressPDF(file, compressionMode);
      
      const isOptimized = result.byteLength < file.size;
      
      // If compressed size is larger/equal, we fallback to the original file
      if (isOptimized) {
        setCompressedPdf(result);
        setStats({
          original: file.size,
          compressed: result.byteLength,
          isOptimized: true
        });
      } else {
        // Load original file bytes
        const originalBytes = new Uint8Array(await file.arrayBuffer());
        setCompressedPdf(originalBytes);
        setStats({
          original: file.size,
          compressed: file.size,
          isOptimized: false
        });
      }
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('Failed to compress PDF. Please verify that it is a valid PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedPdf || !file) return;

    const blob = new Blob([compressedPdf as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed-${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleReset = () => {
    setFile(null);
    setCompressedPdf(null);
    setStats(null);
  };

  if (!file) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compress PDF</h1>
          <p className="text-gray-600 mt-2">Optimize and reduce PDF file size while keeping high visual quality. 100% offline.</p>
        </div>
        <DragAndDrop 
          onDrop={handleDrop} 
          accept={{ 'application/pdf': ['.pdf'] }}
          subtext="Select any PDF document to get started"
          className="h-64" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compress PDF</h1>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{file.name}</p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Choose Another PDF
        </button>
      </div>

      {/* Selected File Details */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{file.name}</p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{formatSize(file.size)}</p>
        </div>
      </div>

      {/* Compression Level Presets */}
      {!compressedPdf && !isProcessing && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Select Compression Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Extreme */}
            <button
              onClick={() => setCompressionMode('extreme')}
              className={cn(
                "p-5 rounded-2xl border text-left transition-all flex flex-col gap-3 group relative overflow-hidden",
                compressionMode === 'extreme'
                  ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl w-fit transition-all",
                compressionMode === 'extreme' ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
              )}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Extreme Compression</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Low image quality, maximum size reduction. Perfect for email attachments and text documents.
                </p>
              </div>
            </button>

            {/* Recommended */}
            <button
              onClick={() => setCompressionMode('medium')}
              className={cn(
                "p-5 rounded-2xl border text-left transition-all flex flex-col gap-3 group relative overflow-hidden",
                compressionMode === 'medium'
                  ? "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl w-fit transition-all",
                compressionMode === 'medium' ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
              )}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Recommended</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Good image quality, optimal size reduction. The perfect balance for screen viewing and presentations.
                </p>
              </div>
            </button>

            {/* Low Compression */}
            <button
              onClick={() => setCompressionMode('low')}
              className={cn(
                "p-5 rounded-2xl border text-left transition-all flex flex-col gap-3 group relative overflow-hidden",
                compressionMode === 'low'
                  ? "border-slate-700 bg-slate-50 ring-1 ring-slate-700"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl w-fit transition-all",
                compressionMode === 'low' ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
              )}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Less Compression</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  High image quality, less size reduction. Best choice for archiving high-resolution prints.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Loading processing state */}
      {isProcessing && (
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <div className="text-center">
            <p className="font-bold text-slate-800">Compressing PDF...</p>
            <p className="text-xs text-slate-400 mt-1">This runs entirely offline. Re-encoding image streams can take a few seconds.</p>
          </div>
        </div>
      )}

      {/* Completed Stats Banner */}
      {stats && (
        <div className={cn(
          "rounded-2xl p-6 flex items-start gap-4 border",
          stats.isOptimized
            ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
            : "bg-amber-50/50 border-amber-100 text-amber-800"
        )}>
          <div className={cn(
            "p-2 rounded-full shrink-0",
            stats.isOptimized ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
          )}>
            {stats.isOptimized ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <p className="font-bold text-sm">
              {stats.isOptimized ? "Compression Complete!" : "PDF Already Fully Optimized!"}
            </p>
            <p className="text-xs mt-1 leading-relaxed">
              {stats.isOptimized ? (
                <>
                  Successfully reduced PDF file size from <strong className="text-emerald-900">{formatSize(stats.original)}</strong> to{' '}
                  <strong className="text-emerald-900">{formatSize(stats.compressed)}</strong> (
                  <span className="font-bold text-emerald-900">
                    {Math.round((1 - stats.compressed / stats.original) * 100)}% smaller
                  </span>
                  ).
                </>
              ) : (
                <>
                  Your document size is already at its optimal limit (<strong className="text-amber-900">{formatSize(stats.original)}</strong>).
                  We preserved the original file to prevent any size increase.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Lower Buttons */}
      <div className="flex gap-4">
        {!compressedPdf ? (
          !isProcessing && (
            <button
              onClick={handleCompress}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all hover:bg-indigo-700 hover:shadow-indigo-300"
            >
              Compress PDF
            </button>
          )
        ) : (
          <button
            onClick={handleDownload}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:bg-emerald-700 hover:shadow-emerald-300"
          >
            <Download className="w-4 h-4" />
            Download Compressed PDF
          </button>
        )}
      </div>
    </div>
  );
}
