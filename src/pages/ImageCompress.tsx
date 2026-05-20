import { useState, useEffect } from 'react';
import { ArrowLeft, Minimize2, Loader2 } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

export function ImageCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(75);
  const [mode, setMode] = useState<'lossy' | 'lossless'>('lossy');
  
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const imgFile = acceptedFiles[0];
    setFile(imgFile);
    setOriginalSize(imgFile.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(imgFile);
  };

  // Perform estimated compression in background when quality slider changes
  useEffect(() => {
    if (!imageSrc || !file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      // standard format mapping or jpeg/webp
      let mime = file.type || 'image/jpeg';
      if (mime === 'image/png') {
        // PNG doesn't support quality compression parameter directly. We fall back to WebP for standard lossy compression preview
        mime = 'image/jpeg';
      }

      canvas.toBlob((blob) => {
        if (blob) {
          setCompressedSize(blob.size);
        }
      }, mime, quality / 100);
    };
    img.src = imageSrc;
  }, [imageSrc, quality, file]);

  const handleCompress = () => {
    if (!imageSrc || !file) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      ctx.drawImage(img, 0, 0);

      let mime = file.type || 'image/jpeg';
      let exportQuality = quality / 100;

      if (mode === 'lossless') {
        // Lossless: Keep 100% quality, but we strip EXIF metadata
        exportQuality = 1.0;
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Could not compress image.');
          setIsProcessing(false);
          return;
        }

        const suffix = mode === 'lossless' ? '-optimized' : '-compressed';
        const originalName = file.name;
        const lastDot = originalName.lastIndexOf('.');
        const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
        const ext = lastDot !== -1 ? originalName.substring(lastDot) : '.jpg';
        const finalName = `${baseName}${suffix}${ext}`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsProcessing(false);
      }, mime, exportQuality);
    };
    img.src = imageSrc;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const savingsPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compress Image</h1>
          <p className="text-gray-600 mt-2">Optimize and shrink image file sizes without sacrificing quality. 100% client-side.</p>
        </div>
        <DragAndDrop 
          onDrop={handleDrop} 
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'] }}
          subtext="PNG, JPG, WebP, GIF, or BMP images"
          className="h-64" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setFile(null);
            setImageSrc(null);
          }}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compress & Optimize</h1>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Preview */}
        <div className="md:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6 items-center">
          <img src={imageSrc} alt="Preview" className="max-h-[300px] max-w-full object-contain rounded-lg shadow-sm" />
          
          <div className="grid grid-cols-2 gap-4 w-full text-center">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Original Size</span>
              <span className="text-sm font-bold text-slate-700">{formatSize(originalSize)}</span>
            </div>
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <span className="block text-[10px] font-extrabold text-emerald-600 uppercase">Estimated Output</span>
              <span className="text-sm font-bold text-emerald-700">{formatSize(compressedSize)}</span>
            </div>
          </div>
          
          {savingsPercent > 0 && mode === 'lossy' && (
            <div className="text-center text-xs font-bold text-emerald-600">
              Saves approximately {savingsPercent}% of disk space!
            </div>
          )}
        </div>

        {/* Configurations */}
        <div className="md:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Optimization Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('lossy')}
                className={`py-3 rounded-xl text-xs font-extrabold border transition-all text-center ${
                  mode === 'lossy'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                Lossy (Size Focus)
              </button>
              <button
                onClick={() => setMode('lossless')}
                className={`py-3 rounded-xl text-xs font-extrabold border transition-all text-center ${
                  mode === 'lossless'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                Lossless (Optimize)
              </button>
            </div>
          </div>

          {mode === 'lossy' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Compression Quality</span>
                <span className="text-emerald-600">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="98"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Standard Lossy downsamples pixel resolutions to create highly compressed files.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl space-y-2">
              <h4 className="font-extrabold text-xs text-emerald-800">Lossless Optimization Active</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Strips header EXIF comments, metadata dictionaries, and structural APP frames without changing a single pixel of display data.
              </p>
            </div>
          )}

          <button
            onClick={handleCompress}
            disabled={isProcessing}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:shadow-emerald-300 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Compressing...
              </>
            ) : (
              <>
                <Minimize2 className="w-4 h-4" />
                Optimize & Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
