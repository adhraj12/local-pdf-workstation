import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileStack,
  Scissors,
  RotateCw,
  LayoutGrid,
  Minimize2,
  PenLine,
  Lock,
  Unlock,
  Image as ImageIcon,
  Camera,
  Stamp,
  Hash,
  Pencil,
  Search,
  Star,
  ArrowRight,
  Shield,
  Code,
  Heart,
  X,
  Sparkles,
  AlertCircle,
  Type,
  ChevronDown,
  Plus,
  Crop,
  RefreshCw,
  Info,
  Smile,
  EyeOff,
  Palette,
  FileImage,
  Scaling,
  QrCode,
  Scan,
  GitCompare,
  BarChart3,
  Braces,
  Fingerprint
} from 'lucide-react';

const ALL_TOOLS_DATA = [
  {
    name: 'PDF Merge',
    description: 'Merge multiple PDF files into one.',
    path: '/merge',
    icon: FileStack,
    category: 'pdf',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50 border border-rose-100',
    popular: true
  },
  {
    name: 'PDF Split',
    description: 'Split a PDF into multiple files.',
    path: '/split',
    icon: Scissors,
    category: 'pdf',
    iconColor: 'text-pink-500',
    bgColor: 'bg-pink-50 border border-pink-100',
    popular: true
  },
  {
    name: 'Compress PDF',
    description: 'Reduce PDF file size without losing quality.',
    path: '/compress',
    icon: Minimize2,
    category: 'pdf',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50 border border-rose-100',
    popular: true
  },
  {
    name: 'Rotate PDF',
    description: 'Rotate PDF pages left or right.',
    path: '/rotate',
    icon: RotateCw,
    category: 'pdf',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50 border border-rose-100',
    popular: false
  },
  {
    name: 'Unlock PDF',
    description: 'Remove password protection from PDF.',
    path: '/unlock',
    icon: Unlock,
    category: 'pdf',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50 border border-rose-100',
    popular: false
  },
  {
    name: 'Protect PDF',
    description: 'Add password protection to PDF files.',
    path: '/protect',
    icon: Lock,
    category: 'pdf',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50 border border-rose-100',
    popular: true
  },
  {
    name: 'Organize PDF',
    description: 'Rearrange, delete or move pages in a PDF.',
    path: '/organize',
    icon: LayoutGrid,
    category: 'pdf',
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50 border border-indigo-100',
    popular: false
  },
  {
    name: 'Sign PDF',
    description: 'Add digital signatures or drawings to PDF.',
    path: '/sign',
    icon: PenLine,
    category: 'pdf',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 border border-blue-100',
    popular: true
  },
  {
    name: 'JPG to PDF',
    description: 'Convert JPG, PNG, and WebP images to PDF.',
    path: '/jpg-to-pdf',
    icon: ImageIcon,
    category: 'pdf',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: true
  },
  {
    name: 'Scan to PDF',
    description: 'Scan document pages using your device camera.',
    path: '/scan',
    icon: Camera,
    category: 'pdf',
    iconColor: 'text-teal-500',
    bgColor: 'bg-teal-50 border border-teal-100',
    popular: false
  },
  {
    name: 'Watermark PDF',
    description: 'Add text watermarks to your PDF pages.',
    path: '/watermark',
    icon: Stamp,
    category: 'pdf',
    iconColor: 'text-violet-500',
    bgColor: 'bg-violet-50 border border-violet-100',
    popular: false
  },
  {
    name: 'Page Numbers',
    description: 'Add customizable page numbers to your PDF.',
    path: '/page-numbers',
    icon: Hash,
    category: 'pdf',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 border border-purple-100',
    popular: false
  },
  {
    name: 'Edit PDF',
    description: 'Add text annotations, shapes, and images to a PDF.',
    path: '/edit',
    icon: Pencil,
    category: 'pdf',
    iconColor: 'text-sky-500',
    bgColor: 'bg-sky-50 border border-sky-100',
    popular: true
  },
  {
    name: 'Crop & Rotate Image',
    description: 'Crop, rotate, and flip images client-side.',
    path: '/crop-image',
    icon: Crop,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: true
  },
  {
    name: 'Image Converter',
    description: 'Convert between PNG, JPG, WebP, GIF, and BMP formats.',
    path: '/convert-image',
    icon: RefreshCw,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'Compress Image',
    description: 'Optimize and reduce file size client-side.',
    path: '/compress-image',
    icon: Minimize2,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'Resize Image',
    description: 'Adjust photo dimensions by scale or exact pixel boundaries.',
    path: '/resize-image',
    icon: Scaling,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'EXIF Editor',
    description: 'View, edit, or strip metadata from photos.',
    path: '/exif-editor',
    icon: Info,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'Watermark Image',
    description: 'Apply text or image overlays onto your photos.',
    path: '/watermark-image',
    icon: Stamp,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'Meme Generator',
    description: 'Create classic memes with custom text captions.',
    path: '/meme-generator',
    icon: Smile,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'Steganography',
    description: 'Hide secret text messages inside pixels.',
    path: '/steganography',
    icon: EyeOff,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'Color Palette',
    description: 'Pick colors and extract dominant palettes.',
    path: '/color-palette',
    icon: Palette,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'Favicon Generator',
    description: 'Create website .ico favicons and touch icons.',
    path: '/favicon-generator',
    icon: FileImage,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'QR Code Generator',
    description: 'Generate custom QR codes with color gradients and logos.',
    path: '/qr-generator',
    icon: QrCode,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'QR Code Scanner',
    description: 'Scan QR codes offline from images or webcams.',
    path: '/qr-scanner',
    icon: Scan,
    category: 'image',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border border-emerald-100',
    popular: false
  },
  {
    name: 'Case & Formatter',
    description: 'Convert text cases, sort lines, trim, prepend/append text.',
    path: '/text-formatter',
    icon: Type,
    category: 'text',
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50 border border-indigo-100',
    popular: true
  },
  {
    name: 'Text Diff Checker',
    description: 'Compare two text blocks side-by-side and highlight differences.',
    path: '/text-diff',
    icon: GitCompare,
    category: 'text',
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50 border border-indigo-100',
    popular: true
  },
  {
    name: 'Word Counter & Stats',
    description: 'Count characters, words, sentences, reading time, and density stats.',
    path: '/word-counter',
    icon: BarChart3,
    category: 'text',
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50 border border-indigo-100',
    popular: false
  },
  {
    name: 'JSON Formatter & Validator',
    description: 'Beautify, minify, validate syntax, and explore JSON in a collapsible tree.',
    path: '/json-formatter',
    icon: Braces,
    category: 'text',
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50 border border-indigo-100',
    popular: true
  },
  {
    name: 'Crypto & Hash Generator',
    description: 'Generate MD5/SHA hashes and encrypt/decrypt text using AES-256.',
    path: '/crypto-hash',
    icon: Fingerprint,
    category: 'text',
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50 border border-indigo-100',
    popular: false
  }
];

export function Tools() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState('popular');
  const [modalContent, setModalContent] = useState<{ title: string; type: string } | null>(null);

  // Initialize selectedCategory from search query string or default to 'all'
  const selectedCategory = searchParams.get('category') || 'all';

  // Load favorites from local storage
  useEffect(() => {
    const saved = localStorage.getItem('clientside_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-tools-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFavorite = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(path)) {
      updated = favorites.filter(p => p !== path);
    } else {
      updated = [...favorites, path];
    }
    setFavorites(updated);
    localStorage.setItem('clientside_favorites', JSON.stringify(updated));
  };

  const handleCategoryChange = (category: string) => {
    if (category === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category });
    }
  };

  // Filter tools
  const filteredTools = ALL_TOOLS_DATA.filter((tool) => {
    // Category match
    const categoryMatch = selectedCategory === 'all' || tool.category === selectedCategory;

    // Search query match
    const nameMatch = tool.name.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const searchMatch = searchQuery.trim() === '' || nameMatch || descMatch;

    return categoryMatch && searchMatch;
  });

  // Sort tools
  const sortedTools = [...filteredTools].sort((a, b) => {
    if (sortOption === 'popular') {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'az') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'za') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  const getPdfCount = () => {
    return ALL_TOOLS_DATA.filter(t => t.category === 'pdf').length;
  };

  const getImageCount = () => {
    return ALL_TOOLS_DATA.filter(t => t.category === 'image').length;
  };

  const getTextCount = () => {
    return ALL_TOOLS_DATA.filter(t => t.category === 'text').length;
  };

  const totalCount = ALL_TOOLS_DATA.length;

  const categoriesSidebar = [
    { id: 'all', name: 'All Tools', count: totalCount },
    { id: 'pdf', name: 'PDF Tools', count: getPdfCount() },
    { id: 'image', name: 'Image Tools', count: getImageCount() },
    { id: 'text', name: 'Text Tools', count: getTextCount() },
    { id: 'developer', name: 'Developer Tools', count: 0 },
    { id: 'converter', name: 'Converter Tools', count: 0 },
    { id: 'security', name: 'Security Tools', count: 0 },
    { id: 'utility', name: 'Utility Tools', count: 0 },
    { id: 'other', name: 'Other Tools', count: 0 }
  ];

  const categoriesPills = [
    { id: 'all', name: 'All Tools' },
    { id: 'pdf', name: 'PDF' },
    { id: 'image', name: 'Image' },
    { id: 'text', name: 'Text' },
    { id: 'developer', name: 'Developer' },
    { id: 'other', name: 'Other' }
  ];

  return (
    <div className="relative min-h-screen bg-[#fafbff]">
      {/* Background Blobs Container - clips all background shape overflows perfectly */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Top Left Organic Background Wave/Curve */}
        <div className="absolute top-0 left-0 w-[480px] h-[580px] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 480 580" fill="none">
            <path
              d="M 0 0 
                 H 380 
                 C 380 130, 270 170, 230 230 
                 C 180 300, 250 390, 190 470 
                 C 150 520, 80 550, 0 570 
                 Z" 
              fill="#f3f8fe" 
            />
            <path
              d="M 380 0 
                 C 380 130, 270 170, 230 230 
                 C 180 300, 250 390, 190 470 
                 C 150 520, 80 550, 0 570" 
              stroke="#d6e6f9" 
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Decorative background blurs */}
        <div className="absolute top-[25%] right-[-10%] w-[60%] h-[40%] bg-blob-purple blur-[120px]" />
        <div className="absolute bottom-[15%] left-[5%] w-[45%] h-[35%] bg-blob-green blur-[90px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[45%] bg-blob-yellow blur-[100px]" />
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          {/* Folded Paper Plane Logo */}
          <svg className="w-8.5 h-8.5 transform rotate-[10deg] translate-y-[-1px]" viewBox="0 0 32 32" fill="none">
            <path d="M26 6L6 17L17 21L26 6Z" fill="#38bdf8" />
            <path d="M26 6L13 18L17 21L26 6Z" fill="#0284c7" />
            <path d="M26 6L17 21L22 28L26 6Z" fill="#1d4ed8" />
            <path d="M17 21L17 25L22 21L17 21Z" fill="#1e3a8a" />
          </svg>
          <span className="text-[20px] tracking-tight text-slate-900 font-sans">
            <span className="font-bold">ClientSide</span>{' '}
            <span className="font-medium text-slate-700">Tools</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors">Tools</button>
          <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors">How it works</button>
          <button onClick={() => setModalContent({ title: 'Privacy Policy', type: 'privacy' })} className="hover:text-slate-900 transition-colors">Privacy</button>
          <button onClick={() => setModalContent({ title: 'About ClientSide Tools', type: 'about' })} className="hover:text-slate-900 transition-colors">About</button>
        </nav>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-100 bg-[#eaf7ee] text-[#1e7e34] text-[11px] font-extrabold tracking-wide uppercase shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1e7e34] animate-pulse" />
            100% Client-Side
          </span>
        </div>
      </header>

      {/* Sub-Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 grid lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-[11px] font-extrabold tracking-wider text-indigo-600 uppercase">
              ALL TOOLS
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800 leading-[1.1]">
            Everything you need.<br />
            Nothing leaves{' '}
            <span className="relative inline-block text-[#3b82f6]">
              your device.
              <svg className="absolute left-0 bottom-[-10px] w-full h-[10px] text-[#709bfd]" viewBox="0 0 100 8" fill="none" preserveAspectRatio="none">
                <path d="M2 3 C 30 1, 70 1.5, 98 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M6 6 C 35 4, 75 4.5, 94 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="text-[16px] text-slate-500 font-medium leading-[1.6]">
            Every tool runs directly in your browser. Your files stay private, always.
          </p>
        </div>

        <div className="lg:col-span-6 flex justify-center lg:justify-end select-none">
          <div className="relative w-full max-w-[420px] h-[280px]">
            {/* Tilted Card Illustration */}
            <div className="absolute inset-0 bg-white border border-slate-100 rounded-3xl shadow-xl transform rotate-[2.5deg] flex flex-col p-6 space-y-6">
              {/* Header inside illustration */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="w-24 h-2 rounded bg-slate-100" />
              </div>

              {/* Grid of Icons inside illustration */}
              <div className="grid grid-cols-3 gap-5 flex-1">
                <div className="bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500 p-3">
                  <Scissors className="w-6 h-6" />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-500 p-3">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-500 p-3">
                  <Code className="w-6 h-6" />
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-purple-500 p-3">
                  <Type className="w-6 h-6" />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-500 p-3">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-500 p-3">
                  <Lock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Framing illustrations around card */}
            <div className="absolute top-[-30px] left-[-30px] w-12 h-12 bg-amber-400/20 rounded-full blur-md" />
            <div className="absolute bottom-[-15px] left-[-10px] text-emerald-600/60 transform -rotate-[15deg]">
              <svg className="w-12 h-12 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tools Browser Section */}
      <section className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        {/* Search, Pills, and Sorting Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
          {/* Search Input Container */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              id="search-tools-input"
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-14 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-all"
            />
            <kbd className="absolute right-4 top-3.5 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-extrabold text-slate-400 select-none pointer-events-none">
              ⌘ K
            </kbd>
          </div>

          {/* Category Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
            {categoriesPills.map((pill) => {
              const isActive = selectedCategory === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => handleCategoryChange(pill.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-white border border-slate-100 text-slate-500 hover:text-slate-800 hover:border-slate-200'
                  }`}
                >
                  {pill.name}
                </button>
              );
            })}
          </div>

          {/* Sort Option Selection */}
          <div className="relative w-full md:w-auto shrink-0 flex justify-end">
            <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm text-xs font-bold text-slate-600 cursor-pointer hover:border-slate-200 transition-colors">
              <span>Sort: {sortOption === 'popular' ? 'Popular' : sortOption === 'az' ? 'A-Z' : 'Z-A'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                <option value="popular">Popular</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sidebar & Dashboard Tools Grid */}
        <div className="grid lg:grid-cols-12 gap-12 pt-8 items-start">
          {/* Sidebar on the Left */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Category Listing Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-1.5">
              {categoriesSidebar.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sidebar Promo Box 1: Privacy by Design */}
            <div className="bg-[#eaf7ee]/80 border border-emerald-100/60 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="p-3 bg-white border border-emerald-100 rounded-2xl text-emerald-600 inline-block">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-sm">Private by design</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  No uploads. No tracking. No data collection.
                </p>
              </div>
              <button
                onClick={() => setModalContent({ title: 'Privacy Policy', type: 'privacy' })}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sidebar Promo Box 2: Open Source */}
            <div className="bg-blue-50/50 border border-blue-100/60 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="p-3 bg-white border border-blue-100 rounded-2xl text-blue-600 inline-block">
                <Code className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-sm">Open Source</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Built with transparency. Trusted by the community.
                </p>
              </div>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                View on GitHub <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </aside>

          {/* Tools Dashboard Grid on the Right */}
          <main className="lg:col-span-9 space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTools.map((tool) => {
                const isFavorite = favorites.includes(tool.path);
                return (
                  <div
                    key={tool.path}
                    onClick={() => navigate(tool.path)}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative group"
                  >
                    {/* Favorite Star Button */}
                    <button
                      onClick={(e) => toggleFavorite(tool.path, e)}
                      className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-slate-50 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <div className="space-y-4">
                      {/* Icon */}
                      <div className={`p-3.5 rounded-2xl inline-block ${tool.bgColor} shadow-sm group-hover:scale-105 transition-transform`}>
                        <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5">
                        <h3 className="font-extrabold text-slate-800 text-[15px] group-hover:text-blue-600 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    {/* Category Label Badge */}
                    <div className="mt-5 pt-3 border-t border-slate-50 flex">
                      <span className="px-2.5 py-0.75 bg-rose-50 border border-rose-100 rounded-full text-[9px] font-extrabold text-rose-500 uppercase">
                        {tool.category}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* "More tools coming soon" card */}
              <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[190px]">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-700 text-xs">More tools coming soon</h4>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-[180px] leading-relaxed">
                    We're building more client-side tools. Stay tuned!
                  </p>
                </div>
              </div>
            </div>

            {/* Empty Search/Filter State */}
            {sortedTools.length === 0 && (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mx-auto shadow-sm">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-base">No tools found</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
                    We couldn't find any tools matching your search. Choose another category or try a different search query.
                  </p>
                </div>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 transition-all"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </section>

      {/* Decorative call-to-action features grid just above footer */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs">Blazing Fast</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                No uploads, no waiting. Everything runs locally inside your browser.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs">100% Private</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Your files never leave your device. We can't see them even if we wanted to.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 shadow-sm shrink-0">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs">Lightweight</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Each tool is just a few KB of JavaScript. Fast to load, fast to run.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 shadow-sm shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs">Free & Open</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Free to use. Open source. Built for the community, by the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 text-xs font-semibold text-slate-400">
        <div>
          <span>© 2024 ClientSide Tools</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-700 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            Open Source
          </a>
          <span className="flex items-center gap-1.5 cursor-help hover:text-slate-700 transition-colors">
            <Shield className="w-3.5 h-3.5" />
            No Tracking
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span>Made with</span>
          <svg className="w-3.5 h-3.5 text-rose-500 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalContent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl relative z-10 space-y-6"
            >
              <button
                onClick={() => setModalContent(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                {modalContent.type === 'privacy' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600">
                    <Shield className="w-6 h-6" />
                  </div>
                )}
                {modalContent.type === 'about' && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                )}
                {!['privacy', 'about'].includes(modalContent.type) && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                )}
                <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{modalContent.title}</h3>
              </div>

              <div className="text-slate-500 text-sm font-medium leading-relaxed space-y-3">
                {modalContent.type === 'privacy' ? (
                  <>
                    <p>At ClientSide Tools, privacy isn't a setting—it is the core architecture.</p>
                    <p>We send the web application's scripts once to your browser. From that moment, 100% of processing happens locally on your computer.</p>
                    <p><strong>No files are ever uploaded to any servers.</strong> You can disable your internet connection entirely after loading this page, and the tools will still function perfectly.</p>
                  </>
                ) : (
                  <>
                    <p>ClientSide Tools is a curated collection of secure, local-first web instruments built to optimize everyday workflows without sacrificing security or privacy.</p>
                    <p>Traditional tools require you to upload private documents, contracts, and passwords to remote servers, exposing you to data leaks.</p>
                    <p>We leverage modern browser capabilities, WebAssembly, and local JS runtimes to do all computations entirely on the client-side.</p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
