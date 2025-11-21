import { Link, Outlet, useLocation } from 'react-router-dom';
import { FileStack, Scissors, PenLine, Minimize2, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const tools = [
    { name: 'Merge PDF', path: '/', icon: FileStack, description: 'Combine multiple PDFs into one' },
    { name: 'Split PDF', path: '/split', icon: Scissors, description: 'Extract pages or split documents' },
    { name: 'Sign PDF', path: '/sign', icon: PenLine, description: 'Add signatures to your documents' },
    { name: 'Compress PDF', path: '/compress', icon: Minimize2, description: 'Reduce file size while maintaining quality' },
];

export function Layout() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 h-screen sticky top-0 z-10 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-indigo-600">
                        <div className="p-2.5 bg-indigo-50 rounded-xl">
                            <FileStack className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">PDF Workstation</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {tools.map((tool) => {
                        const isActive = location.pathname === tool.path;
                        return (
                            <Link
                                key={tool.path}
                                to={tool.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-indigo-50 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <tool.icon className={cn("w-5 h-5 transition-colors relative z-10", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
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
                <div className="flex items-center gap-2 text-indigo-600">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                        <FileStack className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg">PDF Workstation</span>
                </div>
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
                            {tools.map((tool) => (
                                <Link
                                    key={tool.path}
                                    to={tool.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-4 rounded-xl transition-colors border border-transparent",
                                        location.pathname === tool.path
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
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
