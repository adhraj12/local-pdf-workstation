import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Zap,
  Code,
  FolderPlus,
  Rocket,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
  Type,
  LayoutGrid
} from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState<{ title: string; type: string } | null>(null);

  const handleExplore = (toolType: string) => {
    const categoryMap: { [key: string]: string } = {
      pdf: 'pdf',
      image: 'image',
      text: 'text',
      developer: 'developer',
      more: 'other'
    };
    const mapped = categoryMap[toolType] || 'all';
    navigate(`/tools?category=${mapped}`);
  };

  const features = [
    {
      icon: <Lock className="w-5 h-5 text-[#2e7d32]" />,
      iconBg: 'bg-[#e8f5e9] border border-[#c8e6c9]/20',
      title: 'Privacy',
      descLine1: 'Your data stays',
      descLine2: 'with you'
    },
    {
      icon: <Zap className="w-5 h-5 text-[#1565c0]" />,
      iconBg: 'bg-[#e3f2fd] border border-[#bbdefb]/20',
      title: 'Fast',
      descLine1: 'No uploads.',
      descLine2: 'No waiting.'
    },
    {
      icon: <Code className="w-5 h-5 text-[#6a1b9a]" />,
      iconBg: 'bg-[#f3e5f5] border border-[#e1bee7]/20',
      title: 'Lightweight',
      descLine1: 'Tiny tools.',
      descLine2: 'Big impact.'
    }
  ];

  const steps = [
    {
      number: '1',
      badgeClass: 'bg-[#eaf7ee] text-[#1e7e34] border border-[#1e7e34]/15',
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-[#eaf7ee] border border-[#1e7e34]/15 flex items-center justify-center shadow-sm text-[#1e7e34]">
          <FolderPlus className="w-7 h-7" />
        </div>
      ),
      title: 'You open a tool',
      description: 'No sign-up. No uploads.'
    },
    {
      number: '2',
      badgeClass: 'bg-[#ebf3fe] text-[#1a73e8] border border-[#1a73e8]/15',
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-[#ebf3fe] border border-[#1a73e8]/15 flex items-center justify-center shadow-sm text-[#1a73e8]">
          <Code className="w-7 h-7" />
        </div>
      ),
      title: 'We send the code',
      description: 'A few KB of JavaScript.'
    },
    {
      number: '3',
      badgeClass: 'bg-[#fffbeb] text-[#d97706] border border-[#d97706]/15',
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-[#fffbeb] border border-[#d97706]/15 flex items-center justify-center shadow-sm text-[#d97706]">
          <Rocket className="w-7 h-7" />
        </div>
      ),
      title: 'It runs on your device',
      description: 'Your file never leaves your machine.'
    }
  ];

  const categories = [
    {
      id: 'pdf',
      title: 'PDF Tools',
      description: 'Merge, split, compress, convert and more.',
      icon: <FileText className="w-6 h-6 text-pink-600" />,
      iconBg: 'bg-pink-50 border border-pink-100',
      color: 'pink'
    },
    {
      id: 'image',
      title: 'Image Tools',
      description: 'Convert, resize, compress, crop, and more.',
      icon: <ImageIcon className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border border-emerald-100',
      color: 'emerald'
    },
    {
      id: 'text',
      title: 'Text Tools',
      description: 'Convert case, count, remove, and more.',
      icon: <Type className="w-6 h-6 text-purple-600" />,
      iconBg: 'bg-purple-50 border border-purple-100',
      color: 'purple'
    },
    {
      id: 'developer',
      title: 'Developer Tools',
      description: 'JSON formatter, hash, base64, and more.',
      icon: <Code className="w-6 h-6 text-amber-600" />,
      iconBg: 'bg-amber-50 border border-amber-100',
      color: 'amber'
    },
    {
      id: 'more',
      title: 'And More',
      description: 'Other everyday tools, all in your browser.',
      icon: <LayoutGrid className="w-6 h-6 text-blue-600" />,
      iconBg: 'bg-blue-50 border border-blue-100',
      color: 'blue'
    }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fafbff]">
      {/* Background Blobs Container - clips all background shape overflows perfectly without affecting page scrolling */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Top Left Organic Background Wave/Curve */}
        <div className="absolute top-0 left-0 w-[480px] h-[580px] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 480 580" fill="none">
            {/* Background solid soft blue wave */}
            <path
              d="M 0 0 
                 H 380 
                 C 380 130, 270 170, 230 230 
                 C 180 300, 250 390, 190 470 
                 C 150 520, 80 550, 0 570 
                 Z" 
              fill="#f3f8fe" 
            />
            {/* Wavy blue outline path running along the edge */}
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

        {/* Other background glow elements */}
        <div className="absolute top-[30%] right-[-10%] w-[60%] h-[50%] bg-blob-purple blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[45%] h-[40%] bg-blob-green blur-[90px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[45%] bg-blob-yellow blur-[100px]" />
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2">
          {/* Clean Folded Paper Plane Logo matching reference */}
          <svg className="w-8.5 h-8.5 transform rotate-[10deg] translate-y-[-1px]" viewBox="0 0 32 32" fill="none">
            {/* Left Wing Outer (Lightest blue/cyan) */}
            <path d="M26 6L6 17L17 21L26 6Z" fill="#38bdf8" />
            {/* Left Wing Inner (Medium blue) */}
            <path d="M26 6L13 18L17 21L26 6Z" fill="#0284c7" />
            {/* Right Wing (Darker blue) */}
            <path d="M26 6L17 21L22 28L26 6Z" fill="#1d4ed8" />
            {/* Underneath fold shadow (Dark navy) */}
            <path d="M17 21L17 25L22 21L17 21Z" fill="#1e3a8a" />
          </svg>
          <span className="text-[20px] tracking-tight text-slate-900 font-sans">
            <span className="font-bold">ClientSide</span>{' '}
            <span className="font-medium text-slate-700">Tools</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
          <button onClick={() => scrollToSection('tools')} className="hover:text-slate-800 transition-colors">Tools</button>
          <button onClick={() => scrollToSection('how-it-works')} className="hover:text-slate-800 transition-colors">How it works</button>
          <button onClick={() => setModalContent({ title: 'Privacy Promise', type: 'privacy' })} className="hover:text-slate-800 transition-colors">Privacy</button>
          <button onClick={() => setModalContent({ title: 'About ClientSide Tools', type: 'about' })} className="hover:text-slate-800 transition-colors">About</button>
        </nav>

        <div>
          {/* Styled White/Gray Badge with Green check circle */}
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200/80 bg-white text-slate-700 text-xs font-semibold shadow-sm">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#52c41a] text-white">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            100% Client-Side
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Side */}
        <div className="lg:col-span-6 space-y-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-100 bg-[#eef8f0] text-[#2e7d32] text-[11px] font-extrabold tracking-wide uppercase shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              100% PRIVATE. 100% LOCAL.
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] leading-[1.1] font-black tracking-tight text-slate-800">
              All the tools.<br />
              None of the<br />
              <span className="relative inline-block text-[#3b82f6] mt-1">
                compromises.
                {/* Hand drawn sketchy double-underline exactly matching reference */}
                <svg className="absolute left-0 bottom-[-14px] w-full h-[14px] text-[#709bfd]" viewBox="0 0 100 8" fill="none" preserveAspectRatio="none">
                  <path d="M2 3 C 30 1, 70 1.5, 98 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M6 6 C 35 4, 75 4.5, 94 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="text-[17px] text-slate-500 font-medium leading-[1.6]">
              We run the code, you keep the data.<br />
              All tools run entirely in your browser.<br />
              Your files never leave your device.
            </p>
          </div>

          {/* Feature Badge Grid (Vertical Stacks exactly matching reference) */}
          <div className="grid grid-cols-3 gap-8 pt-4">
            {features.map((feat, i) => (
              <div key={i} className="flex flex-col items-start space-y-4">
                <div className={`p-3.5 rounded-[18px] ${feat.iconBg} shadow-sm`}>
                  {feat.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-sm">{feat.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-[1.5]">
                    {feat.descLine1}<br />
                    {feat.descLine2}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Precise Hand-Drawn Mockup Illustration */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end items-center relative select-none">
          <div className="relative w-full max-w-[550px] h-[430px] lg:scale-[1.18] lg:translate-x-4 origin-center">
            <svg className="w-full h-full" viewBox="0 0 460 360" fill="none">
              {/* Grassy ground oval blob */}
              <path d="M 50 310 Q 230 290 410 310 C 370 335, 90 335, 50 310" fill="#e2f5e8" />

              {/* Soft blue organic blob behind the shield and grass on the right */}
              <path
                d="M 280 230 C 330 190, 420 180, 450 250 C 480 320, 390 350, 330 330 C 270 310, 250 260, 280 230 Z"
                fill="#edf4fc"
                opacity="0.85"
              />

              {/* Sun Graphic with Ray lines (scaled up) */}
              <g transform="translate(345, 45) scale(1.15)">
                <circle cx="25" cy="25" r="28" fill="#fed658" opacity="0.9" />
                {/* Ray strokes */}
                <path d="M -8 25 L -16 25" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 58 25 L 66 25" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 25 -8 L 25 -16" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 25 58 L 25 66" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 2 2 L -5 -5" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 48 2 L 55 -5" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
              </g>

              {/* Trajectory dotted line loop for paper plane */}
              <path
                d="M 120 220 Q 80 180 80 120 C 80 60, 160 80, 150 140 C 140 200, 90 220, 150 110 C 180 60, 210 50, 240 60"
                stroke="#1e293b"
                strokeWidth="1.8"
                strokeDasharray="4 6"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />

              {/* Green Hand-drawn paper plane (scaled up) */}
              <g transform="translate(225, 30) rotate(-15) scale(1.3)">
                <path d="M 0 15 L 30 0 L 15 25 Z" fill="#d1fae5" stroke="#1e293b" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M 30 0 L 12 12 L 15 25" fill="#a7f3d0" stroke="#1e293b" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M 12 12 L 10 20 L 15 25" fill="#34d399" stroke="#1e293b" strokeWidth="1.8" strokeLinejoin="round" />
              </g>

              {/* Hand-drawn Cloud - Left */}
              <path d="M 25 195 C 20 190, 10 190, 5 195 C 0 200, 0 210, 10 213 C 20 215, 30 215, 35 210 C 40 205, 35 195, 25 195 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" strokeLinejoin="round" />

              {/* Hand-drawn Cloud - Right */}
              <path d="M 430 135 C 425 130, 415 130, 410 135 C 405 140, 405 150, 415 153 C 425 155, 435 155, 440 150 C 445 145, 440 135, 430 135 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" strokeLinejoin="round" />

              {/* Ground leaves and yellow flower */}
              <g transform="translate(48, 230)">
                {/* Outlined leafy green stalks */}
                <path d="M 12 70 C -3 50, 2 30, 7 20 C 12 30, 17 50, 17 70" fill="#a0e9b9" stroke="#1e293b" strokeWidth="1.8" />
                <path d="M 27 70 C 42 50, 37 30, 32 25 C 27 35, 22 50, 22 70" fill="#a0e9b9" stroke="#1e293b" strokeWidth="1.8" />
                <path d="M 17 70 C 17 40, 7 30, -3 25 C 2 35, 7 50, 17 70" fill="#84e2a3" stroke="#1e293b" strokeWidth="1.8" />
                
                {/* Yellow flower with orange center */}
                <path d="M 22 70 Q 24 45 27 30" stroke="#1e293b" strokeWidth="1.8" fill="none" />
                <g transform="translate(27, 26)">
                  <circle cx="0" cy="0" r="5.5" fill="#f59e0b" stroke="#1e293b" strokeWidth="1.8" />
                  <circle cx="-8" cy="0" r="5" fill="#fed658" stroke="#1e293b" strokeWidth="1.5" />
                  <circle cx="8" cy="0" r="5" fill="#fed658" stroke="#1e293b" strokeWidth="1.5" />
                  <circle cx="0" cy="-8" r="5" fill="#fed658" stroke="#1e293b" strokeWidth="1.5" />
                  <circle cx="0" cy="8" r="5" fill="#fed658" stroke="#1e293b" strokeWidth="1.5" />
                </g>
              </g>

              {/* Hand-drawn Main Mockup Window (rotated slightly counter-clockwise) */}
              <g transform="translate(100, 95) rotate(-3)">
                {/* Mockup Frame shadow shape */}
                <rect x="5" y="5" width="270" height="210" rx="20" fill="#cbd5e1" opacity="0.4" />
                {/* Main sketchy window frame with double borders */}
                <rect x="0" y="0" width="270" height="210" rx="20" fill="#ffffff" stroke="#1e293b" strokeWidth="2.2" />
                <path d="M 0 35 L 270 35" stroke="#1e293b" strokeWidth="1.8" />
                
                {/* Hand-drawn circular window controls */}
                <circle cx="20" cy="18" r="5" fill="#fed658" stroke="#1e293b" strokeWidth="1.8" />
                <circle cx="36" cy="18" r="5" fill="#fb923c" stroke="#1e293b" strokeWidth="1.8" />
                <circle cx="52" cy="18" r="5" fill="#4ade80" stroke="#1e293b" strokeWidth="1.8" />

                {/* Inner dashed frame */}
                <rect x="25" y="55" width="220" height="135" rx="14" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="5 5" />

                {/* Locked Document Graphic */}
                <g transform="translate(110, 75)">
                  {/* Imperfect sketchy file path */}
                  <path d="M 12 5 L 36 5 L 46 15 L 46 58 L 12 58 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M 36 5 L 36 15 L 46 15" fill="none" stroke="#1e293b" strokeWidth="2" />
                  
                  {/* File layout lines */}
                  <line x1="18" y1="26" x2="32" y2="26" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18" y1="34" x2="40" y2="34" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18" y1="42" x2="28" y2="42" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Document lock */}
                  <rect x="27" y="39" width="13" height="10" rx="2" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.5" />
                  <path d="M 30 39 L 30 36 C 30 33, 37 33, 37 36 L 37 39" fill="none" stroke="#1e293b" strokeWidth="1.5" />
                </g>

                {/* Text "Your file stays right here" */}
                <text x="135" y="156" textAnchor="middle" className="font-extrabold text-[15px] fill-slate-800 tracking-tight font-sans">Your file stays</text>
                <text x="135" y="174" textAnchor="middle" className="font-extrabold text-[15px] fill-slate-800 tracking-tight font-sans">right here</text>
              </g>

              {/* Hand-drawn double-outline Shield Check (tilted slightly) */}
              <g transform="translate(315, 205) rotate(-3)">
                {/* Shield background fill */}
                <path d="M 10 5 C 28 2, 38 2, 56 5 C 56 25, 50 40, 33 54 C 16 40, 10 25, 10 5 Z" fill="#e2f5e8" stroke="#1e293b" strokeWidth="2" />
                {/* Sketchy inner path */}
                <path d="M 14 9 C 28 7, 38 7, 52 9 C 52 26, 46 38, 33 50 C 20 38, 14 26, 14 9 Z" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 3" />
                {/* Green hand-drawn checkmark */}
                <path d="M 22 28 L 29 35 L 44 18" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>

              {/* Grass blades on right side */}
              <g transform="translate(385, 260)">
                <path d="M 0 50 C 5 35, 12 25, 20 20 C 15 30, 10 40, 0 50" fill="#a0e9b9" stroke="#1e293b" strokeWidth="1.5" />
                <path d="M -8 50 C -12 30, -5 20, 0 15 C -2 25, -4 35, -8 50" fill="#84e2a3" stroke="#1e293b" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-100 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-20 space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Simple.{' '}
            <span className="relative inline-block text-slate-800">
              Private.
              {/* Hand drawn sketchy underline */}
              <svg className="absolute left-0 bottom-[-6px] w-full h-[8px] text-blue-500" viewBox="0 0 100 8" fill="none" preserveAspectRatio="none">
                <path d="M2 5 C 30 2, 70 3, 98 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>{' '}
            Powerful.
          </h2>
        </div>

        {/* Steps display */}
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector line for desktop - connecting number badges precisely */}
          <svg className="absolute top-5 left-[16.6%] right-[16.6%] w-[66.8%] h-6 -z-10 hidden md:block" viewBox="0 0 100 10" fill="none" preserveAspectRatio="none">
            <path d="M 0 5 Q 25 10, 50 5 Q 75 10, 100 5" stroke="#cbd5e1" strokeWidth="0.65" strokeDasharray="1 3.2" strokeLinecap="round" />
          </svg>

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-5 group">
              {/* Centered Number Circle Badge */}
              <div className={`w-10 h-10 rounded-full ${step.badgeClass} flex items-center justify-center text-sm font-bold shadow-sm z-10`}>
                {step.number}
              </div>
              
              {/* Tool Icon Box */}
              <div className="relative mt-1 group-hover:scale-105 transition-transform duration-300">
                {step.icon}
              </div>

              {/* Text descriptions */}
              <div className="space-y-2 max-w-xs pt-1">
                <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">{step.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid of Tools Section */}
      <section id="tools" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-100 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-20 space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">One place. Many tools.</h2>
          <p className="text-slate-400 text-sm font-semibold tracking-wide">And growing.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleExplore(cat.id)}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between items-start group"
            >
              <div className="space-y-5">
                <div className={`p-3 rounded-2xl inline-block ${cat.iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-blue-600 transition-colors">{cat.title}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{cat.description}</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-6 transition-colors">
                Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100/60 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-sm relative overflow-hidden">
          {/* Subtle pattern details */}
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-100/30 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-5">
            {/* Heart speech bubble icon */}
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-md relative shrink-0">
              <span className="absolute bottom-[-6px] left-[20px] w-3 h-3 bg-white border-r border-b border-slate-100 transform rotate-45" />
              {/* Red Heart SVG */}
              <svg className="w-7 h-7 text-rose-500 fill-current animate-pulse" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-lg">Built for simplicity. Made for privacy.</h3>
              <p className="text-xs text-slate-400 font-semibold">Free to use. Always will be.</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/tools')}
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 duration-200"
          >
            Browse All Tools <ArrowRight className="w-4 h-4" />
          </button>
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

      {/* Coming Soon / Information Modal */}
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
                ) : modalContent.type === 'about' ? (
                  <>
                    <p>ClientSide Tools is a curated collection of secure, local-first web instruments built to optimize everyday workflows without sacrificing security or privacy.</p>
                    <p>Traditional tools require you to upload private documents, contracts, and passwords to remote servers, exposing you to data leaks.</p>
                    <p>We leverage modern browser capabilities, WebAssembly, and local JS runtimes to do all computations entirely on the client-side.</p>
                  </>
                ) : (
                  <>
                    <p>These utility sets are currently being developed and will be available in the upcoming release cycle.</p>
                    <p>All upcoming tools will adhere to our strict standard of <strong>100% private, offline, client-side execution</strong> with zero server payloads.</p>
                    <div className="pt-2">
                      <button
                        onClick={() => navigate('/tools?category=pdf')}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                      >
                        Try PDF Tools Now <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
