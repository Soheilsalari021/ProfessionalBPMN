import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' }
];

export default function BpmnTranslator({ onBack }) {
    const [files, setFiles] = useState([]);
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('de');
    const [isTranslating, setIsTranslating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState(null);

    const handleFileUpload = async (event) => {
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
            // Filter duplicates by name
            const existingNames = new Set(files.map(f => f.name));
            const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
            setFiles([...files, ...uniqueNewFiles]);
        }

        event.target.value = '';
    };

    const handleDeleteFile = (fileName) => {
        setFiles(files.filter(f => f.name !== fileName));
    };

    // Free API limit: rate limit handling
    const translateText = async (text, from, to) => {
        if (!text || text.trim() === '') return text;

        try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`Translation API warning for text: "${text}"`);
                return text; // fallback to original
            }

            const data = await response.json();

            if (data && data.responseData && data.responseData.translatedText) {
                // MyMemory sometimes returns quota errors in translatedText if daily limit is reached
                if (data.responseData.translatedText.includes('QUERY LIMIT')) {
                    throw new Error("Free translation API daily limit reached. Please try again tomorrow.");
                }
                return data.responseData.translatedText;
            }

            return text;
        } catch (error) {
            console.error("Translation error:", error);
            throw error; // Rethrow to stop batch
        }
    };

    const handleTranslate = async () => {
        if (files.length === 0) {
            setError("Please upload at least one BPMN file.");
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (sourceLang === targetLang) {
            setError("Source and Target languages must be different.");
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsTranslating(true);
        setProgress(0);
        setError(null);

        try {
            const zip = new JSZip();
            const parser = new DOMParser();

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setStatusText(`Scanning file ${i + 1} of ${files.length}: ${file.name}`);

                const xmlDoc = parser.parseFromString(file.content, "text/xml");

                // BPMN elements that typically contain text we want to translate:
                // 1. "name" attribute on elements like tasks, events, pools, lanes
                const elementsWithName = Array.from(xmlDoc.querySelectorAll('*[name]'));

                // Collect unique texts to translate to minimize API calls
                const uniqueTextsToTranslate = new Set();
                elementsWithName.forEach(el => {
                    const nameAttr = el.getAttribute('name');
                    if (nameAttr && nameAttr.trim() !== '') {
                        uniqueTextsToTranslate.add(nameAttr.trim());
                    }
                });

                // Also text annotations
                const textAnnotations = Array.from(xmlDoc.querySelectorAll('text')); // bpmn:text inside bpmn:textAnnotation
                textAnnotations.forEach(el => {
                    if (el.textContent && el.textContent.trim() !== '') {
                        uniqueTextsToTranslate.add(el.textContent.trim());
                    }
                });

                const textsArray = Array.from(uniqueTextsToTranslate);
                const translationMap = new Map();

                for (let j = 0; j < textsArray.length; j++) {
                    const text = textsArray[j];
                    setStatusText(`Translating: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}" (${j + 1}/${textsArray.length})`);

                    try {
                        const translated = await translateText(text, sourceLang, targetLang);
                        translationMap.set(text, translated);
                    } catch (err) {
                        // If quota reached, we abort
                        throw err;
                    }

                    // MyMemory free tier allows approx 1 call per second safely without triggering bans
                    // We wait 800ms between calls (can be adjusted)
                    if (j < textsArray.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }

                    // Update progress bar considering files and texts
                    const baseProgress = (i / files.length) * 100;
                    const textProgress = ((j + 1) / textsArray.length) * (100 / files.length);
                    setProgress(Math.round(baseProgress + textProgress));
                }

                // Apply translations back to the DOM
                elementsWithName.forEach(el => {
                    const original = el.getAttribute('name');
                    if (original && translationMap.has(original.trim())) {
                        el.setAttribute('name', translationMap.get(original.trim()));
                    }
                });

                textAnnotations.forEach(el => {
                    const original = el.textContent;
                    if (original && translationMap.has(original.trim())) {
                        el.textContent = translationMap.get(original.trim());
                    }
                });

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const translatedXml = serializer.serializeToString(xmlDoc);

                // Add to ZIP
                const baseName = file.name.replace(/\.(bpmn|xml|bpmn2)$/i, '');
                zip.file(`${baseName}_${targetLang}.bpmn`, translatedXml);
            }

            setStatusText("Zipping files...");
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `translated_bpmn_${targetLang}.zip`);

            setStatusText("Translation complete!");
            setTimeout(() => {
                setStatusText('');
                setProgress(0);
            }, 3000);

        } catch (err) {
            console.error("Translation process error:", err);
            setError(err.message || "Failed to translate files. An unexpected error occurred.");
            setStatusText('');
            setProgress(0);
        } finally {
            setIsTranslating(false);
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
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans selection:bg-purple-500/30">
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
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-wide">BPMN Translator</h1>
                                <p className="text-xs text-gray-400 font-medium">Auto-translate process diagrams via free API</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating || files.length === 0}
                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg
                                ${isTranslating || files.length === 0
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-500/50'
                                }`}
                        >
                            {isTranslating ? (
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            )}
                            <span>{isTranslating ? 'Translating...' : 'Translate to ZIP'}</span>
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
                <div className="container mx-auto px-8 py-8 max-w-4xl">

                    {/* Settings Panel */}
                    <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-6 mb-8 shadow-xl">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Translation Settings
                        </h2>

                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                            {/* Source Language */}
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Source Language (From)</label>
                                <select
                                    value={sourceLang}
                                    onChange={(e) => setSourceLang(e.target.value)}
                                    disabled={isTranslating}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium transition-colors appearance-none"
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={`src-${lang.code}`} value={lang.code}>{lang.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="hidden md:flex mt-6">
                                <div className="h-10 w-10 rounded-full bg-gray-700/50 flex flex-col items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>

                            {/* Target Language */}
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Target Language (To)</label>
                                <select
                                    value={targetLang}
                                    onChange={(e) => setTargetLang(e.target.value)}
                                    disabled={isTranslating}
                                    className="w-full bg-gray-900 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-bold transition-colors appearance-none shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={`tgt-${lang.code}`} value={lang.code}>{lang.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {isTranslating && (
                            <div className="mt-8 animate-fade-in-up">
                                <div className="flex justify-between text-sm font-medium text-gray-400 mb-2">
                                    <span>{statusText || 'Working...'}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-purple-400 mt-2 text-center italic">
                                    Free API limited to ~1 request/second. Please be patient.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* File Upload Area */}
                    <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden shadow-lg">
                        <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                                Files to Translate
                            </h3>
                            <span className="bg-gray-800 text-gray-400 text-xs font-bold px-3 py-1 rounded-full border border-gray-700">
                                {files.length} {files.length === 1 ? 'file' : 'files'}
                            </span>
                        </div>

                        <div className="p-6">
                            {/* Dropzone */}
                            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors group/drop 
                                ${isTranslating ? 'border-gray-700 bg-gray-900/10 cursor-not-allowed opacity-50' : 'border-gray-600 hover:border-purple-500/50 bg-gray-900/30 hover:bg-purple-500/5'}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 text-gray-400 group-hover/drop:text-purple-400 mb-3 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm text-gray-400 group-hover/drop:text-gray-300">
                                        <span className="font-semibold text-purple-400">Click to browse</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">.bpmn, .bpmn2 or .xml files only</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept=".bpmn,.xml,.bpmn2"
                                    onChange={handleFileUpload}
                                    disabled={isTranslating}
                                />
                            </label>

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-700/50 group/file hover:border-gray-600 transition-colors">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="p-2 bg-gray-800 rounded-lg text-indigo-400">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-bold text-gray-200 truncate" title={file.name}>{file.name}</p>
                                                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                                                </div>
                                            </div>
                                            {!isTranslating && (
                                                <button
                                                    onClick={() => handleDeleteFile(file.name)}
                                                    className="text-gray-600 hover:text-red-400 p-2 opacity-0 group-hover/file:opacity-100 transition-all focus:opacity-100"
                                                    title="Remove File"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
