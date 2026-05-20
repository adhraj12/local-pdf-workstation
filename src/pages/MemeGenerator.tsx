import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Smile, Loader2 } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

export function MemeGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Meme text settings
  const [topText, setTopText] = useState('TOP TEXT');
  const [bottomText, setBottomText] = useState('BOTTOM TEXT');
  const [fontSize, setFontSize] = useState(48);
  const [isUppercase, setIsUppercase] = useState(true);

  // Offsets (in percentage of height)
  const [topYOffset, setTopYOffset] = useState(10);
  const [bottomYOffset, setBottomYOffset] = useState(90);

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

  useEffect(() => {
    if (!imageElement || !previewCanvasRef.current) return;
    drawMeme(previewCanvasRef.current, false);
  }, [imageElement, topText, bottomText, fontSize, isUppercase, topYOffset, bottomYOffset]);

  const drawMeme = (canvas: HTMLCanvasElement, fullRes = false) => {
    if (!imageElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = fullRes ? imageElement.width : Math.min(800, imageElement.width);
    const h = fullRes ? imageElement.height : (w * imageElement.height) / imageElement.width;

    canvas.width = w;
    canvas.height = h;

    // Draw background
    ctx.drawImage(imageElement, 0, 0, w, h);

    // Setup text styling (Classic Impact Meme Style)
    const scaleFactor = w / 800;
    const finalFontSize = Math.round(fontSize * scaleFactor);
    
    ctx.font = `bold ${finalFontSize}px Impact, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(3, Math.round(finalFontSize / 8));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const formatText = (t: string) => isUppercase ? t.toUpperCase() : t;

    // Draw Top Text
    if (topText.trim()) {
      const topY = (topYOffset / 100) * h;
      ctx.strokeText(formatText(topText), w / 2, topY);
      ctx.fillText(formatText(topText), w / 2, topY);
    }

    // Draw Bottom Text
    if (bottomText.trim()) {
      const bottomY = (bottomYOffset / 100) * h;
      ctx.strokeText(formatText(bottomText), w / 2, bottomY);
      ctx.fillText(formatText(bottomText), w / 2, bottomY);
    }
  };

  const handleDownload = () => {
    if (!imageElement || !file) return;
    setIsProcessing(true);

    try {
      const exportCanvas = document.createElement('canvas');
      drawMeme(exportCanvas, true);

      const mimeType = file.type || 'image/png';
      const originalName = file.name;
      const lastDot = originalName.lastIndexOf('.');
      const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
      const ext = lastDot !== -1 ? originalName.substring(lastDot) : '.png';
      const finalName = `${baseName}-meme${ext}`;

      exportCanvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob generation failed');

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
      alert('Could not export meme.');
      setIsProcessing(false);
    }
  };

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meme Generator</h1>
          <p className="text-gray-600 mt-2">Create classic memes by overlaying Impact text captions on your photos. 100% offline.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Meme Studio</h1>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Editor Preview */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <canvas ref={previewCanvasRef} className="max-h-[450px] max-w-full object-contain rounded-lg shadow-sm" />
        </div>

        {/* Toolbar controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Meme Text</h3>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500">Top Caption</label>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500">Bottom Caption</label>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Styling & Positions</h3>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Font Size</span>
                  <span className="text-emerald-600">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isUppercase}
                    onChange={(e) => setIsUppercase(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-200"
                  />
                  <span>FORCE UPPERCASE</span>
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-50">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Top Caption Height</span>
                <span className="text-emerald-600">{topYOffset}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                value={topYOffset}
                onChange={(e) => setTopYOffset(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-50">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Bottom Caption Height</span>
                <span className="text-emerald-600">{bottomYOffset}%</span>
              </div>
              <input
                type="range"
                min="55"
                max="95"
                value={bottomYOffset}
                onChange={(e) => setBottomYOffset(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:shadow-emerald-300 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Smile className="w-4 h-4" />
                Generate Meme & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
