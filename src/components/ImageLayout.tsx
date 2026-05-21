import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    Crop,
    RefreshCw,
    Minimize2,
    Info,
    Stamp,
    Smile,
    EyeOff,
    Palette,
    FileImage,
    Image as ImageIcon,
    ShieldCheck,
    Menu,
    X,
    Scaling,
    QrCode,
    Scan
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const imageTools = [
    { name: 'Crop & Rotate', path: '/crop-image', icon: Crop, description: 'Crop, rotate, and flip images' },
    { name: 'Image Converter', path: '/convert-image', icon: RefreshCw, description: 'Convert between image formats' },
    { name: 'Compress Image', path: '/compress-image', icon: Minimize2, description: 'Optimize and reduce file size' },
    { name: 'Resize Image', path: '/resize-image', icon: Scaling, description: 'Adjust image dimensions' },
    { name: 'EXIF Editor', path: '/exif-editor', icon: Info, description: 'View, edit, or strip metadata' },
    { name: 'Watermark Image', path: '/watermark-image', icon: Stamp, description: 'Apply text or image overlays' },
    { name: 'Meme Generator', path: '/meme-generator', icon: Smile, description: 'Create memes with text captions' },
    { name: 'Steganography', path: '/steganography', icon: EyeOff, description: 'Hide secret messages inside pixels' },
    { name: 'Color Palette', path: '/color-palette', icon: Palette, description: 'Pick colors and extract palettes' },
    { name: 'Favicon Generator', path: '/favicon-generator', icon: FileImage, description: 'Create website .ico favicons' },
    { name: 'QR Generator', path: '/qr-generator', icon: QrCode, description: 'Generate custom QR codes' },
    { name: 'QR Scanner', path: '/qr-scanner', icon: Scan, description: 'Scan QR codes offline' },
];

export function ImageLayout() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 h-screen sticky top-0 z-10 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <Link to="/tools?category=image" className="flex items-center gap-3 text-emerald-600 hover:opacity-85 transition-all">
                        <div className="p-2.5 bg-emerald-50 rounded-xl">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="font-bold text-lg tracking-tight block">Image Tools</span>
                            <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase block mt-0.5">← Back to Dashboard</span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {imageTools.map((tool) => {
                        const isActive = location.pathname === tool.path;
                        return (
                            <Link
                                key={tool.path}
                                to={tool.path}
                                replace
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabImage"
                                        className="absolute inset-0 bg-emerald-50 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <tool.icon className={cn("w-5 h-5 transition-colors relative z-10", isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600")} />
                                <div className="relative z-10">
                                    <div className="font-semibold text-sm">{tool.name}</div>
                                    <div className="text-xs text-gray-400 font-normal mt-0.5">{tool.description}</div>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-emerald-700 mb-2">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="font-bold text-sm">100% Private</span>
                        </div>
                        <p className="text-xs text-emerald-600/90 leading-relaxed font-medium">
                            Your files never leave your device. Turn off your WiFi and try it—it still works!
                        </p>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <Link to="/tools?category=image" className="flex items-center gap-2 text-emerald-600 hover:opacity-85 transition-all">
                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                        <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-bold text-sm block">Image Tools</span>
                        <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase block mt-0.5">← Exit to Dashboard</span>
                    </div>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden fixed inset-0 z-20 bg-white pt-20 px-4 pb-4 overflow-y-auto"
                    >
                        <nav className="space-y-2">
                            {imageTools.map((tool) => (
                                <Link
                                    key={tool.path}
                                    to={tool.path}
                                    replace
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-4 rounded-xl transition-colors border border-transparent",
                                        location.pathname === tool.path
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            : "text-gray-600 hover:bg-gray-50 hover:border-gray-100"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-lg", location.pathname === tool.path ? "bg-white" : "bg-gray-100")}>
                                        <tool.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">{tool.name}</div>
                                        <div className="text-xs text-gray-400 font-normal mt-0.5">{tool.description}</div>
                                    </div>
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-8 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-2 text-emerald-700 mb-2">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="font-bold text-sm">100% Private</span>
                            </div>
                            <p className="text-xs text-emerald-600 leading-relaxed">
                                Your files never leave your device. All processing happens locally in your browser.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto h-[calc(100vh-64px)] md:h-screen bg-gray-50/50 scroll-smooth">
                <div className="max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
