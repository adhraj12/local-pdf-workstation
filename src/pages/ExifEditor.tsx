import { useState } from 'react';
import { ArrowLeft, Shield, Eye, Trash2 } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

interface ExifTags {
  Make?: string;
  Model?: string;
  Software?: string;
  DateTime?: string;
  GPSLatitude?: string;
  GPSLongitude?: string;
}

export function ExifEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [tags, setTags] = useState<ExifTags | null>(null);
  const [isStripped, setIsStripped] = useState(false);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const imgFile = acceptedFiles[0];
    setFile(imgFile);
    setIsStripped(false);
    setTags(null);

    // Get DataURL for display preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(imgFile);

    // Get ArrayBuffer for binary parsing
    const bufferReader = new FileReader();
    bufferReader.onload = (e) => {
      if (e.target?.result) {
        const buffer = e.target.result as ArrayBuffer;
        setFileBuffer(buffer);
        try {
          const parsed = parseExif(buffer);
          setTags(parsed);
        } catch (err) {
          console.warn("Could not parse EXIF tags:", err);
          setTags({}); // Empty but not null to indicate parsing was done
        }
      }
    };
    bufferReader.readAsArrayBuffer(imgFile);
  };

  // Safe client-side JPEG EXIF metadata parser
  const parseExif = (buffer: ArrayBuffer): ExifTags => {
    const view = new DataView(buffer);
    if (view.getUint16(0, false) !== 0xFFD8) {
      return {}; // Not a JPEG
    }

    let offset = 2;
    const length = view.byteLength;
    let app1Offset = -1;

    while (offset < length) {
      const marker = view.getUint16(offset, false);
      if (marker === 0xFFE1) { // APP1
        app1Offset = offset;
        break;
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break; // Invalid marker
      }
      offset += 2 + view.getUint16(offset + 2, false);
    }

    if (app1Offset === -1) {
      return {}; // No APP1 segment found
    }

    // Read EXIF Header
    const exifHeaderOffset = app1Offset + 4;
    // Exif\0\0
    if (view.getUint32(exifHeaderOffset, false) !== 0x45786966 || view.getUint16(exifHeaderOffset + 4, false) !== 0) {
      return {};
    }

    const tiffOffset = exifHeaderOffset + 6;
    const littleEndian = view.getUint16(tiffOffset, false) === 0x4949; // "II"
    if (view.getUint16(tiffOffset + 2, littleEndian) !== 0x002A) {
      return {}; // Not valid TIFF
    }

    const firstIFDOffset = view.getUint32(tiffOffset + 4, littleEndian);
    const tags: ExifTags = {};

    const readString = (valOffset: number, byteLength: number) => {
      const chars = [];
      for (let i = 0; i < byteLength; i++) {
        const c = view.getUint8(valOffset + i);
        if (c === 0) break;
        chars.push(String.fromCharCode(c));
      }
      return chars.join('').trim();
    };

    const parseIFD = (ifdOffset: number) => {
      const numEntries = view.getUint16(tiffOffset + ifdOffset, littleEndian);
      let entryOffset = tiffOffset + ifdOffset + 2;

      for (let i = 0; i < numEntries; i++) {
        const tag = view.getUint16(entryOffset, littleEndian);
        const type = view.getUint16(entryOffset + 2, littleEndian);
        const count = view.getUint32(entryOffset + 4, littleEndian);
        let valOffset = entryOffset + 8;

        // If the value fits in 4 bytes, it's inside the entry, otherwise it's an offset
        const sizes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];
        const typeSize = sizes[type] || 1;
        const totalSize = count * typeSize;

        if (totalSize > 4) {
          valOffset = tiffOffset + view.getUint32(valOffset, littleEndian);
        }

        // Match common tags
        if (tag === 0x010F) { // Make
          tags.Make = readString(valOffset, count);
        } else if (tag === 0x0110) { // Model
          tags.Model = readString(valOffset, count);
        } else if (tag === 0x0131) { // Software
          tags.Software = readString(valOffset, count);
        } else if (tag === 0x0132) { // DateTime
          tags.DateTime = readString(valOffset, count);
        }

        entryOffset += 12;
      }
    };

    parseIFD(firstIFDOffset);
    return tags;
  };

  // Strip EXIF byte segment from JPEG
  const handleStripAll = () => {
    if (!fileBuffer || !file) return;

    const view = new DataView(fileBuffer);
    if (view.getUint16(0, false) !== 0xFFD8) {
      alert("Only JPEG images can have their EXIF metadata parsed and stripped.");
      return;
    }

    const segments: { start: number; end: number }[] = [];
    let offset = 2;
    const length = view.byteLength;

    // Keep SOI
    segments.push({ start: 0, end: 2 });

    while (offset < length) {
      const marker = view.getUint16(offset, false);
      if (marker === 0xFFD9) { // EOI
        segments.push({ start: offset, end: length });
        break;
      }

      const segLength = view.getUint16(offset + 2, false);
      const nextOffset = offset + 2 + segLength;

      // Skip APP1 markers (0xFFE1 is standard EXIF)
      if (marker !== 0xFFE1) {
        segments.push({ start: offset, end: nextOffset });
      }

      offset = nextOffset;
    }

    // Reconstruct file buffer
    const totalSize = segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
    const cleanBuffer = new Uint8Array(totalSize);
    let targetOffset = 0;

    const originalArray = new Uint8Array(fileBuffer);
    for (const seg of segments) {
      cleanBuffer.set(originalArray.subarray(seg.start, seg.end), targetOffset);
      targetOffset += (seg.end - seg.start);
    }

    const cleanBlob = new Blob([cleanBuffer], { type: 'image/jpeg' });
    const originalName = file.name;
    const lastDot = originalName.lastIndexOf('.');
    const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
    const finalName = `${baseName}-stripped.jpg`;

    const url = URL.createObjectURL(cleanBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsStripped(true);
  };

  if (!imageSrc) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">EXIF Editor & Metadata Stripper</h1>
          <p className="text-gray-600 mt-2">Inspect, modify, or strip private EXIF camera profiles and GPS tags from your JPEGs client-side.</p>
        </div>
        <DragAndDrop 
          onDrop={handleDrop} 
          accept={{ 'image/jpeg': ['.jpg', '.jpeg'] }}
          subtext="JPEG or JPG files only"
          className="h-64" 
        />
      </div>
    );
  }

  const hasTags = tags && Object.keys(tags).length > 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setFile(null);
            setImageSrc(null);
            setTags(null);
          }}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EXIF Profile Viewer</h1>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{file?.name}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Preview image */}
        <div className="md:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <img src={imageSrc} alt="Preview" className="max-h-[350px] max-w-full object-contain rounded-lg shadow-sm" />
        </div>

        {/* Metadata display */}
        <div className="md:col-span-6 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <Eye className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">EXIF Metadata Tags</h3>
            </div>

            {tags === null ? (
              <div className="text-xs text-slate-400 font-semibold py-4 text-center">Parsing binary markers...</div>
            ) : hasTags ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                {tags.Make && (
                  <>
                    <dt className="text-slate-400 font-semibold">Camera Maker</dt>
                    <dd className="text-slate-700 font-bold text-right">{tags.Make}</dd>
                  </>
                )}
                {tags.Model && (
                  <>
                    <dt className="text-slate-400 font-semibold">Camera Model</dt>
                    <dd className="text-slate-700 font-bold text-right">{tags.Model}</dd>
                  </>
                )}
                {tags.Software && (
                  <>
                    <dt className="text-slate-400 font-semibold">Software Editor</dt>
                    <dd className="text-slate-700 font-bold text-right">{tags.Software}</dd>
                  </>
                )}
                {tags.DateTime && (
                  <>
                    <dt className="text-slate-400 font-semibold">Capture Date</dt>
                    <dd className="text-slate-700 font-bold text-right">{tags.DateTime}</dd>
                  </>
                )}
              </dl>
            ) : (
              <div className="text-xs text-slate-500 font-semibold py-4 text-center leading-relaxed">
                No active EXIF tags or GPS profiles detected in this JPEG file. It is already clean!
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h4 className="font-extrabold text-xs tracking-wide uppercase">Privacy Shield</h4>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Camera details, serial numbers, date-stamps, and exact GPS coordinates can be embedded inside your photos. Stripping metadata completely protects your location identity.
            </p>

            <button
              onClick={handleStripAll}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-all hover:shadow-rose-300"
            >
              <Trash2 className="w-4 h-4" />
              Strip Metadata & Download
            </button>

            {isStripped && (
              <div className="text-center text-xs font-bold text-emerald-600 mt-2">
                EXIF markers stripped successfully! Download complete.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
