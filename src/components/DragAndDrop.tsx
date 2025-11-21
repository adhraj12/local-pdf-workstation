import { useDropzone } from 'react-dropzone';
import { Upload, FileUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface DragAndDropProps {
    onDrop: (files: File[]) => void;
    accept?: Record<string, string[]>;
    className?: string;
}

export function DragAndDrop({ onDrop, accept = { 'application/pdf': ['.pdf'] }, className }: DragAndDropProps) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ease-in-out",
                isDragActive
                    ? "border-indigo-500 bg-indigo-50 scale-[1.02]"
                    : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50",
                className
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
                <div className={cn(
                    "p-4 rounded-full transition-colors",
                    isDragActive ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"
                )}>
                    {isDragActive ? <FileUp className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                <div>
                    <p className="text-lg font-semibold text-gray-700">
                        {isDragActive ? "Drop files here..." : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        PDF files only
                    </p>
                </div>
            </div>
        </div>
    );
}
