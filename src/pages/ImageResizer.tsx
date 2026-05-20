import { useState } from 'react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

interface Size {
  width: number;
  height: number;
}

export function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Resize settings
  const [originalSize, setOriginalSize] = useState<Size>({ width: 0, height: 0 });
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [outputFormat, setOutputFormat] = useState('original');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const imgFile = acceptedFiles[0];
    setFile(imgFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const src = e.target.result as string;
        setImageSrc(src);

        const img = new Image();
        img.onload = () => {
          setImageElement(img);
          setOriginalSize({ width: img.width, height: img.height });
          setWidth(img.width);
          setHeight(img.height);
        };
        img.src = src;
      }
    };
    reader.readAsDataURL(imgFile);
  };

  const handleScalePreset = (percent: number) => {
    if (!originalSize.width) return;
    const factor = percent / 100;
    setWidth(Math.round(originalSize.width * factor));
    setHeight(Math.round(originalSize.height * factor));
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockRatio && originalSize.width > 0) {
      const ratio = originalSize.height / originalSize.width;
      setHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockRatio && originalSize.height > 0) {
      const ratio = originalSize.width / originalSize.height;
      setWidth(Math.round(val * ratio));
    }
  };

  const handleDownload = () => {
    if (!imageElement || !file) return;
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        alert('Canvas error');
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(imageElement, 0, 0, width, height);

      let mimeType = file.type || 'image/png';
      if (outputFormat === 'png') mimeType = 'image/png';
      if (outputFormat === 'jpeg') mimeType = 'image/jpeg';
      if (outputFormat === 'webp') mimeType = 'image/webp';

      const originalName = file.name;
      const lastDot = originalName.lastIndexOf('.');
      const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
      const ext = mimeType.split('/')[1];
      const finalName = `${baseName}-${width}x${height}.${ext}`;

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob export error');
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
    } catch (err) {
      console.error(err);
      alert('Failed to resize image.');
      setIsProcessing(false);
    }
  };

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Image Resizer</h1>
          <p className="text-gray-600 mt-2">Adjust photo dimensions by scale factors or exact pixel boundaries. 100% offline.</p>
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
            setImageElement(null);
          }}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resize Image</h1>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Preview image */}
        <div className="md:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4 items-center">
          <img src={imageSrc} alt="Preview" className="max-h-[320px] max-w-full object-contain rounded-lg shadow-sm" />
          <div className="text-center">
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Original Dimensions</span>
            <span className="text-xs font-bold text-slate-700">{originalSize.width} × {originalSize.height} px</span>
          </div>
        </div>

        {/* Resizing controls */}
        <div className="md:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Dimensions (px)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500">Width</label>
                <input
                  type="number"
                  value={width || ''}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500">Height</label>
                <input
                  type="number"
                  value={height || ''}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lockRatio}
                onChange={(e) => setLockRatio(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-200"
              />
              <span>Lock Aspect Ratio</span>
            </label>
          </div>

          {/* Preset buttons */}
          <div className="space-y-2 pt-3 border-t border-slate-50">
            <label className="block text-[10px] font-bold text-slate-500">Preset Scaling</label>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 200].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleScalePreset(percent)}
                  className="py-2 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl text-[10px] font-bold transition-all"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-50">
            <label className="block text-[10px] font-bold text-slate-500">Format</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:border-emerald-300"
            >
              <option value="original">Original Format</option>
              <option value="png">PNG Format</option>
              <option value="jpeg">JPEG Format</option>
              <option value="webp">WebP Format</option>
            </select>
          </div>

          <button
            onClick={handleDownload}
            disabled={isProcessing || !width || !height}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:shadow-emerald-300 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resizing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Apply Resize & Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
