import React, { useState } from 'react';
import { processNagarroBPMN } from '../utils/bpmnProcessor';

export default function FileUpload({ onFileLoaded }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStatus, setProcessStatus] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            onFileLoaded(e.target.result, file.name);
        };
        reader.readAsText(file);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            onFileLoaded(e.target.result, file.name);
        };
        reader.readAsText(file);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFastNagarro = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setIsProcessing(true);
        setProcessStatus(`Processing ${files.length} file(s)...`);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProcessStatus(`Processing ${i + 1}/${files.length}: ${file.name}`);

                // Read file
                const xml = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });

                // Process with Nagarro transformations
                const processedXml = await processNagarroBPMN(xml);

                // Download processed file
                const blob = new Blob([processedXml], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name.replace('.bpmn', '_nagarro.bpmn');
                a.click();
                URL.revokeObjectURL(url);

                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            setProcessStatus(`✅ Successfully processed ${files.length} file(s)!`);
            setTimeout(() => {
                setIsProcessing(false);
                setProcessStatus('');
            }, 3000);
        } catch (error) {
            console.error('Error processing files:', error);
            setProcessStatus(`❌ Error: ${error.message}`);
            setTimeout(() => {
                setIsProcessing(false);
                setProcessStatus('');
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">
                        Soheils BPMN
                    </h1>
                    <p className="text-lg text-slate-600">
                        Professional BPMN Editor for Signavio-Compatible Diagrams
                    </p>
                </div>

                {/* Upload Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                            ${isDragging
                                ? 'border-indigo-500 bg-indigo-50 scale-105'
                                : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                            }
                        `}
                    >
                        {/* Upload Icon */}
                        <div className="mb-6">
                            <svg
                                className="mx-auto h-16 w-16 text-indigo-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                        </div>

                        {/* Upload Text */}
                        <div className="mb-6">
                            <p className="text-xl font-semibold text-slate-700 mb-2">
                                Drop your BPMN file here
                            </p>
                            <p className="text-sm text-slate-500">
                                or click to browse
                            </p>
                        </div>

                        {/* File Input */}
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <span className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl">
                                Browse Files
                            </span>
                        </label>
                    </div>

                    {/* Fast Nagarro Section */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-purple-900 mb-2">🚀 Fast Nagarro Batch Processor</h3>
                            <p className="text-sm text-purple-700">
                                Process multiple BPMN files at once with Nagarro transformations
                            </p>
                        </div>

                        <label className="cursor-pointer">
                            <input
                                type="file"
                                multiple
                                onChange={handleFastNagarro}
                                disabled={isProcessing}
                                className="hidden"
                            />
                            <span className={`
                                inline-block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-lg font-bold text-lg
                                transition-all shadow-lg
                                ${isProcessing
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105'
                                }
                            `}>
                                {isProcessing ? '⏳ Processing...' : '🚀 Fast Nagarro - Select Multiple Files'}
                            </span>
                        </label>

                        {processStatus && (
                            <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                                <p className="text-sm text-center text-purple-900 font-medium">
                                    {processStatus}
                                </p>
                            </div>
                        )}

                        <div className="mt-4 text-xs text-purple-600 text-center">
                            <p>✓ Converts all task types to standard tasks</p>
                            <p>✓ Fixes task sizes to 100x80</p>
                            <p>✓ Applies Signavio-compatible colors</p>
                            <p>✓ Auto-downloads as *_nagarro.bpmn</p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4">
                            <div className="text-2xl mb-2">🎨</div>
                            <p className="text-sm font-medium text-slate-700">Auto-Styling</p>
                            <p className="text-xs text-slate-500">One-click formatting</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="text-2xl mb-2">📐</div>
                            <p className="text-sm font-medium text-slate-700">Resize Tasks</p>
                            <p className="text-xs text-slate-500">Uniform sizing</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="text-2xl mb-2">✨</div>
                            <p className="text-sm font-medium text-slate-700">Signavio Ready</p>
                            <p className="text-xs text-slate-500">Perfect compatibility</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-8">
                    Supports .bpmn files • Optimized for Signavio
                </p>
            </div>
        </div>
    );
}
