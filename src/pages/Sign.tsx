import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureCanvas from 'react-signature-canvas';
import { motion } from 'framer-motion';
import { Loader2, X, PenLine, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { embedImages } from '../utils/pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export function Sign() {
    const [file, setFile] = useState<File | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [isDrawing, setIsDrawing] = useState(false);
    const [signature, setSignature] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const sigCanvas = useRef<SignatureCanvas>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive scaling
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                // 600 is a base width, adjust scale accordingly
                setScale(Math.min(1, (width - 48) / 600));
            }
        };
        window.addEventListener('resize', updateScale);
        updateScale();
        return () => window.removeEventListener('resize', updateScale);
    }, [file]);

    const handleDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setPageNumber(1);
            setSignature(null);
        }
    };

    const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const saveSignature = () => {
        if (sigCanvas.current) {
            setSignature(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
            setIsDrawing(false);
        }
    };

    const handleSave = async () => {
        if (!file || !signature || !pageRef.current) return;

        try {
            setIsProcessing(true);

            // We need the rendered page dimensions to calculate ratio
            const pageEl = pageRef.current.querySelector('.react-pdf__Page__canvas');
            const sigEl = document.getElementById('signature-el');
            if (!pageEl || !sigEl) return;

            const pageRect = pageEl.getBoundingClientRect();
            const sigRect = sigEl.getBoundingClientRect();

            // Relative position (0-1)
            const relX = (sigRect.left - pageRect.left) / pageRect.width;
            const relY = (sigRect.top - pageRect.top) / pageRect.height;
            const relW = sigRect.width / pageRect.width;
            const relH = sigRect.height / pageRect.height;

            // Get PDF page size
            const arrayBuffer = await file.arrayBuffer();
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const page = pdfDoc.getPage(pageNumber - 1);
            const { width, height } = page.getSize();

            // Calculate PDF coordinates
            const x = relX * width;
            const y = height - (relY * height) - (relH * height);
            const w = relW * width;
            const h = relH * height;

            const savedBytes = await embedImages(file, [{
                dataUrl: signature,
                x,
                y,
                width: w,
                height: h,
                pageIndex: pageNumber - 1
            }]);

            const blob = new Blob([savedBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signed-${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {!file ? (
                <>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Sign PDF</h1>
                        <p className="text-gray-600 mt-2">Add your signature to PDF documents.</p>
                    </div>
                    <DragAndDrop onDrop={handleDrop} className="h-64" />
                </>
            ) : (
                <div className="max-w-4xl mx-auto space-y-6" ref={containerRef}>
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-4 z-30">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setFile(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                            <span className="font-medium text-gray-900">{file.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                                disabled={pageNumber <= 1}
                                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-gray-600">
                                Page {pageNumber} of {numPages}
                            </span>
                            <button
                                onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                                disabled={pageNumber >= numPages}
                                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsDrawing(true)}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
                            >
                                <PenLine className="w-4 h-4" />
                                {signature ? 'New Signature' : 'Add Signature'}
                            </button>
                            {signature && (
                                <button
                                    onClick={handleSave}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Save PDF
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-100 p-8 rounded-xl overflow-auto flex justify-center min-h-[600px] relative">
                        <Document
                            file={file}
                            onLoadSuccess={handleDocumentLoadSuccess}
                            className="shadow-lg"
                        >
                            <div ref={pageRef} className="relative">
                                <Page
                                    pageNumber={pageNumber}
                                    scale={scale}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                                {signature && (
                                    <motion.div
                                        id="signature-el"
                                        drag
                                        dragMomentum={false}
                                        initial={{ x: 50, y: 50 }}
                                        className="absolute top-0 left-0 cursor-move z-20 border-2 border-indigo-500 border-dashed hover:border-solid"
                                        style={{ touchAction: 'none' }}
                                    >
                                        <img
                                            src={signature}
                                            alt="Signature"
                                            className="h-16 pointer-events-none select-none"
                                        />
                                        <button
                                            onClick={() => setSignature(null)}
                                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </Document>
                    </div>
                </div>
            )}

            {/* Signature Modal */}
            {isDrawing && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Draw Signature</h2>
                            <button onClick={() => setIsDrawing(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="border border-gray-200 rounded-xl bg-gray-50 mb-6 overflow-hidden">
                            <SignatureCanvas
                                ref={sigCanvas}
                                canvasProps={{
                                    className: 'w-full h-64 cursor-crosshair',
                                }}
                                backgroundColor="rgba(0,0,0,0)"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => sigCanvas.current?.clear()}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Clear
                            </button>
                            <button
                                onClick={saveSignature}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                            >
                                Use Signature
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
