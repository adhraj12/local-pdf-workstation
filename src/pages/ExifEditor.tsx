import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Trash2, Edit3, MapPin, ExternalLink, RefreshCw, FileText } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { cn } from '../lib/utils';
import * as piexif from 'piexifjs';

interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  pixels: number;
  megapixels: string;
}

export function ExifEditor() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isStripped, setIsStripped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // File metadata properties
  const [meta, setMeta] = useState<ImageMetadata | null>(null);

  // EXIF Form states
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [software, setSoftware] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [exposureTime, setExposureTime] = useState('');
  const [fNumber, setFNumber] = useState('');
  const [iso, setIso] = useState('');
  const [focalLength, setFocalLength] = useState('');

  // GPS form states
  const [gpsLatitude, setGpsLatitude] = useState('');
  const [gpsLongitude, setGpsLongitude] = useState('');
  const [gpsAltitude, setGpsAltitude] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'info' | 'camera' | 'gps'>('info');

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const imgFile = acceptedFiles[0];
    setFile(imgFile);
    setIsStripped(false);
    
    // Reset form
    setMake('');
    setModel('');
    setSoftware('');
    setDateTime('');
    setExposureTime('');
    setFNumber('');
    setIso('');
    setFocalLength('');
    setGpsLatitude('');
    setGpsLongitude('');
    setGpsAltitude('');

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const src = e.target.result as string;
        setImageSrc(src);

        // Load dimensions
        const img = new Image();
        img.onload = () => {
          const pixels = img.width * img.height;
          const megapixels = (pixels / 1000000).toFixed(2);
          setMeta({
            name: imgFile.name,
            size: imgFile.size,
            type: imgFile.type || 'image/jpeg',
            width: img.width,
            height: img.height,
            pixels: pixels,
            megapixels: megapixels
          });
        };
        img.src = src;

        // Parse EXIF tags
        if (imgFile.type === 'image/jpeg' || imgFile.type === 'image/jpg') {
          try {
            const exifObj = piexif.load(src);
            
            // 0th Tag Parsing
            if (exifObj['0th']) {
              setMake(exifObj['0th'][piexif.ImageIFD.Make] || '');
              setModel(exifObj['0th'][piexif.ImageIFD.Model] || '');
              setSoftware(exifObj['0th'][piexif.ImageIFD.Software] || '');
              setDateTime(exifObj['0th'][piexif.ImageIFD.DateTime] || '');
            }

            // Exif Tag Parsing
            if (exifObj['Exif']) {
              const et = exifObj['Exif'][piexif.ExifIFD.ExposureTime];
              if (et) setExposureTime(et[0] === 1 ? `1/${et[1]}` : (et[0] / et[1]).toString());

              const fn = exifObj['Exif'][piexif.ExifIFD.FNumber];
              if (fn) setFNumber((fn[0] / fn[1]).toString());

              const isoSpeed = exifObj['Exif'][piexif.ExifIFD.ISOSpeedRatings];
              if (isoSpeed) setIso(Array.isArray(isoSpeed) ? isoSpeed[0]?.toString() : isoSpeed.toString());

              const fl = exifObj['Exif'][piexif.ExifIFD.FocalLength];
              if (fl) setFocalLength((fl[0] / fl[1]).toString());
            }

            // GPS Tag Parsing
            if (exifObj['GPS']) {
              const lat = exifObj['GPS'][piexif.GPSIFD.GPSLatitude];
              const latRef = exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef];
              if (lat && latRef) {
                let decLat = lat[0][0]/lat[0][1] + (lat[1][0]/lat[1][1])/60 + (lat[2][0]/lat[2][1])/3600;
                if (latRef === 'S') decLat = -decLat;
                setGpsLatitude(decLat.toFixed(6));
              }

              const lng = exifObj['GPS'][piexif.GPSIFD.GPSLongitude];
              const lngRef = exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef];
              if (lng && lngRef) {
                let decLng = lng[0][0]/lng[0][1] + (lng[1][0]/lng[1][1])/60 + (lng[2][0]/lng[2][1])/3600;
                if (lngRef === 'W') decLng = -decLng;
                setGpsLongitude(decLng.toFixed(6));
              }

              const alt = exifObj['GPS'][piexif.GPSIFD.GPSAltitude];
              const altRef = exifObj['GPS'][piexif.GPSIFD.GPSAltitudeRef];
              if (alt) {
                let decAlt = alt[0] / alt[1];
                if (altRef === 1) decAlt = -decAlt;
                setGpsAltitude(decAlt.toString());
              }
            }
          } catch (err) {
            console.warn('Could not parse EXIF details:', err);
          }
        }
      }
    };
    reader.readAsDataURL(imgFile);
  };

  // Convert decimal to DMS
  const decimalToDMS = (decimal: number): [[number, number], [number, number], [number, number]] => {
    const d = Math.abs(decimal);
    const degrees = Math.floor(d);
    const minFloat = (d - degrees) * 60;
    const minutes = Math.floor(minFloat);
    const seconds = Math.round((minFloat - minutes) * 60 * 100);
    return [[degrees, 1], [minutes, 1], [seconds, 100]];
  };

  // Helper to parse rational from input (e.g. "1/250" or "2.8")
  const parseRational = (str: string): [number, number] => {
    if (str.includes('/')) {
      const parts = str.split('/');
      const num = parseInt(parts[0]);
      const den = parseInt(parts[1]);
      return [isNaN(num) ? 1 : num, isNaN(den) ? 1 : den];
    } else {
      const val = parseFloat(str);
      if (Number.isInteger(val)) {
        return [val, 1];
      }
      return [Math.round(val * 1000), 1000];
    }
  };

  const handleSave = async () => {
    if (!imageSrc || !file) return;

    try {
      setIsProcessing(true);

      // Load original or empty EXIF
      let exifObj: any = { '0th': {}, 'Exif': {}, 'GPS': {} };
      try {
        exifObj = piexif.load(imageSrc);
      } catch (e) {
        console.log('No EXIF found. Creating clean EXIF metadata container.');
      }

      // Write 0th tags
      if (make) exifObj['0th'][piexif.ImageIFD.Make] = make;
      else delete exifObj['0th'][piexif.ImageIFD.Make];

      if (model) exifObj['0th'][piexif.ImageIFD.Model] = model;
      else delete exifObj['0th'][piexif.ImageIFD.Model];

      if (software) exifObj['0th'][piexif.ImageIFD.Software] = software;
      else delete exifObj['0th'][piexif.ImageIFD.Software];

      if (dateTime) exifObj['0th'][piexif.ImageIFD.DateTime] = dateTime;
      else delete exifObj['0th'][piexif.ImageIFD.DateTime];

      // Write EXIF tags
      if (exposureTime) {
        exifObj['Exif'][piexif.ExifIFD.ExposureTime] = parseRational(exposureTime);
      } else {
        delete exifObj['Exif'][piexif.ExifIFD.ExposureTime];
      }

      if (fNumber) {
        exifObj['Exif'][piexif.ExifIFD.FNumber] = parseRational(fNumber);
      } else {
        delete exifObj['Exif'][piexif.ExifIFD.FNumber];
      }

      if (iso) {
        const isoNum = parseInt(iso);
        if (!isNaN(isoNum)) {
          exifObj['Exif'][piexif.ExifIFD.ISOSpeedRatings] = [isoNum];
        }
      } else {
        delete exifObj['Exif'][piexif.ExifIFD.ISOSpeedRatings];
      }

      if (focalLength) {
        exifObj['Exif'][piexif.ExifIFD.FocalLength] = parseRational(focalLength);
      } else {
        delete exifObj['Exif'][piexif.ExifIFD.FocalLength];
      }

      // Write GPS tags
      const latFloat = parseFloat(gpsLatitude);
      if (!isNaN(latFloat)) {
        exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] = latFloat >= 0 ? 'N' : 'S';
        exifObj['GPS'][piexif.GPSIFD.GPSLatitude] = decimalToDMS(latFloat);
      } else {
        delete exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef];
        delete exifObj['GPS'][piexif.GPSIFD.GPSLatitude];
      }

      const lngFloat = parseFloat(gpsLongitude);
      if (!isNaN(lngFloat)) {
        exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] = lngFloat >= 0 ? 'E' : 'W';
        exifObj['GPS'][piexif.GPSIFD.GPSLongitude] = decimalToDMS(lngFloat);
      } else {
        delete exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef];
        delete exifObj['GPS'][piexif.GPSIFD.GPSLongitude];
      }

      const altFloat = parseFloat(gpsAltitude);
      if (!isNaN(altFloat)) {
        exifObj['GPS'][piexif.GPSIFD.GPSAltitudeRef] = altFloat >= 0 ? 0 : 1;
        exifObj['GPS'][piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(altFloat) * 100), 100];
      } else {
        delete exifObj['GPS'][piexif.GPSIFD.GPSAltitudeRef];
        delete exifObj['GPS'][piexif.GPSIFD.GPSAltitude];
      }

      // Dump and insert EXIF
      const exifBytes = piexif.dump(exifObj);
      const cleanImgData = piexif.remove(imageSrc);
      const updatedImgData = piexif.insert(exifBytes, cleanImgData);

      // Download
      const response = await fetch(updatedImgData);
      const blob = await response.blob();
      const originalName = file.name;
      const lastDot = originalName.lastIndexOf('.');
      const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
      const ext = file.type === 'image/png' ? 'png' : 'jpg';
      const finalName = `${baseName}-exif-edited.${ext}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not write metadata. Note: Metadata writing is natively supported for JPEG files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripAll = () => {
    if (!imageSrc || !file) return;

    try {
      setIsProcessing(true);
      const strippedDataUrl = piexif.remove(imageSrc);

      fetch(strippedDataUrl)
        .then(res => res.blob())
        .then(blob => {
          const originalName = file.name;
          const lastDot = originalName.lastIndexOf('.');
          const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
          const finalName = `${baseName}-stripped.jpg`;

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = finalName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          setIsStripped(true);
        });
    } catch (e) {
      console.error(e);
      alert('Could not strip EXIF data. Ensure the image is JPEG format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isJpeg = file?.type === 'image/jpeg' || file?.type === 'image/jpg';

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div 
          onClick={() => navigate('/tools?category=image')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Image Tools</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">EXIF Editor & Image Details</h1>
          <p className="text-gray-600 mt-2">Inspect all properties of your image (dimensions, pixels, format) and write/strip camera EXIF & GPS tags locally.</p>
        </div>
        <DragAndDrop 
          onDrop={handleDrop} 
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'] }}
          subtext="JPEG, PNG, WebP, GIF, or BMP images"
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
              setMeta(null);
            }}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EXIF Profile Viewer & Editor</h1>
            <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setFile(null);
            setImageSrc(null);
            setMeta(null);
          }}
          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
        >
          Choose Different Image
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Preview */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center gap-4">
          <div className="bg-slate-50 w-full min-h-[300px] flex items-center justify-center rounded-2xl overflow-hidden p-4">
            <img src={imageSrc} alt="Preview" className="max-h-[380px] max-w-full object-contain rounded-lg shadow-sm" />
          </div>

          {meta && (
            <div className="w-full grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-semibold block">Format</span>
                <span className="text-slate-700 font-bold uppercase">{meta.type.split('/')[1]}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Dimensions</span>
                <span className="text-slate-700 font-bold">{meta.width} × {meta.height} px</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Megapixels</span>
                <span className="text-slate-700 font-bold">{meta.megapixels} MP</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">File Size</span>
                <span className="text-slate-700 font-bold">{formatBytes(meta.size)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Metadata Inspector & Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('info')}
                className={cn(
                  "pb-3.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2",
                  activeTab === 'info'
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <FileText className="w-4 h-4" />
                Image Stats
              </button>
              <button
                onClick={() => setActiveTab('camera')}
                className={cn(
                  "pb-3.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2",
                  activeTab === 'camera'
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <Edit3 className="w-4 h-4" />
                Camera Settings {isJpeg && <span className="p-1 bg-emerald-50 text-[8px] font-extrabold text-emerald-600 rounded">Editable</span>}
              </button>
              <button
                onClick={() => setActiveTab('gps')}
                className={cn(
                  "pb-3.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2",
                  activeTab === 'gps'
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <MapPin className="w-4 h-4" />
                GPS Location {isJpeg && <span className="p-1 bg-emerald-50 text-[8px] font-extrabold text-emerald-600 rounded">Editable</span>}
              </button>
            </div>

            {/* Tab Content: Info */}
            {activeTab === 'info' && meta && (
              <div className="space-y-4 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Image File Information</h4>
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden text-xs">
                  <div className="flex justify-between p-4 bg-slate-50/30">
                    <span className="font-semibold text-slate-400">File Name</span>
                    <span className="font-bold text-slate-700">{meta.name}</span>
                  </div>
                  <div className="flex justify-between p-4">
                    <span className="font-semibold text-slate-400">File Size</span>
                    <span className="font-bold text-slate-700">{meta.size.toLocaleString()} Bytes ({formatBytes(meta.size)})</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50/30">
                    <span className="font-semibold text-slate-400">MIME Format Type</span>
                    <span className="font-bold text-slate-700">{meta.type}</span>
                  </div>
                  <div className="flex justify-between p-4">
                    <span className="font-semibold text-slate-400">Width</span>
                    <span className="font-bold text-slate-700">{meta.width} Pixels</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50/30">
                    <span className="font-semibold text-slate-400">Height</span>
                    <span className="font-bold text-slate-700">{meta.height} Pixels</span>
                  </div>
                  <div className="flex justify-between p-4">
                    <span className="font-semibold text-slate-400">Total Pixels Count</span>
                    <span className="font-bold text-slate-700">{meta.pixels.toLocaleString()} Pixels ({meta.megapixels} Megapixels)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Camera */}
            {activeTab === 'camera' && (
              <div className="space-y-4 animate-fade-in">
                {!isJpeg && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] font-bold text-amber-700">
                    ⚠️ Camera EXIF profile editing is supported for JPEG/JPG formats. The uploaded image is {file?.type || 'non-JPEG'}.
                  </div>
                )}
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Camera Maker</label>
                    <input
                      type="text"
                      disabled={!isJpeg}
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="e.g. Canon, Nikon, Apple"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Camera Model</label>
                    <input
                      type="text"
                      disabled={!isJpeg}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. EOS R5, iPhone 15 Pro"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Software Editor</label>
                    <input
                      type="text"
                      disabled={!isJpeg}
                      value={software}
                      onChange={(e) => setSoftware(e.target.value)}
                      placeholder="e.g. Adobe Photoshop"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Capture Date (EXIF DateTime)</label>
                    <input
                      type="text"
                      disabled={!isJpeg}
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      placeholder="YYYY:MM:DD HH:MM:SS"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Exposure Time (Seconds)</label>
                    <input
                      type="text"
                      disabled={!isJpeg}
                      value={exposureTime}
                      onChange={(e) => setExposureTime(e.target.value)}
                      placeholder="e.g. 1/250 or 0.004 or 1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Aperture (FNumber)</label>
                    <input
                      type="text"
                      disabled={!isJpeg}
                      value={fNumber}
                      onChange={(e) => setFNumber(e.target.value)}
                      placeholder="e.g. 2.8 or 8"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">ISO Speed Ratings</label>
                    <input
                      type="number"
                      disabled={!isJpeg}
                      value={iso}
                      onChange={(e) => setIso(e.target.value)}
                      placeholder="e.g. 100, 400, 1600"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Focal Length (mm)</label>
                    <input
                      type="number"
                      disabled={!isJpeg}
                      value={focalLength}
                      onChange={(e) => setFocalLength(e.target.value)}
                      placeholder="e.g. 50 or 85"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: GPS */}
            {activeTab === 'gps' && (
              <div className="space-y-4 animate-fade-in">
                {!isJpeg && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] font-bold text-amber-700">
                    ⚠️ GPS coordinate profile editing is supported for JPEG/JPG formats.
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Latitude (Decimal)</label>
                    <input
                      type="number"
                      step="any"
                      disabled={!isJpeg}
                      value={gpsLatitude}
                      onChange={(e) => setGpsLatitude(e.target.value)}
                      placeholder="e.g. 37.7749 (North)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Longitude (Decimal)</label>
                    <input
                      type="number"
                      step="any"
                      disabled={!isJpeg}
                      value={gpsLongitude}
                      onChange={(e) => setGpsLongitude(e.target.value)}
                      placeholder="e.g. -122.4194 (West)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Altitude (Meters)</label>
                    <input
                      type="number"
                      step="any"
                      disabled={!isJpeg}
                      value={gpsAltitude}
                      onChange={(e) => setGpsAltitude(e.target.value)}
                      placeholder="e.g. 15.5 (above sea level)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-300 disabled:opacity-50 transition-colors"
                    />
                  </div>
                </div>

                {gpsLatitude && gpsLongitude && !isNaN(parseFloat(gpsLatitude)) && !isNaN(parseFloat(gpsLongitude)) && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${gpsLatitude}&mlon=${gpsLongitude}#map=16/${gpsLatitude}/${gpsLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline mt-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Show coordinates on OpenStreetMap
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {isJpeg && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all hover:shadow-emerald-200 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving EXIF Metadata...
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Save & Download Image
                    </>
                  )}
                </button>

                <button
                  onClick={handleStripAll}
                  disabled={isProcessing}
                  className="py-4 px-6 border border-slate-100 hover:border-rose-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Strip EXIF Metadata
                </button>
              </div>
            )}

            {!isJpeg && (
              <div className="pt-4 border-t border-slate-100">
                <div className="text-[11px] text-center font-semibold text-slate-400">
                  Select a JPG or JPEG photo to enable EXIF tag editing or stripping.
                </div>
              </div>
            )}

            {isStripped && (
              <div className="text-center text-xs font-bold text-emerald-600">
                EXIF markers stripped successfully! Clean image downloaded.
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Shield className="w-5 h-5 text-slate-600" />
              <h4 className="font-extrabold text-xs tracking-wide uppercase">Privacy Shield Notice</h4>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Camera model details, dates, editing history, and exact GPS positions are hidden inside JPG photos. Use this offline workstation tool to edit those details or wipe them clean before sharing photos online.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
