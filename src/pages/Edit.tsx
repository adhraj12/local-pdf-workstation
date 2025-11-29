import { useState, useRef } from 'react';
import { Download, Loader2, Type, Image as ImageIcon, Trash2 } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { modifyPDF } from '../utils/pdf';
import { Document, Page } from 'react-pdf';

interface Modification {
    id: string;
    type: 'text' | 'image';
    content: string; // text content or image dataUrl
    x: number;
    y: number;
    pageIndex: number;
}

export function Edit() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [modifications, setModifications] = useState<Modification[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [mode, setMode] = useState<'text' | 'image' | null>(null);
    const [inputText, setInputText] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    };

    const handleAddText = () => {
        if (!inputText) return;
        setModifications(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            type: 'text',
            content: inputText,
            x: 50, // Default position
            y: 500, // Default position (pdf-lib coordinates are from bottom-left, but we'll need to map UI coords)
            pageIndex: pageNumber - 1
        }]);
        setInputText('');
        setMode(null);
    };

    const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setModifications(prev => [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'image',
                    content: event.target?.result as string,
                    x: 50,
                    y: 500,
                    pageIndex: pageNumber - 1
                }]);
            };
            reader.readAsDataURL(file);
        }
        setMode(null);
    };

    const handleSave = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            const modifiedPdfBytes = await modifyPDF(file, modifications);

            const blob = new Blob([modifiedPdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `edited-${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to save PDF:', error);
            alert('Failed to save PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit PDF</h1>
                <p className="text-gray-600 mt-2">Add text and images to your PDF.</p>
            </div>

            {!file ? (
                <DragAndDrop onDrop={handleDrop} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    {/* Sidebar Controls */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-6">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode('text')}
                                className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border transition-colors ${mode === 'text' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                <Type className="w-4 h-4" />
                                Add Text
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                <ImageIcon className="w-4 h-4" />
                                Add Image
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAddImage}
                            />
                        </div>

                        {mode === 'text' && (
                            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Enter text..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                <button
                                    onClick={handleAddText}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                                >
                                    Add to Page
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            <h3 className="font-medium text-gray-900 mb-3">Layers</h3>
                            <div className="space-y-2">
                                {modifications.map((mod) => (
                                    <div key={mod.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                        <div className="flex items-center gap-2">
                                            {mod.type === 'text' ? <Type className="w-4 h-4 text-gray-500" /> : <ImageIcon className="w-4 h-4 text-gray-500" />}
                                            <span className="truncate max-w-[150px]">{mod.type === 'text' ? mod.content : 'Image'}</span>
                                        </div>
                                        <button
                                            onClick={() => setModifications(prev => prev.filter(m => m.id !== mod.id))}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {modifications.length === 0 && (
                                    <p className="text-gray-500 text-sm text-center py-4">No layers added</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Save PDF
                        </button>
                    </div>

                    {/* Preview Area */}
                    <div className="lg:col-span-2 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto p-8 flex justify-center">
                            <Document
                                file={file}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                className="shadow-lg"
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    width={600}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                                {/* Overlay for modifications visualization would go here, but mapping coordinates is tricky without a proper canvas editor. 
                                    For now, we just list them in the sidebar and apply them blindly to fixed coordinates or center. 
                                    Improving this would require a full canvas implementation. 
                                */}
                            </Document>
                        </div>

                        {numPages > 1 && (
                            <div className="bg-white p-4 border-t border-gray-200 flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                                    disabled={pageNumber <= 1}
                                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-sm font-medium">Page {pageNumber} of {numPages}</span>
                                <button
                                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                                    disabled={pageNumber >= numPages}
                                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
