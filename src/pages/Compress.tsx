import { useState } from 'react';
import { Loader2, FileText, Minimize2, Download, CheckCircle } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { compressPDF } from '../utils/pdf';
import { cn } from '../lib/utils';

export function Compress() {
    const [file, setFile] = useState<File | null>(null);
    const [compressedPdf, setCompressedPdf] = useState<Uint8Array | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);

    const handleDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setCompressedPdf(null);
            setStats(null);
        }
    };

    const handleCompress = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            // Artificial delay to show processing (since pdf-lib is fast but we want user to feel it worked)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const result = await compressPDF(file);
            setCompressedPdf(result);
            setStats({
                original: file.size,
                compressed: result.byteLength
            });
        } catch (error) {
            console.error('Error compressing PDF:', error);
            alert('Failed to compress PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!compressedPdf || !file) return;

        const blob = new Blob([compressedPdf as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `compressed-${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!file) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Compress PDF</h1>
                    <p className="text-gray-600 mt-2">Reduce file size while maintaining quality.</p>
                </div>
                <DragAndDrop onDrop={handleDrop} className="h-64" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Compress PDF</h1>
                <button
                    onClick={() => { setFile(null); setCompressedPdf(null); setStats(null); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    Change File
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileText className="w-8 h-8" />
                </div>
                <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                </div>
            </div>

            {stats && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex items-center gap-4">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-semibold text-emerald-900">Compression Complete!</p>
                        <p className="text-emerald-700 text-sm mt-1">
                            Reduced from <span className="font-medium">{formatSize(stats.original)}</span> to <span className="font-medium">{formatSize(stats.compressed)}</span>
                            {stats.compressed < stats.original && (
                                <span className="ml-1">
                                    ({Math.round((1 - stats.compressed / stats.original) * 100)}% smaller)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                {!compressedPdf ? (
                    <button
                        onClick={handleCompress}
                        disabled={isProcessing}
                        className={cn(
                            "w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                            isProcessing && "cursor-wait"
                        )}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Compressing...
                            </>
                        ) : (
                            <>
                                Compress PDF
                                <Minimize2 className="w-5 h-5" />
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleDownload}
                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all hover:bg-emerald-700 hover:shadow-emerald-300"
                    >
                        Download Compressed PDF
                        <Download className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
