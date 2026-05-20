import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, Loader2, Upload } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

export function ImageWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Watermark options
  const [watermarkType, setWatermarkType] = useState<'text' | 'logo'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [color, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.4);
  const [position, setPosition] = useState('center'); // center, tl, tr, bl, br, tile

  // Logo watermark options
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoElement, setLogoElement] = useState<HTMLImageElement | null>(null);
  const [logoScale, setLogoScale] = useState(25); // percentage relative to main image width

  const [isProcessing, setIsProcessing] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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
        };
        img.src = src;
      }
    };
    reader.readAsDataURL(imgFile);
  };

  const handleLogoDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const lFile = e.target.files[0];
    setLogoFile(lFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const src = event.target.result as string;
        setLogoSrc(src);

        const img = new Image();
        img.onload = () => {
          setLogoElement(img);
        };
        img.src = src;
      }
    };
    reader.readAsDataURL(lFile);
  };

  // Draw watermark on preview canvas
  useEffect(() => {
    if (!imageElement || !previewCanvasRef.current) return;
    drawWatermark(previewCanvasRef.current, false);
  }, [imageElement, watermarkType, text, color, fontSize, opacity, position, logoElement, logoScale]);

  const drawWatermark = (canvas: HTMLCanvasElement, fullRes = false) => {
    if (!imageElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use full size or preview size
    const w = fullRes ? imageElement.width : Math.min(800, imageElement.width);
    const h = fullRes ? imageElement.height : (w * imageElement.height) / imageElement.width;

    canvas.width = w;
    canvas.height = h;

    // Draw main image
    ctx.drawImage(imageElement, 0, 0, w, h);

    // Save context for opacity
    ctx.save();
    ctx.globalAlpha = opacity;

    // Calculate scaling factor for font sizes and logo dimensions
    const scaleFactor = w / 800;

    if (watermarkType === 'text') {
      ctx.fillStyle = color;
      const finalFontSize = Math.round(fontSize * scaleFactor);
      ctx.font = `bold ${finalFontSize}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const textH = finalFontSize;

      const padding = 20 * scaleFactor;

      if (position === 'center') {
        ctx.fillText(text, w / 2, h / 2);
      } else if (position === 'tl') {
        ctx.textAlign = 'left';
        ctx.fillText(text, padding, padding + textH / 2);
      } else if (position === 'tr') {
        ctx.textAlign = 'right';
        ctx.fillText(text, w - padding, padding + textH / 2);
      } else if (position === 'bl') {
        ctx.textAlign = 'left';
        ctx.fillText(text, padding, h - padding - textH / 2);
      } else if (position === 'br') {
        ctx.textAlign = 'right';
        ctx.fillText(text, w - padding, h - padding - textH / 2);
      } else if (position === 'tile') {
        // Tile watermark across the canvas
        const stepX = textW + 150 * scaleFactor;
        const stepY = textH + 150 * scaleFactor;
        for (let x = 50 * scaleFactor; x < w; x += stepX) {
          for (let y = 50 * scaleFactor; y < h; y += stepY) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 6); // 30 deg angle
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      }
    } else if (watermarkType === 'logo' && logoElement) {
      // Calculate logo display size
      const targetLogoW = w * (logoScale / 100);
      const targetLogoH = (targetLogoW * logoElement.height) / logoElement.width;

      const padding = 20 * scaleFactor;

      if (position === 'center') {
        ctx.drawImage(logoElement, (w - targetLogoW) / 2, (h - targetLogoH) / 2, targetLogoW, targetLogoH);
      } else if (position === 'tl') {
        ctx.drawImage(logoElement, padding, padding, targetLogoW, targetLogoH);
      } else if (position === 'tr') {
        ctx.drawImage(logoElement, w - targetLogoW - padding, padding, targetLogoW, targetLogoH);
      } else if (position === 'bl') {
        ctx.drawImage(logoElement, padding, h - targetLogoH - padding, targetLogoW, targetLogoH);
      } else if (position === 'br') {
        ctx.drawImage(logoElement, w - targetLogoW - padding, h - targetLogoH - padding, targetLogoW, targetLogoH);
      } else if (position === 'tile') {
        const stepX = targetLogoW + 150 * scaleFactor;
        const stepY = targetLogoH + 150 * scaleFactor;
        for (let x = 50 * scaleFactor; x < w - targetLogoW; x += stepX) {
          for (let y = 50 * scaleFactor; y < h - targetLogoH; y += stepY) {
            ctx.drawImage(logoElement, x, y, targetLogoW, targetLogoH);
          }
        }
      }
    }

    ctx.restore();
  };

  const handleDownload = () => {
    if (!imageElement || !file) return;
    setIsProcessing(true);

    try {
      const exportCanvas = document.createElement('canvas');
      drawWatermark(exportCanvas, true);

      const mimeType = file.type || 'image/png';
      const originalName = file.name;
      const lastDot = originalName.lastIndexOf('.');
      const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
      const ext = lastDot !== -1 ? originalName.substring(lastDot) : '.png';
      const finalName = `${baseName}-watermarked${ext}`;

      exportCanvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob conversion failed');

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
      alert('Could not export watermarked image.');
      setIsProcessing(false);
    }
  };

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Watermark Image</h1>
          <p className="text-gray-600 mt-2">Add customizable overlay text signatures or company brand logos to your photos. 100% offline.</p>
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
    <div className="space-y-8 max-w-5xl mx-auto">
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
          <h1 className="text-2xl font-bold text-gray-900">Add Watermark</h1>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Editor Preview Canvas */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <canvas ref={previewCanvasRef} className="max-h-[450px] max-w-full object-contain rounded-lg shadow-sm" />
        </div>

        {/* Toolbar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Watermark Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setWatermarkType('text')}
                className={`py-2 rounded-xl text-xs font-extrabold border transition-all text-center ${
                  watermarkType === 'text'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setWatermarkType('logo')}
                className={`py-2 rounded-xl text-xs font-extrabold border transition-all text-center ${
                  watermarkType === 'logo'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                Image Logo
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Properties</h3>

            {watermarkType === 'text' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500">Watermark Text</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500">Text Color</label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full h-9 p-1 bg-white border border-slate-100 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500">Font Size (px)</label>
                    <input
                      type="number"
                      value={fontSize}
                      min="12"
                      max="144"
                      onChange={(e) => setFontSize(parseInt(e.target.value) || 24)}
                      className="w-full px-3.5 py-2 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500">Upload Logo</label>
                  {!logoSrc ? (
                    <div className="relative border border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoDrop}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-slate-500">Select PNG Logo</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2">
                        <img src={logoSrc} alt="logo" className="w-8 h-8 object-contain rounded border bg-white" />
                        <span className="text-[10px] font-semibold text-slate-600 truncate max-w-[150px]">{logoFile?.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setLogoFile(null);
                          setLogoSrc(null);
                          setLogoElement(null);
                        }}
                        className="text-[9px] font-bold text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {logoSrc && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Logo Scale</span>
                      <span className="text-emerald-600">{logoScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={logoScale}
                      onChange={(e) => setLogoScale(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-50">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Opacity</span>
                <span className="text-emerald-600">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={opacity * 100}
                onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-50">
              <label className="block text-[10px] font-bold text-slate-500">Placement</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'tl', label: 'Top Left' },
                  { id: 'center', label: 'Center' },
                  { id: 'tr', label: 'Top Right' },
                  { id: 'bl', label: 'Bottom L' },
                  { id: 'tile', label: 'Tiled' },
                  { id: 'br', label: 'Bottom R' }
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id)}
                    className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all text-center ${
                      position === pos.id
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'border-slate-100 hover:border-slate-200 text-slate-500'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={isProcessing || (watermarkType === 'logo' && !logoElement)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:shadow-emerald-300 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Apply Watermark & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
