import { useState, useRef, useCallback } from 'react';
import { Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import Webcam from 'react-webcam';
import { imagesToPDF } from '../utils/pdf';

export function Scan() {
    const [images, setImages] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImages(prev => [...prev, imageSrc]);
        }
    }, [webcamRef]);

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (images.length === 0) return;

        try {
            setIsProcessing(true);
            const pdfBytes = await imagesToPDF(images);

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `scanned-document.pdf`;
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
                <h1 className="text-3xl font-bold text-gray-900">Scan to PDF</h1>
                <p className="text-gray-600 mt-2">Use your camera to scan documents.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-black rounded-xl overflow-hidden aspect-[4/3] relative flex items-center justify-center">
                        {isCameraOpen ? (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-white text-center">
                                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Camera is off</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsCameraOpen(!isCameraOpen)}
                            className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            {isCameraOpen ? 'Stop Camera' : 'Start Camera'}
                        </button>
                        {isCameraOpen && (
                            <button
                                onClick={capture}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Capture
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-indigo-600" />
                            Scanned Pages ({images.length})
                        </h3>
                        <button
                            onClick={handleSave}
                            disabled={images.length === 0 || isProcessing}
                            className="text-sm px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 disabled:opacity-50"
                        >
                            {isProcessing ? 'Saving...' : 'Save PDF'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px]">
                        {images.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Camera className="w-8 h-8 mb-2" />
                                <p>No pages scanned yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative group aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                                        <img src={img} alt={`Scan ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 text-center">
                                            Page {idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
