import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface SortableFileProps {
    id: string;
    file: File;
    onRemove: (id: string) => void;
}

export function SortableFile({ id, file, onRemove }: SortableFileProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm group select-none",
                isDragging && "opacity-50 scale-105 shadow-lg z-50 relative ring-2 ring-indigo-500 ring-offset-2"
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
            >
                <GripVertical className="w-5 h-5" />
            </button>

            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <FileText className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
            </div>

            <button
                onClick={() => onRemove(id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
