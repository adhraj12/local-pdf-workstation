import { useState } from 'react';
import { Stamp, Loader2 } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { watermarkPDF } from '../utils/pdf';

export function Watermark() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [text, setText] = useState('CONFIDENTIAL');
    const [opacity, setOpacity] = useState(0.5);
    const [size, setSize] = useState(50);
    const [color, setColor] = useState('#FF0000');

    const handleDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    };

    const handleWatermark = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            const watermarkedPdfBytes = await watermarkPDF(file, text, {
                opacity,
                size,
                color: hexToRgb(color)
            });

            const blob = new Blob([watermarkedPdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `watermarked-${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to watermark PDF:', error);
            alert('Failed to watermark PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Watermark PDF</h1>
                <p className="text-gray-600 mt-2">Add text watermarks to your documents.</p>
            </div>

            {!file ? (
                <DragAndDrop onDrop={handleDrop} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Watermark Text</label>
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opacity ({Math.round(opacity * 100)}%)</label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Size ({size}px)</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="200"
                                    step="5"
                                    value={size}
                                    onChange={(e) => setSize(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="h-10 w-20 rounded cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-500 uppercase">{color}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleWatermark}
                            disabled={isProcessing || !text}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {isProcessing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Stamp className="w-5 h-5" />
                            )}
                            Apply Watermark
                        </button>
                    </div>

                    <div className="bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center p-8 min-h-[400px]">
                        <div className="relative bg-white w-full max-w-sm aspect-[1/1.4] shadow-lg flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 p-8 text-xs text-gray-300">
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                                <p className="mt-4">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                            </div>
                            <div
                                style={{
                                    transform: 'rotate(45deg)',
                                    opacity: opacity,
                                    fontSize: `${size / 2}px`, // Scale down for preview
                                    color: color,
                                    whiteSpace: 'nowrap'
                                }}
                                className="font-bold pointer-events-none select-none"
                            >
                                {text}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
