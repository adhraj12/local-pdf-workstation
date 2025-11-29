import { useState } from 'react';
import { Hash, Loader2, FileText } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { addPageNumbers } from '../utils/pdf';
import { cn } from '../lib/utils';

export function PageNumbers() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');

    const handleDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    };

    const handleAddNumbers = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            const numberedPdfBytes = await addPageNumbers(file, { position });

            const blob = new Blob([numberedPdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `numbered-${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to add page numbers:', error);
            alert('Failed to add page numbers.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Page Numbers</h1>
                <p className="text-gray-600 mt-2">Add page numbers to your document.</p>
            </div>

            {!file ? (
                <DragAndDrop onDrop={handleDrop} />
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto space-y-8">
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

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 text-center">Select Position</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'bottom-center', label: 'Bottom Center' },
                                { id: 'bottom-right', label: 'Bottom Right' },
                                { id: 'top-right', label: 'Top Right' },
                            ].map((pos) => (
                                <button
                                    key={pos.id}
                                    onClick={() => setPosition(pos.id as any)}
                                    className={cn(
                                        "p-4 rounded-lg border-2 text-sm font-medium transition-all",
                                        position === pos.id
                                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                            : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                                    )}
                                >
                                    <div className="aspect-[3/4] bg-white border border-gray-200 mb-2 relative mx-auto w-12 shadow-sm">
                                        <div className={cn(
                                            "absolute w-2 h-2 bg-indigo-600 rounded-full",
                                            pos.id === 'bottom-center' && "bottom-1 left-1/2 -translate-x-1/2",
                                            pos.id === 'bottom-right' && "bottom-1 right-1",
                                            pos.id === 'top-right' && "top-1 right-1",
                                        )} />
                                    </div>
                                    {pos.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleAddNumbers}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Hash className="w-5 h-5" />
                        )}
                        Add Page Numbers
                    </button>
                </div>
            )}
        </div>
    );
}
