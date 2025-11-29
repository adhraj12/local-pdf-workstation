import { useState } from 'react';
import { RotateCw, RotateCcw, Download, Loader2, FileText, RefreshCw } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { rotatePDF } from '../utils/pdf';
import { cn } from '../lib/utils';

export function Rotate() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [rotation, setRotation] = useState<90 | 180 | 270>(90);

    const handleDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    };

    const handleRotate = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            const rotatedPdfBytes = await rotatePDF(file, rotation);

            const blob = new Blob([rotatedPdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rotated-${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to rotate PDF:', error);
            alert('Failed to rotate PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Rotate PDF</h1>
                <p className="text-gray-600 mt-2">Rotate your PDF pages permanently.</p>
            </div>

            {!file ? (
                <DragAndDrop onDrop={handleDrop} />
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center space-y-6">
                    <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <FileText className="w-8 h-8 text-indigo-600" />
                        <span className="font-medium text-gray-900">{file.name}</span>
                        <button
                            onClick={() => setFile(null)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            Remove
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <button
                            onClick={() => setRotation(270)}
                            className={cn(
                                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                                rotation === 270
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                    : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                            )}
                        >
                            <RotateCcw className="w-8 h-8" />
                            <span className="font-medium">Left (90°)</span>
                        </button>

                        <button
                            onClick={() => setRotation(90)}
                            className={cn(
                                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                                rotation === 90
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                    : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                            )}
                        >
                            <RotateCw className="w-8 h-8" />
                            <span className="font-medium">Right (90°)</span>
                        </button>

                        <button
                            onClick={() => setRotation(180)}
                            className={cn(
                                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                                rotation === 180
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                    : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                            )}
                        >
                            <RefreshCw className="w-8 h-8" />
                            <span className="font-medium">180°</span>
                        </button>
                    </div>

                    <button
                        onClick={handleRotate}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        Download Rotated PDF
                    </button>
                </div>
            )}
        </div>
    );
}
