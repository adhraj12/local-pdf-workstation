import { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  Key, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// Custom inline MD5 implementation for client-side environments (where Web Crypto does not provide MD5)
function calcMD5(str: string): string {
  const utf8 = new TextEncoder().encode(str);
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= utf8[i] << ((i % 4) * 8);
  }
  const len = utf8.length;
  words[len >> 2] |= 0x80 << ((len % 4) * 8);
  const wordCount = ((len + 8) >> 6) * 16 + 14;
  while (words.length < wordCount) words.push(0);
  words.push(len * 8);
  words.push(0);
  
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;
  
  const r = [
    7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
    5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
    4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
    6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21
  ];
  
  const k = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];
  
  for (let i = 0; i < words.length; i += 16) {
    let tempA = a;
    let tempB = b;
    let tempC = c;
    let tempD = d;
    
    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) {
        f = (tempB & tempC) | (~tempB & tempD);
        g = j;
      } else if (j < 32) {
        f = (tempD & tempB) | (~tempD & tempC);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = tempB ^ tempC ^ tempD;
        g = (3 * j + 5) % 16;
      } else {
        f = tempC ^ (tempB | ~tempD);
        g = (7 * j) % 16;
      }
      
      const temp = tempD;
      tempD = tempC;
      tempC = tempB;
      
      const sum = (a + f + k[j] + words[i + g]) | 0;
      const rotated = (sum << r[j]) | (sum >>> (32 - r[j]));
      tempB = (tempB + rotated) | 0;
      a = temp;
    }
    
    a = (a + tempA) | 0;
    b = (b + tempB) | 0;
    c = (c + tempC) | 0;
    d = (d + tempD) | 0;
  }
  
  return [a, b, c, d].map(val => {
    let hex = '';
    for (let i = 0; i < 4; i++) {
      hex += ((val >> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return hex;
  }).join('');
}

// Convert ArrayBuffer to Base64 string safely
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string to ArrayBuffer safely
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// PBKDF2 Key Derivation function for AES
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Native AES-256-GCM Encryption
async function encryptAES(plainText: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
  
  return bufferToBase64(combined.buffer);
}

// Native AES-256-GCM Decryption
async function decryptAES(cipherTextBase64: string, password: string): Promise<string> {
  const combinedBuffer = base64ToBuffer(cipherTextBase64);
  const combined = new Uint8Array(combinedBuffer);
  
  if (combined.length < 28) {
    throw new Error('Invalid input: payload structure too short.');
  }
  
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encryptedData = combined.slice(28);
  
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData);
  
  return new TextDecoder().decode(decrypted);
}

export function CryptoHash() {
  const [activeTab, setActiveTab] = useState<'hashing' | 'cipher'>('hashing');

  // Hashing State
  const [inputText, setInputText] = useState('');
  const [md5Val, setMd5Val] = useState('');
  const [sha1Val, setSha1Val] = useState('');
  const [sha256Val, setSha256Val] = useState('');
  const [sha512Val, setSha512Val] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cipher State
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cipherInput, setCipherInput] = useState('');
  const [cipherOutput, setCipherOutput] = useState('');
  const [cipherMode, setCipherMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [cipherError, setCipherError] = useState<string | null>(null);
  const [cipherSuccess, setCipherSuccess] = useState(false);

  // Auto hash calculation trigger
  useEffect(() => {
    if (!inputText) {
      setMd5Val('');
      setSha1Val('');
      setSha256Val('');
      setSha512Val('');
      return;
    }

    // MD5 (Custom)
    setMd5Val(calcMD5(inputText));

    // Web Crypto API Hashes
    const encoder = new TextEncoder();
    const data = encoder.encode(inputText);

    const calcHash = async (algo: string, setter: (val: string) => void) => {
      try {
        const hashBuffer = await crypto.subtle.digest(algo, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setter(hashHex);
      } catch (err) {
        console.error(`Hash error for ${algo}:`, err);
        setter('Hashing Error');
      }
    };

    calcHash('SHA-1', setSha1Val);
    calcHash('SHA-256', setSha256Val);
    calcHash('SHA-512', setSha512Val);
  }, [inputText]);

  const handleCopyHash = async (value: string, key: string) => {
    if (!value || value === 'Hashing Error') return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCipherAction = async () => {
    setCipherError(null);
    setCipherSuccess(false);

    if (!password) {
      setCipherError('Password key is required.');
      return;
    }
    if (!cipherInput.trim()) {
      setCipherError('Please provide input text to process.');
      return;
    }

    try {
      if (cipherMode === 'encrypt') {
        const encrypted = await encryptAES(cipherInput, password);
        setCipherOutput(encrypted);
        setCipherSuccess(true);
      } else {
        const decrypted = await decryptAES(cipherInput, password);
        setCipherOutput(decrypted);
        setCipherSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      if (cipherMode === 'encrypt') {
        setCipherError('Failed to encrypt text.');
      } else {
        setCipherError('Decryption failed. Please check password key or ciphertext.');
      }
    }
  };

  const swapCipherMode = () => {
    setCipherMode(prev => prev === 'encrypt' ? 'decrypt' : 'encrypt');
    setCipherInput(cipherOutput);
    setCipherOutput('');
    setCipherError(null);
    setCipherSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Fingerprint className="w-8 h-8 text-indigo-600" />
            Crypto & Hash Generator
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Generate digests (MD5, SHA-1, SHA-256/512) and secure text encryption via military-grade AES-256.
          </p>
        </div>

        {/* Workspace Mode Selector */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('hashing')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'hashing' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Hash Generator
          </button>
          <button
            onClick={() => setActiveTab('cipher')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cipher' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            AES Cipher
          </button>
        </div>
      </div>

      {/* Tabs panels */}
      {activeTab === 'hashing' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Hashing Input (Left) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Text Input
                </span>
                {inputText && (
                  <button
                    onClick={() => setInputText('')}
                    className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                    title="Clear input"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste text to hash instantly..."
                rows={10}
                className="w-full p-5 font-mono text-sm leading-relaxed border-0 focus:ring-0 focus:outline-none bg-white text-slate-800 resize-none"
              />
            </div>
          </div>

          {/* Digests Display (Right) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Cryptographic Digests</h3>
              
              {/* MD5 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>MD5 Hash</span>
                  {md5Val && (
                    <button
                      onClick={() => handleCopyHash(md5Val, 'md5')}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {copiedKey === 'md5' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'md5' ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <div className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-mono text-xs text-slate-700 break-all select-all min-h-[40px] flex items-center">
                  {md5Val || <span className="text-slate-400 font-sans italic">Awaiting input...</span>}
                </div>
              </div>

              {/* SHA-1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>SHA-1 Hash</span>
                  {sha1Val && (
                    <button
                      onClick={() => handleCopyHash(sha1Val, 'sha1')}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {copiedKey === 'sha1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'sha1' ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <div className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-mono text-xs text-slate-700 break-all select-all min-h-[40px] flex items-center">
                  {sha1Val || <span className="text-slate-400 font-sans italic">Awaiting input...</span>}
                </div>
              </div>

              {/* SHA-256 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>SHA-256 Hash</span>
                  {sha256Val && (
                    <button
                      onClick={() => handleCopyHash(sha256Val, 'sha256')}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'sha256' ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <div className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-mono text-xs text-slate-700 break-all select-all min-h-[40px] flex items-center">
                  {sha256Val || <span className="text-slate-400 font-sans italic">Awaiting input...</span>}
                </div>
              </div>

              {/* SHA-512 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>SHA-512 Hash</span>
                  {sha512Val && (
                    <button
                      onClick={() => handleCopyHash(sha512Val, 'sha512')}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {copiedKey === 'sha512' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'sha512' ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <div className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-mono text-xs text-slate-700 break-all select-all min-h-[40px] flex items-center">
                  {sha512Val || <span className="text-slate-400 font-sans italic">Awaiting input...</span>}
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        // AES Encryptor / Decryptor Workspace
        <div className="space-y-6">
          {/* Key/Password Block */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-indigo-500" />
              Security Credentials
            </h3>
            <div className="max-w-md space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Secret Password Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter custom AES passphrase..."
                  className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Cipher workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Input card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">
                  {cipherMode === 'encrypt' ? 'Plain Text Input' : 'Ciphertext (Base64) Input'}
                </span>
                <button
                  onClick={() => setCipherInput('')}
                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={cipherInput}
                onChange={(e) => setCipherInput(e.target.value)}
                placeholder={cipherMode === 'encrypt' ? 'Type sensitive message to encrypt...' : 'Paste base64 ciphertext to decrypt...'}
                rows={8}
                className="w-full p-5 font-mono text-sm leading-relaxed border-0 focus:ring-0 focus:outline-none bg-white text-slate-800 resize-none flex-1 min-h-[220px]"
              />
            </div>

            {/* Output card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">
                  {cipherMode === 'encrypt' ? 'Ciphertext Output' : 'Decrypted Plain Text Output'}
                </span>
                {cipherOutput && (
                  <button
                    onClick={() => handleCopyHash(cipherOutput, 'cipherOut')}
                    className="p-1.5 hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 rounded transition-colors flex items-center gap-1 text-[10px] font-bold"
                  >
                    {copiedKey === 'cipherOut' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'cipherOut' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="p-5 font-mono text-sm leading-relaxed bg-slate-50/50 text-slate-800 overflow-auto flex-1 min-h-[220px] select-all break-all whitespace-pre-wrap">
                {cipherOutput || (
                  <span className="text-slate-400 font-sans italic">
                    Output will appear here after clicking execution...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trigger controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={swapCipherMode}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Swap Encrypt/Decrypt
            </button>

            <div className="flex items-center gap-3">
              {cipherError && (
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl flex items-center gap-1.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  {cipherError}
                </span>
              )}
              {cipherSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Successful!
                </span>
              )}
              <button
                onClick={handleCipherAction}
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all"
              >
                {cipherMode === 'encrypt' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Encrypt Payload
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Decrypt Payload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
