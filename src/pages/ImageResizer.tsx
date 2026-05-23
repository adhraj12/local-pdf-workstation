import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Loader2, Move, RefreshCw } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

interface Size {
  width: number;
  height: number;
}

// Core drawing helper function to render correct sizing modes
function drawImageToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  w: number,
  h: number,
  mode: 'stretch' | 'contain' | 'cover',
  bgCol: string,
  isBgTrans: boolean,
  pX: number,
  pY: number
) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  if (mode === 'stretch') {
    ctx.drawImage(img, 0, 0, w, h);
  } else if (mode === 'contain') {
    // Fill background color if not transparent
    if (!isBgTrans) {
      ctx.fillStyle = bgCol;
      ctx.fillRect(0, 0, w, h);
    }

    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let drawW = w;
    let drawH = h;
    let dx = 0;
    let dy = 0;

    if (imgRatio > targetRatio) {
      // Image is wider than container ratio: fit width
      drawH = w / imgRatio;
      dy = (h - drawH) / 2;
    } else {
      // Image is taller than container ratio: fit height
      drawW = h * imgRatio;
      dx = (w - drawW) / 2;
    }

    ctx.drawImage(img, dx, dy, drawW, drawH);
  } else if (mode === 'cover') {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let drawW = w;
    let drawH = h;

    if (imgRatio > targetRatio) {
      // Image is wider than target: fit height, overflow width
      drawW = h * imgRatio;
    } else {
      // Image is taller than target: fit width, overflow height
      drawH = w / imgRatio;
    }

    const maxOffsetX = drawW - w;
    const maxOffsetY = drawH - h;

    // Compute offset from pan percentage
    const offsetX = maxOffsetX > 0 ? (pX / 100) * maxOffsetX : 0;
    const offsetY = maxOffsetY > 0 ? (pY / 100) * maxOffsetY : 0;

    ctx.drawImage(img, -offsetX, -offsetY, drawW, drawH);
  }
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

  // New features
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover' | 'stretch'>('contain');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgTransparent, setBgTransparent] = useState(false);
  const [panX, setPanX] = useState(50); // percentage (0-100)
  const [panY, setPanY] = useState(50); // percentage (0-100)

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 50, panY: 50 });

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
          setPanX(50);
          setPanY(50);
        };
        img.src = src;
      }
    };
    reader.readAsDataURL(imgFile);
  };

  // Draw real-time changes to the preview canvas
  useEffect(() => {
    if (canvasRef.current && imageElement && width > 0 && height > 0) {
      drawImageToCanvas(
        canvasRef.current,
        imageElement,
        width,
        height,
        resizeMode,
        bgColor,
        bgTransparent,
        panX,
        panY
      );
    }
  }, [imageElement, width, height, resizeMode, bgColor, bgTransparent, panX, panY]);

  const handleScalePreset = (percent: number) => {
    if (!originalSize.width) return;
    const factor = percent / 100;
    const nextW = Math.round(originalSize.width * factor);
    const nextH = Math.round(originalSize.height * factor);
    
    setWidth(nextW);
    setHeight(nextH);
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

  // Drag Panning events for Crop/Cover mode
  const getCoverOverflow = () => {
    if (!imageElement || width <= 0 || height <= 0) return { maxOffsetX: 0, maxOffsetY: 0 };
    const imgRatio = imageElement.width / imageElement.height;
    const targetRatio = width / height;
    let drawW = width;
    let drawH = height;

    if (imgRatio > targetRatio) {
      drawW = height * imgRatio;
    } else {
      drawH = width / imgRatio;
    }

    return {
      maxOffsetX: drawW - width,
      maxOffsetY: drawH - height
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (resizeMode !== 'cover' || !canvasRef.current || !imageElement) return;

    const { maxOffsetX, maxOffsetY } = getCoverOverflow();
    if (maxOffsetX <= 0 && maxOffsetY <= 0) return;

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX,
      panY
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || resizeMode !== 'cover' || !canvasRef.current || !imageElement) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const deltaX = (e.clientX - dragStart.current.x) * scaleX;
    const deltaY = (e.clientY - dragStart.current.y) * scaleY;

    const { maxOffsetX, maxOffsetY } = getCoverOverflow();

    const startOffsetX = (dragStart.current.panX / 100) * maxOffsetX;
    const startOffsetY = (dragStart.current.panY / 100) * maxOffsetY;

    // Moving image: dragging down/right reduces target offset
    const newOffsetX = Math.max(0, Math.min(maxOffsetX, startOffsetX - deltaX));
    const newOffsetY = Math.max(0, Math.min(maxOffsetY, startOffsetY - deltaY));

    setPanX(maxOffsetX > 0 ? (newOffsetX / maxOffsetX) * 100 : 50);
    setPanY(maxOffsetY > 0 ? (newOffsetY / maxOffsetY) * 100 : 50);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (resizeMode !== 'cover' || !canvasRef.current || !imageElement || e.touches.length === 0) return;

    const { maxOffsetX, maxOffsetY } = getCoverOverflow();
    if (maxOffsetX <= 0 && maxOffsetY <= 0) return;

    setIsDragging(true);
    dragStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      panX,
      panY
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || resizeMode !== 'cover' || !canvasRef.current || !imageElement || e.touches.length === 0) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const deltaX = (e.touches[0].clientX - dragStart.current.x) * scaleX;
    const deltaY = (e.touches[0].clientY - dragStart.current.y) * scaleY;

    const { maxOffsetX, maxOffsetY } = getCoverOverflow();

    const startOffsetX = (dragStart.current.panX / 100) * maxOffsetX;
    const startOffsetY = (dragStart.current.panY / 100) * maxOffsetY;

    const newOffsetX = Math.max(0, Math.min(maxOffsetX, startOffsetX - deltaX));
    const newOffsetY = Math.max(0, Math.min(maxOffsetY, startOffsetY - deltaY));

    setPanX(maxOffsetX > 0 ? (newOffsetX / maxOffsetX) * 100 : 50);
    setPanY(maxOffsetY > 0 ? (newOffsetY / maxOffsetY) * 100 : 50);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    if (!imageElement || !file) return;
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      drawImageToCanvas(
        canvas,
        imageElement,
        width,
        height,
        resizeMode,
        bgColor,
        bgTransparent,
        panX,
        panY
      );

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

  const handleReset = () => {
    setFile(null);
    setImageSrc(null);
    setImageElement(null);
    setOriginalSize({ width: 0, height: 0 });
    setWidth(0);
    setHeight(0);
    setPanX(50);
    setPanY(50);
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

  // Calculate target aspect ratios for display metrics
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = width > 0 && height > 0 ? gcd(width, height) : 1;
  const aspectW = divisor > 0 ? Math.round(width / divisor) : 0;
  const aspectH = divisor > 0 ? Math.round(height / divisor) : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resize Image</h1>
            <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Choose Another Image
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Canvas Preview */}
        <div className="md:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center min-h-[340px] overflow-hidden">
            <div 
              className="relative max-h-[380px] max-w-full rounded-xl overflow-hidden border border-slate-200/60 shadow-sm flex items-center justify-center"
              style={{
                backgroundImage: 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                backgroundColor: '#ffffff'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                className={`max-h-[380px] max-w-full object-contain ${
                  resizeMode === 'cover' ? 'cursor-move active:cursor-grabbing select-none' : 'cursor-default'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center divide-x divide-slate-100 bg-slate-50/50 py-3 rounded-xl border border-slate-100">
            <div>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Original Size</span>
              <span className="text-xs font-bold text-slate-700">{originalSize.width} × {originalSize.height} px</span>
            </div>
            <div>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Target Size</span>
              <span className="text-xs font-bold text-slate-700">
                {width} × {height} px {aspectW > 0 && aspectH > 0 && `(${aspectW}:${aspectH})`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Controls Panel */}
        <div className="md:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Resize Mode Selector */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Resize Mode</h3>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {[
                { id: 'contain', label: 'Fit (Border)' },
                { id: 'cover', label: 'Crop (Fill)' },
                { id: 'stretch', label: 'Stretch' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setResizeMode(m.id as any)}
                  className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
                    resizeMode === m.id
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Hint / Color Config */}
          {resizeMode === 'cover' && (
            <div className="text-[10px] text-slate-500 font-semibold bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2">
              <Move className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Drag the image preview directly to adjust which area is cropped.</span>
            </div>
          )}

          {resizeMode === 'contain' && (
            <div className="space-y-2 pt-3 border-t border-slate-50">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Border Background</label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setBgTransparent(!bgTransparent)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    bgTransparent
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-50'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Transparent
                </button>
                {!bgTransparent && (
                  <div className="flex items-center gap-1.5">
                    {[
                      { hex: '#ffffff', label: 'White' },
                      { hex: '#000000', label: 'Black' },
                      { hex: '#f8fafc', label: 'Slate' },
                      { hex: '#3b82f6', label: 'Blue' }
                    ].map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => setBgColor(color.hex)}
                        className={`w-6 h-6 rounded-full border transition-all ${
                          bgColor === color.hex ? 'ring-2 ring-emerald-500 ring-offset-1 scale-110' : 'border-slate-200'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-6 h-6 p-0 rounded-full border border-slate-200 overflow-hidden cursor-pointer bg-transparent"
                      title="Custom Color"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Size Inputs */}
          <div className="space-y-4 pt-3 border-t border-slate-50">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Target Size (px)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500">Width</label>
                <input
                  type="number"
                  value={width || ''}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500">Height</label>
                <input
                  type="number"
                  value={height || ''}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200"
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

          {/* Preset Scaling */}
          <div className="space-y-2 pt-3 border-t border-slate-50">
            <label className="block text-[10px] font-bold text-slate-500">Preset Scaling</label>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 200].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleScalePreset(percent)}
                  className="py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl text-[10px] font-bold transition-all"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* File Formats */}
          <div className="space-y-3 pt-3 border-t border-slate-50">
            <label className="block text-[10px] font-bold text-slate-500">Format</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 bg-white"
            >
              <option value="original">Original Format</option>
              <option value="png">PNG Format</option>
              <option value="jpeg">JPEG Format</option>
              <option value="webp">WebP Format</option>
            </select>
          </div>

          {/* Save Action */}
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
