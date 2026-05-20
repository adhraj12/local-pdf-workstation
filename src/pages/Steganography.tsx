import { useState } from 'react';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';

export function Steganography() {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Encode settings
  const [secretText, setSecretText] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Decode output
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const imgFile = acceptedFiles[0];
    setFile(imgFile);
    setDecodedMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(imgFile);
  };

  const handleReset = () => {
    setFile(null);
    setImageSrc(null);
    setSecretText('');
    setPassword('');
    setDecodedMessage(null);
  };

  // Steganography LSB Encode
  const handleEncode = () => {
    if (!imageSrc || !file || !secretText.trim()) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // XOR encrypt the message with the password key
      let encryptedText = secretText;
      if (password) {
        encryptedText = Array.from(secretText)
          .map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ password.charCodeAt(index % password.length)))
          .join('');
      }

      // Convert characters to a binary stream
      // We append a null-terminator \0 to mark the end of the text
      const binaryData: number[] = [];
      const textToEncode = encryptedText + '\0';
      for (let i = 0; i < textToEncode.length; i++) {
        const charCode = textToEncode.charCodeAt(i);
        for (let bit = 7; bit >= 0; bit--) {
          binaryData.push((charCode >> bit) & 1);
        }
      }

      if (binaryData.length > data.length) {
        alert("The secret message is too long for this small image. Please choose a larger image.");
        setIsProcessing(false);
        return;
      }

      // Embed bits into LSB of RGB elements (skipping alpha to prevent transparency glitches)
      let bitIndex = 0;
      for (let i = 0; i < data.length; i += 4) {
        for (let offset = 0; offset < 3; offset++) { // R, G, B channels
          if (bitIndex < binaryData.length) {
            // Force LSB to match the message bit
            data[i + offset] = (data[i + offset] & 0xFE) | binaryData[bitIndex];
            bitIndex++;
          } else {
            break;
          }
        }
        if (bitIndex >= binaryData.length) break;
      }

      ctx.putImageData(imgData, 0, 0);

      // Save as lossless PNG (lossy formats like JPEG corrupt LSB bits)
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Could not encode image.');
          setIsProcessing(false);
          return;
        }

        const originalName = file.name;
        const lastDot = originalName.lastIndexOf('.');
        const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
        const finalName = `${baseName}-stego.png`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsProcessing(false);
      }, 'image/png');
    };
    img.src = imageSrc;
  };

  // Steganography LSB Decode
  const handleDecode = () => {
    if (!imageSrc || !file) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Extract bits
      const binaryData: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        for (let offset = 0; offset < 3; offset++) {
          binaryData.push(data[i + offset] & 1);
        }
      }

      // Reconstruct characters from 8-bit frames
      const chars: string[] = [];
      let currentCharCode = 0;
      let bitCount = 0;

      for (let i = 0; i < binaryData.length; i++) {
        currentCharCode = (currentCharCode << 1) | binaryData[i];
        bitCount++;

        if (bitCount === 8) {
          if (currentCharCode === 0) {
            break; // Stop at null terminator
          }
          chars.push(String.fromCharCode(currentCharCode));
          currentCharCode = 0;
          bitCount = 0;
        }
      }

      const extractedEncryptedText = chars.join('');

      // XOR decrypt if password is provided
      let decryptedText = extractedEncryptedText;
      if (password) {
        decryptedText = Array.from(extractedEncryptedText)
          .map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ password.charCodeAt(index % password.length)))
          .join('');
      }

      // Quick sanity check: check if it's readable ascii
      const isReadable = /^[\s\x20-\x7E\r\n]*$/.test(decryptedText);
      if (!isReadable || decryptedText.length === 0) {
        setDecodedMessage("Incorrect password key, or the image does not contain a hidden message.");
      } else {
        setDecodedMessage(decryptedText);
      }
      setIsProcessing(false);
    };
    img.src = imageSrc;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Image Steganography</h1>
          <p className="text-gray-600 mt-2">Hide private text messages inside image pixels using lossless LSB encoding, or extract them.</p>
        </div>

        <div className="flex bg-slate-100 rounded-2xl p-1 shrink-0 self-start">
          <button
            onClick={() => {
              setActiveTab('encode');
              handleReset();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'encode' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Encode
          </button>
          <button
            onClick={() => {
              setActiveTab('decode');
              handleReset();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'decode' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Decode
          </button>
        </div>
      </div>

      {!imageSrc ? (
        <DragAndDrop
          onDrop={handleDrop}
          accept={{ 'image/png': ['.png'] }}
          subtext="PNG lossless images only (lossy formats corrupt pixel bits)"
          className="h-64"
        />
      ) : (
        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Preview panel */}
          <div className="md:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4 items-center">
            <img src={imageSrc} alt="stego-file" className="max-h-[260px] max-w-full object-contain rounded-lg shadow-sm" />
            <div className="text-center w-full">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Selected File</span>
              <span className="text-xs font-bold text-slate-700 truncate block max-w-[200px] mx-auto">{file?.name}</span>
            </div>
            <button
              onClick={handleReset}
              className="text-[10px] font-extrabold text-rose-500 hover:underline"
            >
              Choose Different Image
            </button>
          </div>

          {/* Action inputs */}
          <div className="md:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            {activeTab === 'encode' ? (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Secret message</label>
                  <textarea
                    rows={4}
                    value={secretText}
                    onChange={(e) => setSecretText(e.target.value)}
                    placeholder="Type your confidential message here..."
                    className="w-full px-3.5 py-3 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Password Key (Optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to mask text bytes..."
                    className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300"
                  />
                </div>

                <button
                  onClick={handleEncode}
                  disabled={isProcessing || !secretText.trim()}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:shadow-emerald-300 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Encoding & Packing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Encode Message & Download PNG
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Password Key (If any)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter decryption password key..."
                    className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-300"
                  />
                </div>

                <button
                  onClick={handleDecode}
                  disabled={isProcessing}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all hover:shadow-indigo-300 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Decoding bits...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      Extract & Decrypt Message
                    </>
                  )}
                </button>

                {decodedMessage !== null && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Decoded output</span>
                    <p className="text-xs font-bold text-slate-800 break-words whitespace-pre-wrap">{decodedMessage}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
