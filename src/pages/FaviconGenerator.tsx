import { useState } from 'react';
import { ArrowLeft, Download, FileImage, Loader2 } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

interface FaviconSize {
  name: string;
  size: number;
  label: string;
  blob?: Blob;
}

export function FaviconGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sizes] = useState<FaviconSize[]>([
    { name: '16x16', size: 16, label: 'Favicon Standard' },
    { name: '32x32', size: 32, label: 'Favicon High-DPI' },
    { name: '48x48', size: 48, label: 'Favicon Desktop' },
    { name: '180x180', size: 180, label: 'Apple Touch Icon' },
    { name: '192x192', size: 192, label: 'Android Chrome Icon' }
  ]);
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

  const resizeImage = (img: HTMLImageElement, size: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Could not init canvas');
        return;
      }

      // Draw image squared centered
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;

      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject('Blob generation failed');
        }
      }, 'image/png');
    });
  };

  // Compile multi-resolution .ico favicon file client-side
  const handleGenerateIco = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      // ICO standard sizes to compile: 16x16, 32x32, 48x48
      const icoSizes = [16, 32, 48];
      const blobs: Blob[] = [];

      for (const s of icoSizes) {
        const b = await resizeImage(img, s);
        blobs.push(b);
      }

      const arrayBuffers = await Promise.all(blobs.map(b => b.arrayBuffer()));

      // Calculate sizes and offsets
      const numImages = icoSizes.length;
      const headerSize = 6;
      const directoryEntrySize = 16;
      const directoryTotalSize = numImages * directoryEntrySize;

      let currentDataOffset = headerSize + directoryTotalSize;
      
      // Calculate total file size
      const dataSizes = arrayBuffers.map(ab => ab.byteLength);
      const totalIcoSize = currentDataOffset + dataSizes.reduce((sum, s) => sum + s, 0);

      const icoBuffer = new ArrayBuffer(totalIcoSize);
      const view = new DataView(icoBuffer);
      const uint8 = new Uint8Array(icoBuffer);

      // ICO Header
      view.setUint16(0, 0, true); // Reserved
      view.setUint16(2, 1, true); // Type: 1 for Icon (.ico)
      view.setUint16(4, numImages, true); // Number of images

      // Write directory entries
      let entryOffset = headerSize;
      for (let i = 0; i < numImages; i++) {
        const size = icoSizes[i];
        const dataSize = dataSizes[i];

        view.setUint8(entryOffset, size === 256 ? 0 : size); // Width
        view.setUint8(entryOffset + 1, size === 256 ? 0 : size); // Height
        view.setUint8(entryOffset + 2, 0); // Palette count: 0
        view.setUint8(entryOffset + 3, 0); // Reserved
        view.setUint16(entryOffset + 4, 1, true); // Color planes: 1
        view.setUint16(entryOffset + 6, 32, true); // Bits per pixel: 32 (RGBA)
        view.setUint32(entryOffset + 8, dataSize, true); // Size of image data
        view.setUint32(entryOffset + 12, currentDataOffset, true); // Offset of data

        // Copy PNG content to image data block
        uint8.set(new Uint8Array(arrayBuffers[i]), currentDataOffset);

        currentDataOffset += dataSize;
        entryOffset += directoryEntrySize;
      }

      // Download ICO blob
      const icoBlob = new Blob([icoBuffer], { type: 'image/x-icon' });
      const url = URL.createObjectURL(icoBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'favicon.ico';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Could not compile .ico favicon file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPng = async (size: number) => {
    if (!imageSrc) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      const blob = await resizeImage(img, size);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `favicon-${size}x${size}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not resize image.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Favicon Generator</h1>
          <p className="text-gray-600 mt-2">Generate multi-resolution website favicons and application icons instantly. 100% client-side.</p>
        </div>
        <DragAndDrop 
          onDrop={handleDrop} 
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
          subtext="PNG, JPG, or WebP images"
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
          <h1 className="text-2xl font-bold text-gray-900">Generate Favicon</h1>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Output Previews */}
        <div className="md:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Resized Output Formats</h3>
          
          <div className="divide-y divide-slate-100">
            {sizes.map((s) => (
              <div key={s.name} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-center shrink-0">
                    <img
                      src={imageSrc}
                      alt={s.name}
                      style={{ width: `${Math.min(32, s.size)}px`, height: `${Math.min(32, s.size)}px` }}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-700">{s.label}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{s.name} (PNG)</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadPng(s.size)}
                  className="px-3 py-1.5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold transition-all"
                >
                  Download PNG
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bundle compiler */}
        <div className="md:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <FileImage className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-xs tracking-wide uppercase">Favicon .ICO File</h4>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Downloads a single compiled `.ico` asset combining 16x16, 32x32, and 48x48 pixel formats. Compatible with all traditional browser tab addresses.
            </p>
          </div>

          <button
            onClick={handleGenerateIco}
            disabled={isProcessing}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:shadow-emerald-300 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Compiling ICO...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Compile & Save favicon.ico
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
