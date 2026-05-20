import { useState } from 'react';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

export function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('png');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const imgFile = acceptedFiles[0];
    setFile(imgFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(imgFile);
  };

  const handleConvert = () => {
    if (!imageSrc || !file) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        alert('Could not initialize conversion canvas.');
        setIsProcessing(false);
        return;
      }

      // Draw original image onto canvas
      ctx.drawImage(img, 0, 0);

      // Determine mime-type
      const mimeMap: Record<string, string> = {
        png: 'image/png',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
        bmp: 'image/bmp',
        gif: 'image/gif'
      };

      const mimeType = mimeMap[targetFormat] || 'image/png';

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate converted image.');
          setIsProcessing(false);
          return;
        }

        const originalName = file.name;
        const lastDot = originalName.lastIndexOf('.');
        const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
        const finalName = `${baseName}.${targetFormat}`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsProcessing(false);
      }, mimeType, 0.95);
    };

    img.onerror = () => {
      alert('Error loading image source.');
      setIsProcessing(false);
    };

    img.src = imageSrc;
  };

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Image Converter</h1>
          <p className="text-gray-600 mt-2">Convert your photos to PNG, JPEG, WebP, BMP, or GIF offline. 100% secure.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Convert Image</h1>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Preview Area */}
        <div className="md:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[300px] max-h-[450px]">
          <img src={imageSrc} alt="Preview" className="max-h-[400px] max-w-full object-contain rounded-lg shadow-sm" />
        </div>

        {/* Options */}
        <div className="md:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Target Format</label>
            <div className="grid grid-cols-2 gap-2">
              {['png', 'jpeg', 'webp', 'bmp', 'gif'].map((format) => (
                <button
                  key={format}
                  onClick={() => setTargetFormat(format)}
                  className={`py-3 rounded-xl text-xs font-extrabold border transition-all text-center uppercase ${
                    targetFormat === format
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={isProcessing}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:shadow-emerald-300 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Convert & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
