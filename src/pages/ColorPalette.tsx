import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Palette, Copy } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

export function ColorPalette() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Inspector color
  const [hoverColor, setHoverColor] = useState<string>('#ffffff');
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');

  // Dominant palette
  const [palette, setPalette] = useState<string[]>([]);
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

  // Draw image to canvas and extract dominant colors
  useEffect(() => {
    if (!imageElement || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = Math.min(600, imageElement.width);
    const h = (w * imageElement.height) / imageElement.width;
    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(imageElement, 0, 0, w, h);

    // Extract dominant palette using simple quantization
    extractPalette(ctx, w, h);
  }, [imageElement]);

  const rgbToHex = (r: number, g: number, b: number) => {
    const clamp = (val: number) => Math.max(0, Math.min(255, val));
    return "#" + [clamp(r), clamp(g), clamp(b)].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  const extractPalette = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Group colors in 16-bit buckets (reducing color resolution for clustering)
      const colorCounts: Record<string, number> = {};
      
      // Sample every 4th pixel to keep it fast
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue; // Skip semi-transparent pixels

        // Quantize: group into buckets of size 32
        const qR = Math.round(r / 32) * 32;
        const qG = Math.round(g / 32) * 32;
        const qB = Math.round(b / 32) * 32;

        const hex = rgbToHex(qR, qG, qB);
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      // Sort colors by count descending
      const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);

      // Take top 5 distinct colors
      const topColors = sortedColors.slice(0, 5);
      
      // If we don't have enough colors, pad with defaults
      while (topColors.length < 5) {
        topColors.push('#ffffff');
      }

      setPalette(topColors);
      setSelectedColor(topColors[0]);
    } catch (err) {
      console.error(err);
    }
  };

  // Magnifier and color click inspector
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      setHoverColor(hex);
    } catch (err) {
      // Ignore cross-origin canvas errors if they crop up
    }
  };

  const handleCanvasClick = () => {
    setSelectedColor(hoverColor);
  };

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
  };

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Color Palette Extractor</h1>
          <p className="text-gray-600 mt-2">Pick exact hex colors from images and generate dominant palettes instantly. 100% offline.</p>
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
            setPalette([]);
          }}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Color Inspector</h1>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Canvas Display */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center gap-4">
          <canvas
            ref={previewCanvasRef}
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
            className="max-h-[400px] max-w-full cursor-crosshair rounded-lg shadow-sm border border-slate-100"
          />
          <p className="text-[10px] text-slate-400 font-semibold">Hover to view colors. Click to select a color card.</p>
        </div>

        {/* Palette sidebar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Selected inspector value */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Inspected Color</h3>
            
            <div className="flex items-center gap-4">
              <div
                style={{ backgroundColor: selectedColor }}
                className="w-16 h-16 rounded-2xl border border-slate-200/80 shadow-inner shrink-0"
              />
              <div className="flex-1 space-y-1.5">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase">HEX Code</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-800">{selectedColor.toUpperCase()}</span>
                  <button
                    onClick={() => copyToClipboard(selectedColor)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    title="Copy hex"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Hover preview */}
            <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-50">
              <span className="text-slate-400 font-semibold">Hover Color</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">{hoverColor.toUpperCase()}</span>
                <span
                  style={{ backgroundColor: hoverColor }}
                  className="w-4 h-4 rounded border border-slate-100 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Dominant Palette Grid */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-1">
              <Palette className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Dominant Palette</h3>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {palette.map((color, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className="group cursor-pointer space-y-1.5 text-center"
                >
                  <div
                    style={{ backgroundColor: color }}
                    className="w-full aspect-square rounded-xl border border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase block">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
