import { useState } from 'react';
import { Lock, Loader2, FileText, Eye, EyeOff } from 'lucide-react';
import { DragAndDrop } from '../components/DragAndDrop';
import { encryptPDF } from '../utils/pdf';

export function Protect() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    };

    const handleProtect = async () => {
        if (!file || !password) return;

        try {
            setIsProcessing(true);
            const protectedPdfBytes = await encryptPDF(file, password);

            const blob = new Blob([protectedPdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `protected-${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to protect PDF:', error);
            alert('Failed to protect PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Protect PDF</h1>
                <p className="text-gray-600 mt-2">Encrypt your PDF with a password.</p>
            </div>

            {!file ? (
                <DragAndDrop onDrop={handleDrop} />
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto space-y-6">
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

                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Set Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter a strong password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleProtect}
                        disabled={isProcessing || !password}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Lock className="w-5 h-5" />
                        )}
                        Encrypt PDF
                    </button>
                </div>
            )}
        </div>
    );
}
