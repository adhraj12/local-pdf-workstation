import { useState } from 'react';
import { Loader2, ArrowRight, FileText, X } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { getPageCount, extractPages } from '../utils/pdf';
import { cn } from '../lib/utils';

export function Split() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [range, setRange] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const f = acceptedFiles[0];
            setFile(f);
            try {
                const count = await getPageCount(f);
                setPageCount(count);
                setRange(`1-${count}`);
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Failed to load PDF. Please try another file.');
                setFile(null);
            }
        }
    };

    const parseRange = (rangeStr: string, max: number): number[] => {
        const pages = new Set<number>();
        const parts = rangeStr.split(',').map(p => p.trim());

        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= max) pages.add(i - 1);
                    }
                }
            } else {
                const page = Number(part);
                if (!isNaN(page) && page >= 1 && page <= max) {
                    pages.add(page - 1);
                }
            }
        }
        return Array.from(pages).sort((a, b) => a - b);
    };

    const handleSplit = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            const pageIndices = parseRange(range, pageCount);

            if (pageIndices.length === 0) {
                alert('Please enter a valid page range.');
                return;
            }

            const pdfBytes = await extractPages(file, pageIndices);

            const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `split-${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error splitting PDF:', error);
            alert('Failed to split PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!file) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Split PDF</h1>
                    <p className="text-gray-600 mt-2">Extract pages from your PDF document.</p>
                </div>
                <DragAndDrop onDrop={handleDrop} className="h-64" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Split PDF</h1>
                <button
                    onClick={() => { setFile(null); setPageCount(0); setRange(''); }}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                    <FileText className="w-8 h-8" />
                </div>
                <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{pageCount} pages • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Range to Extract
                    </label>
                    <input
                        type="text"
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        placeholder="e.g. 1-5, 8, 11-13"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Enter page numbers or ranges separated by commas (e.g., 1-3, 5).
                    </p>
                </div>

                <button
                    onClick={handleSplit}
                    disabled={isProcessing || !range}
                    className={cn(
                        "w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                        isProcessing && "cursor-wait"
                    )}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Download Extracted Pages
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
