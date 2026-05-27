import { useState } from 'react';
import { DragAndDrop } from '../components/DragAndDrop';
import { organizePDF } from '../utils/pdf';
import { Loader2, Download, FileText, Trash2, RotateCw } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface SortablePageProps {
    id: string;
    pageIndex: number;
    rotation: number;
    onRemove: (index: number) => void;
    onRotate: (index: number) => void;
}

function SortablePage({ id, pageIndex, rotation, onRemove, onRotate }: SortablePageProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="aspect-[1/1.4] bg-gray-100 rounded overflow-hidden relative">
                <Page
                    pageNumber={pageIndex + 1}
                    width={150}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="pointer-events-none"
                    loading={
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    }
                />
                <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab active:cursor-grabbing hover:bg-black/5 transition-colors" />
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                    onClick={() => onRotate(pageIndex)}
                    className="p-1 bg-white text-gray-700 rounded shadow hover:bg-gray-50"
                    title="Rotate 90° Left"
                >
                    <RotateCw className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onRemove(pageIndex)}
                    className="p-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
                    title="Remove Page"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="mt-2 text-center text-xs font-medium text-gray-500 flex justify-between px-2">
                <span>Page {pageIndex + 1}</span>
                {rotation !== 0 && <span className="text-indigo-600">{rotation}°</span>}
            </div>
        </div>
    );
}

export function Organize() {
    const [file, setFile] = useState<File | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    // Store objects with original index and current rotation
    const [pages, setPages] = useState<{ index: number; rotation: number }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    };

    const onDocumentLoadSuccess = async (pdf: any) => {
        setNumPages(pdf.numPages);
        
        const initialPages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            try {
                const page = await pdf.getPage(i);
                initialPages.push({ index: i - 1, rotation: page.rotate || 0 });
            } catch (e) {
                initialPages.push({ index: i - 1, rotation: 0 });
            }
        }
        setPages(initialPages);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setPages((items) => {
                const oldIndex = items.findIndex(p => p.index === parseInt(active.id as string));
                const newIndex = items.findIndex(p => p.index === parseInt(over.id as string));
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleRemovePage = (originalIndex: number) => {
        setPages(prev => prev.filter(p => p.index !== originalIndex));
    };

    const handleRotatePage = (originalIndex: number) => {
        setPages(prev => prev.map(p => {
            if (p.index === originalIndex) {
                let newRotation = (p.rotation - 90) % 360;
                if (newRotation < 0) newRotation += 360;
                return { ...p, rotation: newRotation };
            }
            return p;
        }));
    };

    const handleSave = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            const reorderedPdfBytes = await organizePDF(file, pages);

            const blob = new Blob([reorderedPdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `organized-${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to organize PDF:', error);
            alert('Failed to organize PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Organize PDF</h1>
                <p className="text-gray-600 mt-2">Rearrange, delete, or rotate pages.</p>
            </div>

            {!file ? (
                <DragAndDrop onDrop={handleDrop} />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-4 z-30">
                        <div className="flex items-center gap-4">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <span className="font-medium text-gray-900">{file.name}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFile(null)}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Save PDF
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-xl min-h-[500px]">
                        <Document file={file} onLoadSuccess={onDocumentLoadSuccess} className="h-full">
                            {numPages > 0 ? (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={pages.map(p => String(p.index))}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {pages.map((page) => (
                                                <SortablePage
                                                    key={page.index}
                                                    id={String(page.index)}
                                                    pageIndex={page.index}
                                                    rotation={page.rotation}
                                                    onRemove={() => handleRemovePage(page.index)}
                                                    onRotate={() => handleRotatePage(page.index)}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <p>Loading PDF...</p>
                                </div>
                            )}
                        </Document>
                    </div>
                </div>
            )}
        </div>
    );
}
