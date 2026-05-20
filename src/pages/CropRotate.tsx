import { useState, useRef, useEffect } from 'react';
import { Loader2, ArrowLeft, Download, RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { cn } from '../lib/utils';

interface ImageDimensions {
  width: number;
  height: number;
}

export function CropRotate() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });

  // Transform states
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [fineRotation, setFineRotation] = useState<number>(0); // -45 to 45 degrees
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Crop states (in percentage of display bounds)
  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [aspectRatio, setAspectRatio] = useState<string>('free');
  
  // Drag / Resize state trackers
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });

  const [outputFormat, setOutputFormat] = useState<string>('original');
  const [isProcessing, setIsProcessing] = useState(false);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Handle dropping the image file
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
          setImageDimensions({ width: img.width, height: img.height });
          // Reset transform settings
          setRotation(0);
          setFineRotation(0);
          setFlipH(false);
          setFlipV(false);
          setAspectRatio('free');
          setCrop({ x: 10, y: 10, w: 80, h: 80 });
        };
        img.src = src;
      }
    };
    reader.readAsDataURL(imgFile);
  };

  // Redraw preview canvas whenever image or transforms change
  useEffect(() => {
    if (!imageElement || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions based on 90-degree rotations
    const isRotatedOrtho = rotation === 90 || rotation === 270;
    
    // We downscale the canvas slightly for editing performance (max size 1600px for preview)
    const maxPreviewDimension = 1600;
    let originalW = imageElement.width;
    let originalH = imageElement.height;
    
    let scale = 1;
    if (Math.max(originalW, originalH) > maxPreviewDimension) {
      scale = maxPreviewDimension / Math.max(originalW, originalH);
      originalW = Math.round(originalW * scale);
      originalH = Math.round(originalH * scale);
    }

    const previewW = isRotatedOrtho ? originalH : originalW;
    const previewH = isRotatedOrtho ? originalW : originalH;

    canvas.width = previewW;
    canvas.height = previewH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Translate to center for rotation/flip transforms
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply 90-degree steps + fine rotation slider angles
    const totalRotation = rotation + fineRotation;
    ctx.rotate((totalRotation * Math.PI) / 180);
    
    // Apply flips
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Draw original image scaled to preview
    ctx.drawImage(imageElement, -originalW / 2, -originalH / 2, originalW, originalH);
    ctx.restore();
  }, [imageElement, rotation, fineRotation, flipH, flipV]);

  // Adjust crop box size centered to match current ratio
  useEffect(() => {
    resetCropBox(aspectRatio);
  }, [aspectRatio, imageDimensions, rotation, fineRotation]);

  const getRatioValue = (ratio: string) => {
    if (ratio === '1:1') return 1;
    if (ratio === '16:9') return 16 / 9;
    if (ratio === '4:3') return 4 / 3;
    if (ratio === '2:3') return 2 / 3;
    return 1;
  };

  const resetCropBox = (ratio = aspectRatio) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const canvasRatio = canvas.width / canvas.height;

    if (ratio === 'free') {
      setCrop({ x: 10, y: 10, w: 80, h: 80 });
    } else {
      const targetRatio = getRatioValue(ratio);
      
      // Calculate crop percentage size
      let w = 80;
      let h = (w * canvasRatio) / targetRatio;
      
      if (h > 80) {
        h = 80;
        w = (h * targetRatio) / canvasRatio;
      }
      
      const x = (100 - w) / 2;
      const y = (100 - h) / 2;
      
      setCrop({ x, y, w: Math.max(10, w), h: Math.max(10, h) });
    }
  };

  // Mouse drag crop overlay handlers
  const handleMouseDown = (e: React.MouseEvent, handle: string | null = null) => {
    e.preventDefault();
    setIsDragging(true);
    setActiveHandle(handle);
    
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDragStart({
      x: mouseX,
      y: mouseY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.w,
      cropH: crop.h
    });
  };

  // Window-level mouse listeners to keep drag active outside container bounds
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;

      if (activeHandle === null) {
        // Drag complete box
        let newX = dragStart.cropX + deltaX;
        let newY = dragStart.cropY + deltaY;

        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + dragStart.cropW > 100) newX = 100 - dragStart.cropW;
        if (newY + dragStart.cropH > 100) newY = 100 - dragStart.cropH;

        setCrop(prev => ({ ...prev, x: newX, y: newY }));
      } else {
        // Resize crop box
        let newX = dragStart.cropX;
        let newY = dragStart.cropY;
        let newW = dragStart.cropW;
        let newH = dragStart.cropH;

        if (activeHandle.includes('e')) {
          newW = Math.max(10, Math.min(100 - newX, dragStart.cropW + deltaX));
        }
        if (activeHandle.includes('w')) {
          const potentialW = dragStart.cropW - deltaX;
          if (potentialW >= 10) {
            newX = Math.max(0, dragStart.cropX + deltaX);
            newW = dragStart.cropW + (dragStart.cropX - newX);
          }
        }
        if (activeHandle.includes('s')) {
          newH = Math.max(10, Math.min(100 - newY, dragStart.cropH + deltaY));
        }
        if (activeHandle.includes('n')) {
          const potentialH = dragStart.cropH - deltaY;
          if (potentialH >= 10) {
            newY = Math.max(0, dragStart.cropY + deltaY);
            newH = dragStart.cropH + (dragStart.cropY - newY);
          }
        }

        // Maintain Aspect Ratio locks
        if (aspectRatio !== 'free') {
          const targetRatio = getRatioValue(aspectRatio);
          const canvas = previewCanvasRef.current;
          if (canvas) {
            const canvasRatio = canvas.width / canvas.height;
            
            if (activeHandle.includes('e') || activeHandle.includes('w')) {
              newH = (newW * canvasRatio) / targetRatio;
              if (newY + newH > 100) {
                newH = 100 - newY;
                newW = (newH * targetRatio) / canvasRatio;
              }
            } else {
              newW = (newH * targetRatio) / canvasRatio;
              if (newX + newW > 100) {
                newW = 100 - newX;
                newH = (newW * canvasRatio) / targetRatio;
              }
            }
          }
        }

        setCrop({ x: newX, y: newY, w: newW, h: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, activeHandle, dragStart, aspectRatio]);

  // Apply all transformations on full resolution canvas and download
  const handleSave = async () => {
    if (!imageElement || !previewCanvasRef.current) return;

    try {
      setIsProcessing(true);

      // Determine full dimensions
      const originalW = imageElement.width;
      const originalH = imageElement.height;
      const isRotatedOrtho = rotation === 90 || rotation === 270;

      // Full dimensions canvas
      const fullCanvas = document.createElement('canvas');
      const fullCtx = fullCanvas.getContext('2d');
      if (!fullCtx) throw new Error('Could not instantiate canvas context');

      const transW = isRotatedOrtho ? originalH : originalW;
      const transH = isRotatedOrtho ? originalW : originalH;

      fullCanvas.width = transW;
      fullCanvas.height = transH;

      // Draw transformed high-res image
      fullCtx.save();
      fullCtx.translate(fullCanvas.width / 2, fullCanvas.height / 2);
      const totalRotation = rotation + fineRotation;
      fullCtx.rotate((totalRotation * Math.PI) / 180);
      fullCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      fullCtx.drawImage(imageElement, -originalW / 2, -originalH / 2);
      fullCtx.restore();

      // Crop canvas
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) throw new Error('Could not instantiate crop canvas');

      // Convert percentage coordinates back to pixel bounds
      const cropPxX = Math.round((crop.x / 100) * transW);
      const cropPxY = Math.round((crop.y / 100) * transH);
      const cropPxW = Math.round((crop.w / 100) * transW);
      const cropPxH = Math.round((crop.h / 100) * transH);

      croppedCanvas.width = cropPxW;
      croppedCanvas.height = cropPxH;

      croppedCtx.drawImage(
        fullCanvas,
        cropPxX, cropPxY, cropPxW, cropPxH, // source box
        0, 0, cropPxW, cropPxH             // dest box
      );

      // Map formats
      let mimeType = file?.type || 'image/png';
      if (outputFormat === 'png') mimeType = 'image/png';
      if (outputFormat === 'jpeg') mimeType = 'image/jpeg';
      if (outputFormat === 'webp') mimeType = 'image/webp';

      // Export file name
      const originalName = file?.name || 'image';
      const lastDot = originalName.lastIndexOf('.');
      const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
      const ext = mimeType.split('/')[1];
      const exportName = `${baseName}-cropped.${ext}`;

      // Convert to blob and download
      croppedCanvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to generate image blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, mimeType, 0.92);

    } catch (err) {
      console.error(err);
      alert('Could not export image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const rotate90 = (clockwise: boolean) => {
    setRotation((prev) => {
      const next = clockwise ? prev + 90 : prev - 90;
      // Normalize to 0-360 deg
      return (next + 360) % 360;
    });
  };

  const hasChanges = rotation !== 0 || fineRotation !== 0 || flipH || flipV || crop.x !== 10 || crop.y !== 10 || crop.w !== 80 || crop.h !== 80;

  const handleReset = () => {
    setRotation(0);
    setFineRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio('free');
    setCrop({ x: 10, y: 10, w: 80, h: 80 });
  };

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crop & Rotate Image</h1>
          <p className="text-gray-600 mt-2">Crop parts of your image, rotate, or flip them client-side. Your photo never leaves your machine.</p>
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <h1 className="text-2xl font-bold text-gray-900">Crop & Rotate Image</h1>
            <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name} ({imageDimensions.width} × {imageDimensions.height} px)</p>
          </div>
        </div>

        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Reset Transforms
            </button>
          )}
          <button
            onClick={() => {
              setFile(null);
              setImageSrc(null);
              setImageElement(null);
            }}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            Choose Different Image
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Interactive Canvas Editor */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div 
            ref={containerRef} 
            className="relative select-none max-h-[500px] min-h-[300px] flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden"
          >
            <canvas ref={previewCanvasRef} className="max-h-[500px] max-w-full object-contain shadow-sm rounded-lg" />
            
            {/* Cropper Box Overlay */}
            <div
              style={{
                position: 'absolute',
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.w}%`,
                height: `${crop.h}%`,
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                border: '2px solid #3b82f6',
                cursor: 'move'
              }}
              onMouseDown={(e) => handleMouseDown(e, null)}
            >
              {/* Corner handles (8-point resize system) */}
              <div className="absolute top-[-6px] left-[-6px] w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
              <div className="absolute top-[-6px] right-[-6px] w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
              <div className="absolute bottom-[-6px] left-[-6px] w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
              <div className="absolute bottom-[-6px] right-[-6px] w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize" onMouseDown={(e) => handleMouseDown(e, 'se')} />
              
              <div className="absolute top-[-6px] left-[50%] transform translate-x-[-50%] w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ns-resize" onMouseDown={(e) => handleMouseDown(e, 'n')} />
              <div className="absolute bottom-[-6px] left-[50%] transform translate-x-[-50%] w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ns-resize" onMouseDown={(e) => handleMouseDown(e, 's')} />
              <div className="absolute left-[-6px] top-[50%] transform translate-y-[-50%] w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize" onMouseDown={(e) => handleMouseDown(e, 'w')} />
              <div className="absolute right-[-6px] top-[50%] transform translate-y-[-50%] w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize" onMouseDown={(e) => handleMouseDown(e, 'e')} />

              {/* Grid guide lines */}
              <div className="absolute left-[33.33%] top-0 bottom-0 w-[0.5px] border-l border-dashed border-white/40 pointer-events-none" />
              <div className="absolute left-[66.66%] top-0 bottom-0 w-[0.5px] border-l border-dashed border-white/40 pointer-events-none" />
              <div className="absolute top-[33.33%] left-0 right-0 h-[0.5px] border-t border-dashed border-white/40 pointer-events-none" />
              <div className="absolute top-[66.66%] left-0 right-0 h-[0.5px] border-t border-dashed border-white/40 pointer-events-none" />
            </div>
          </div>
          <p className="text-[10px] text-center font-semibold text-slate-400">Drag corners to resize. Drag center to position the crop bounds.</p>
        </div>

        {/* Right Side: Editing Toolbars & Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Preset Aspect Ratios */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Aspect Ratio</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'free', label: 'Freeform' },
                { id: '1:1', label: '1:1 Square' },
                { id: '16:9', label: '16:9 Screen' },
                { id: '4:3', label: '4:3 Standard' },
                { id: '2:3', label: '2:3 Portrait' }
              ].map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={cn(
                    "py-2 rounded-xl text-[11px] font-extrabold border transition-all text-center",
                    aspectRatio === ratio.id
                      ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                      : "border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800"
                  )}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation & Flips */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Orientation & Mirror</h3>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => rotate90(false)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-600 border border-transparent"
                title="Rotate -90°"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-[9px] font-bold">-90°</span>
              </button>
              <button
                onClick={() => rotate90(true)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-600 border border-transparent"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
                <span className="text-[9px] font-bold">+90°</span>
              </button>
              <button
                onClick={() => setFlipH(!flipH)}
                className={cn(
                  "p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border",
                  flipH
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-slate-50 hover:bg-slate-100 border-transparent text-slate-600"
                )}
                title="Mirror Horizontal"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span className="text-[9px] font-bold">Flip H</span>
              </button>
              <button
                onClick={() => setFlipV(!flipV)}
                className={cn(
                  "p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border",
                  flipV
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-slate-50 hover:bg-slate-100 border-transparent text-slate-600"
                )}
                title="Mirror Vertical"
              >
                <FlipVertical className="w-4 h-4" />
                <span className="text-[9px] font-bold">Flip V</span>
              </button>
            </div>

            {/* Fine rotation angle slider */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Fine Rotate Angle</span>
                <span className="text-blue-600">{fineRotation}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={fineRotation}
                onChange={(e) => setFineRotation(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-400">
                <span>-45°</span>
                <span>0°</span>
                <span>45°</span>
              </div>
            </div>
          </div>

          {/* Export Settings & Save Button */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Export Options</h3>
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-500">Output Format</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full px-3 py-2 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-300 transition-colors"
              >
                <option value="original">Original Format</option>
                <option value="png">PNG Format</option>
                <option value="jpeg">JPEG Format</option>
                <option value="webp">WebP Format</option>
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Image...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Crop & Save Image
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
