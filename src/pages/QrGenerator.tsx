import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Upload, Loader2 } from 'lucide-react';

export function QrGenerator() {
  const [text, setText] = useState('https://clientside.tools');
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [margin, setMargin] = useState(4);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoElement, setLogoElement] = useState<HTMLImageElement | null>(null);
  const [logoScale, setLogoScale] = useState(20); // % of QR code size

  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code whenever inputs change
  useEffect(() => {
    generateQr();
  }, [text, darkColor, lightColor, margin, logoElement, logoScale]);

  const generateQr = async () => {
    if (!canvasRef.current || !text.trim()) return;

    try {
      const canvas = canvasRef.current;
      
      // Render base QR code onto canvas
      await QRCode.toCanvas(canvas, text, {
        width: 400,
        margin: margin,
        color: {
          dark: darkColor,
          light: lightColor
        },
        errorCorrectionLevel: 'H' // High error correction to survive logo overlay blocks
      });

      const ctx = canvas.getContext('2d');
      if (ctx && logoElement) {
        // Draw centered logo
        const qrSize = canvas.width;
        const targetW = qrSize * (logoScale / 100);
        const targetH = (targetW * logoElement.height) / logoElement.width;

        // Draw white background block for logo to stand out
        ctx.fillStyle = lightColor;
        ctx.fillRect(
          (qrSize - targetW) / 2 - 4,
          (qrSize - targetH) / 2 - 4,
          targetW + 8,
          targetH + 8
        );

        ctx.drawImage(
          logoElement,
          (qrSize - targetW) / 2,
          (qrSize - targetH) / 2,
          targetW,
          targetH
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setLogoFile(file);

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
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsProcessing(true);

    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsProcessing(false);
    } catch (err) {
      console.error(err);
      alert('Could not download QR code.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
          <p className="text-gray-600 mt-2 font-semibold text-xs">Create custom QR codes with color gradients and logos locally.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Settings Panel */}
        <div className="md:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Link / Text Content</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter URL or text content..."
              className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">QR Blocks Color</label>
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="w-full h-10 p-1 bg-white border border-slate-100 rounded-xl cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Background Color</label>
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                className="w-full h-10 p-1 bg-white border border-slate-100 rounded-xl cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Quiet Zone Margin</span>
              <span className="text-emerald-600">{margin} blocks</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Logo overlay */}
          <div className="space-y-3 pt-2 border-t border-slate-50">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Logo Branding Overlay</label>
            {!logoSrc ? (
              <div className="relative border border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-500">Overlay Custom PNG Logo</span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <img src={logoSrc} alt="logo" className="w-8 h-8 object-contain rounded border bg-white" />
                  <span className="text-[10px] font-semibold text-slate-600 truncate max-w-[150px]">{logoFile?.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={logoScale}
                    onChange={(e) => setLogoScale(parseInt(e.target.value))}
                    className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    title="Logo Scale"
                  />
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
              </div>
            )}
          </div>
        </div>

        {/* Display Canvas */}
        <div className="md:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6 items-center">
          <canvas ref={canvasRef} className="w-full max-w-[280px] aspect-square object-contain rounded-xl shadow-sm border border-slate-100" />

          <button
            onClick={handleDownload}
            disabled={isProcessing || !text.trim()}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:shadow-emerald-300 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PNG Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
