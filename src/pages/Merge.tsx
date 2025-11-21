import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2, ArrowRight } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { SortableFile } from '../components/SortableFile';
import { mergePDFs } from '../utils/pdf';
import { cn } from '../lib/utils';

interface PDFFile {
    id: string;
    file: File;
}

export function Merge() {
    const [files, setFiles] = useState<PDFFile[]>([]);
    const [isMerging, setIsMerging] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDrop = (acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            id: crypto.randomUUID(),
            file
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const handleRemove = (id: string) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleMerge = async () => {
        if (files.length < 2) return;

        try {
            setIsMerging(true);
            const mergedPdfBytes = await mergePDFs(files.map(f => f.file));

            // Create blob and download
            const blob = new Blob([mergedPdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'merged-document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('Failed to merge PDFs. Please try again.');
        } finally {
            setIsMerging(false);
        }
    };

    if (files.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Merge PDFs</h1>
                    <p className="text-gray-600 mt-2">Combine multiple PDF files into a single document. Drag and drop to reorder.</p>
                </div>
                <DragAndDrop onDrop={handleDrop} className="h-64" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Merge PDFs</h1>
                    <p className="text-gray-600 mt-1">{files.length} files selected</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setFiles([])}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={files.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {files.map((file) => (
                            <SortableFile
                                key={file.id}
                                id={file.id}
                                file={file.file}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex-1">
                    <DragAndDrop
                        onDrop={handleDrop}
                        className="p-4 border-2 border-dashed border-gray-200 hover:border-indigo-300 bg-gray-50/50 rounded-xl flex flex-row items-center justify-center gap-3 h-auto min-h-[80px]"
                    />
                </div>
                <button
                    onClick={handleMerge}
                    disabled={isMerging || files.length < 2}
                    className={cn(
                        "px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                        isMerging && "cursor-wait"
                    )}
                >
                    {isMerging ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Merging...
                        </>
                    ) : (
                        <>
                            Merge PDFs
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
