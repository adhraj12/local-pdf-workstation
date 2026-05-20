import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export function QrScanner() {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [result, setResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // File upload state
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // File parsing logic
  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const imgFile = e.target.files[0];
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const src = event.target.result as string;
        setImageSrc(src);

        // Scan the loaded image
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height);
            if (code) {
              setResult(code.data);
            } else {
              setResult("No QR code detected in this image.");
            }
          }
        };
        img.src = src;
      }
    };
    reader.readAsDataURL(imgFile);
  };

  // Webcam stream activation
  const startCamera = async () => {
    setResult(null);
    setCameraError(null);
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setCameraError("Camera access denied or unavailable.");
      setScanning(false);
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Capture loop for live camera parsing
  useEffect(() => {
    if (!scanning) return;

    let animFrameId: number;

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code) {
            setResult(code.data);
            stopCamera();
            return; // stop scanning
          }
        }
      }
      animFrameId = requestAnimationFrame(scanFrame);
    };

    animFrameId = requestAnimationFrame(scanFrame);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [scanning]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
          <p className="text-gray-600 mt-2">Scan QR codes offline from images or a live webcam feed. 100% private.</p>
        </div>

        <div className="flex bg-slate-100 rounded-2xl p-1 shrink-0 self-start">
          <button
            onClick={() => {
              setMode('upload');
              stopCamera();
              setResult(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'upload' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload Image
          </button>
          <button
            onClick={() => {
              setMode('camera');
              setResult(null);
              startCamera();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'camera' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Live Camera
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Scanner Viewport */}
        <div className="md:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          {mode === 'upload' ? (
            <div className="w-full space-y-4">
              {!imageSrc ? (
                <div className="border border-dashed border-slate-200 hover:bg-slate-50 rounded-2xl p-12 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileDrop}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="font-bold text-sm text-slate-700">Select QR Code Image</h4>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, or WebP format</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <img src={imageSrc} alt="uploaded QR" className="max-h-[250px] object-contain rounded-lg border shadow-sm" />
                  <button
                    onClick={() => {
                      setImageSrc(null);
                      setResult(null);
                    }}
                    className="text-xs font-bold text-rose-500 hover:underline"
                  >
                    Clear Image
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {!scanning && !result && (
                <button
                  onClick={startCamera}
                  className="absolute px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200"
                >
                  Start Camera Feed
                </button>
              )}

              {scanning && (
                <div className="absolute inset-0 border-[3px] border-emerald-500/60 pointer-events-none animate-pulse flex items-center justify-center">
                  <div className="w-48 h-48 border border-white/40 border-dashed rounded-lg" />
                </div>
              )}

              {cameraError && (
                <div className="absolute text-center p-6 text-white space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs font-bold">{cameraError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scan Results */}
        <div className="md:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Decoded Result</h3>
            
            {result ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-extrabold text-xs uppercase tracking-wider">Success</span>
                </div>
                <p className="text-xs font-bold text-slate-700 break-all bg-white p-3 rounded-xl border border-emerald-50/50">
                  {result}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] shadow-sm transition-all"
                >
                  Copy to Clipboard
                </button>
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs font-semibold leading-relaxed">
                {scanning ? "Align QR code inside scanning target..." : "No data decoded yet."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
