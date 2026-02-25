import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function SgxConverter({ onBack }) {
    // Structure: [{ id: 'id', name: 'SD', files: [{name: 'proc1.bpmn', content: '...'}] }]
    const [folders, setFolders] = useState([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    const handleAddFolder = (e) => {
        e.preventDefault();
        const trimmedName = newFolderName.trim();
        if (!trimmedName) return;

        // Prevent duplicates
        if (folders.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
            setError(`A folder named "${trimmedName}" already exists.`);
            setTimeout(() => setError(null), 3000);
            return;
        }

        setFolders([...folders, {
            id: Date.now().toString(),
            name: trimmedName,
            files: []
        }]);
        setNewFolderName('');
    };

    const handleDeleteFolder = (folderId) => {
        setFolders(folders.filter(f => f.id !== folderId));
    };

    const handleFileUpload = async (folderId, event) => {
        const uploadedFiles = Array.from(event.target.files);
        if (uploadedFiles.length === 0) return;

        const newFiles = [];

        for (const file of uploadedFiles) {
            if (!file.name.endsWith('.bpmn') && !file.name.endsWith('.xml') && !file.name.endsWith('.bpmn2')) {
                setError(`File "${file.name}" is not a BPMN file.`);
                setTimeout(() => setError(null), 3000);
                continue;
            }

            try {
                const content = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });

                newFiles.push({
                    name: file.name,
                    content: content,
                    size: file.size
                });
            } catch (err) {
                console.error("Error reading file:", err);
            }
        }

        if (newFiles.length > 0) {
            setFolders(folders.map(folder => {
                if (folder.id === folderId) {
                    // Filter out duplicates by name
                    const existingNames = new Set(folder.files.map(f => f.name));
                    const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));

                    return {
                        ...folder,
                        files: [...folder.files, ...uniqueNewFiles]
                    };
                }
                return folder;
            }));
        }

        // Reset the input so the same files can be selected again if removed
        event.target.value = '';
    };

    const handleDeleteFile = (folderId, fileName) => {
        setFolders(folders.map(folder => {
            if (folder.id === folderId) {
                return {
                    ...folder,
                    files: folder.files.filter(f => f.name !== fileName)
                };
            }
            return folder;
        }));
    };

    const handleGenerateSgx = async () => {
        if (folders.length === 0 || folders.every(f => f.files.length === 0)) {
            setError("Cannot generate empty SGX. Please add at least one folder with files.");
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsGenerating(true);
        try {
            const zip = new JSZip();

            // Add root required files if needed by Signavio (sometimes they need a manifest)
            // For now we just create the folder structure as requested.

            folders.forEach(folder => {
                if (folder.files.length > 0) {
                    const folderZip = zip.folder(folder.name);
                    folder.files.forEach(file => {
                        folderZip.file(file.name, file.content);
                    });
                } else {
                    // Create empty folder
                    zip.folder(folder.name);
                }
            });

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "export.sgx");

        } catch (err) {
            console.error("Error generating SGX:", err);
            setError("Failed to generate SGX file.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsGenerating(false);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans selection:bg-rose-500/30">
            {/* Header */}
            <header className="bg-gray-950 border-b border-gray-800 p-4 sticky top-0 z-40 shadow-md">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center text-gray-400 hover:text-white"
                            title="Back to Home"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="h-8 w-px bg-gray-700"></div>
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-wide">SGX Converter</h1>
                                <p className="text-xs text-gray-400 font-medium">Package BPMN files for Signavio</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleGenerateSgx}
                            disabled={isGenerating || folders.length === 0}
                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg
                                ${isGenerating || folders.length === 0
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                    : 'bg-rose-600 hover:bg-rose-500 text-white hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-500/50'
                                }`}
                        >
                            {isGenerating ? (
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                            <span>{isGenerating ? 'Packaging...' : 'Generate .sgx'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Error Toast */}
            {error && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/90 border border-red-500/50 text-white px-6 py-3 rounded-lg shadow-[0_10px_40px_rgba(220,38,38,0.3)] flex items-center space-x-3 animate-fade-in-up backdrop-blur-md">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-sm">{error}</span>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-grow overflow-auto bg-[url('/grid-pattern.svg')] bg-fixed" style={{ backgroundSize: '40px 40px' }}>
                <div className="container mx-auto px-8 py-8 max-w-5xl">

                    {/* Add Folder Section */}
                    <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-6 mb-8 shadow-xl">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            Create Folder Structure
                        </h2>
                        <form onSubmit={handleAddFolder} className="flex gap-4">
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="e.g. SD, FI, HR..."
                                className="flex-grow bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-medium placeholder-gray-500 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!newFolderName.trim()}
                                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Folder
                            </button>
                        </form>
                    </div>

                    {/* Folders Grid */}
                    {folders.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
                            <div className="h-20 w-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-300 mb-2">No Folders Yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Start by creating your folder structure above (e.g., SD, FI). Then upload your BPMN files into the respective folders.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {folders.map((folder) => (
                                <div key={folder.id} className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden shadow-lg group hover:border-gray-600 transition-colors">
                                    {/* Folder Header */}
                                    <div className="bg-gray-900/50 px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                            <h3 className="text-lg font-bold text-white">{folder.name}</h3>
                                            <span className="bg-gray-800 text-gray-400 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-700">
                                                {folder.files.length} {folder.files.length === 1 ? 'file' : 'files'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteFolder(folder.id)}
                                            className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                                            title="Delete Folder"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Upload Area */}
                                    <div className="p-5">
                                        <div className="mb-4">
                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-600 hover:border-rose-500/50 rounded-xl bg-gray-900/30 hover:bg-rose-500/5 cursor-pointer transition-colors group/drop">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-7 h-7 text-gray-400 group-hover/drop:text-rose-400 mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="text-sm text-gray-400 group-hover/drop:text-gray-300">
                                                        <span className="font-semibold text-rose-400">Click to upload</span> BPMN files
                                                    </p>
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    multiple
                                                    accept=".bpmn,.xml,.bpmn2"
                                                    onChange={(e) => handleFileUpload(folder.id, e)}
                                                />
                                            </label>
                                        </div>

                                        {/* File List */}
                                        {folder.files.length > 0 && (
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {folder.files.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700/50 group/file hover:border-gray-600 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-1.5 bg-gray-800 rounded-md text-emerald-400">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                            <div className="truncate">
                                                                <p className="text-sm font-medium text-gray-200 truncate" title={file.name}>{file.name}</p>
                                                                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteFile(folder.id, file.name)}
                                                            className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover/file:opacity-100 transition-all focus:opacity-100"
                                                            title="Remove File"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
