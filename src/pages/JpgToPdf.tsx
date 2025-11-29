import { useState } from 'react';
import { Image as ImageIcon, Download, Loader2, Trash2, Plus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { imagesToPDF } from '../utils/pdf';

interface SortableImageProps {
    id: string;
    src: string;
    onRemove: (id: string) => void;
}

function SortableImage({ id, src, onRemove }: SortableImageProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="aspect-[3/4] bg-gray-100 rounded overflow-hidden relative">
                <img src={src} alt="Upload" className="w-full h-full object-cover" />
                <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab active:cursor-grabbing hover:bg-black/5 transition-colors" />
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onRemove(id)}
                    className="p-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export function JpgToPdf() {
    const [images, setImages] = useState<{ id: string; src: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = (acceptedFiles: File[]) => {
        const newImages = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            src: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setImages((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleRemoveImage = (id: string) => {
        setImages(prev => {
            const newImages = prev.filter(img => img.id !== id);
            // Revoke URL for removed image to avoid memory leaks
            const removed = prev.find(img => img.id === id);
            if (removed) URL.revokeObjectURL(removed.src);
            return newImages;
        });
    };

    const handleConvert = async () => {
        if (images.length === 0) return;

        try {
            setIsProcessing(true);
            const pdfBytes = await imagesToPDF(images.map(img => img.src));

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `images-converted.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to convert images:', error);
            alert('Failed to convert images.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">JPG to PDF</h1>
                <p className="text-gray-600 mt-2">Convert images to PDF. Drag to reorder.</p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-4 z-30">
                    <div className="flex items-center gap-4">
                        <ImageIcon className="w-5 h-5 text-indigo-600" />
                        <span className="font-medium text-gray-900">{images.length} Images Selected</span>
                    </div>
                    <div className="flex gap-2">
                        <div {...getRootProps()} className="cursor-pointer">
                            <input {...getInputProps()} />
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Images
                            </button>
                        </div>
                        <button
                            onClick={handleConvert}
                            disabled={isProcessing || images.length === 0}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Convert to PDF
                        </button>
                    </div>
                </div>

                {images.length === 0 ? (
                    <div {...getRootProps()} className={`
                        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
                    `}>
                        <input {...getInputProps()} />
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Drop images here</h3>
                        <p className="text-gray-500 mt-2">Support JPG and PNG</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={images.map(i => i.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map((img) => (
                                    <SortableImage
                                        key={img.id}
                                        id={img.id}
                                        src={img.src}
                                        onRemove={handleRemoveImage}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
