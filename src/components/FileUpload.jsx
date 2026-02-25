import React, { useState, useEffect, useRef } from 'react';
import { processNagarroBPMN } from '../utils/bpmnProcessor';

export default function FileUpload({ onFileLoaded, onShowTutorial, onShowRequirements, onShowSgxConverter, onShowTranslator }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStatus, setProcessStatus] = useState('');

    // Apple-style scroll animation using Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('scroll-visible');
                        const children = entry.target.querySelectorAll('.scroll-child');
                        children.forEach((child, i) => {
                            setTimeout(() => {
                                child.classList.add('scroll-visible');
                            }, i * 200);
                        });
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
        );

        const elements = document.querySelectorAll('.scroll-reveal');
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

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

    const emptyBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

    const handleCreateNew = () => {
        onFileLoaded(emptyBpmnXml, 'new_diagram.bpmn');
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
        <div className="relative">
            {/* ===== HERO SECTION (Full Viewport) ===== */}
            <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover z-0 scale-110 blur-[0px]"
                    style={{ filter: 'contrast(1.2) saturate(1.1)' }}
                >
                    <source src="/banner.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-0"></div>

                <div className="container mx-auto px-8 z-10 relative h-full flex flex-col justify-center pt-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Column: Hero Text */}
                        <div className="text-left space-y-8 animate-fade-in-up">
                            <div>
                                <p className="text-emerald-400 font-bold tracking-[0.2em] mb-2 text-sm uppercase">Welcome to the future</p>
                                <h1 className="text-7xl font-black text-white leading-tight drop-shadow-2xl">
                                    POWERFUL<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">BPMN EDITOR</span>
                                </h1>
                            </div>
                            <p className="text-xl text-gray-300 max-w-lg font-light leading-relaxed border-l-4 border-emerald-500 pl-6">
                                Create, edit, and optimize your business processes with professional precision.
                                Fully compatible with Signavio standards.
                            </p>
                            <div className="flex items-center space-x-6 pt-4">
                                <button
                                    onClick={onShowTutorial}
                                    className="bg-emerald-500 text-gray-900 px-8 py-4 rounded-none skew-x-[-10deg] font-bold hover:bg-emerald-400 transition-transform hover:-translate-y-1 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                >
                                    <span className="skew-x-[10deg] inline-block">GET STARTED</span>
                                </button>
                                <div className="text-gray-400 text-sm font-medium tracking-widest uppercase">
                                    Tutorial
                                </div>
                            </div>
                            <div className="pt-12 text-gray-500 text-sm font-bold tracking-widest uppercase">
                                Presented by Soheil
                            </div>
                        </div>

                        {/* Right Column: App Tiles */}
                        <div className="w-full max-w-xl mx-auto lg:ml-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* BPMN Studio (Full Width) */}
                            <div
                                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gray-900/40 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${isDragging ? 'ring-2 ring-emerald-500/50 scale-[1.02]' : ''} h-32 md:col-span-2`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="absolute inset-0 p-6 flex items-center space-x-5 transition-all duration-300 group-hover:opacity-0 group-hover:scale-95 pointer-events-none">
                                    <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_8px_16px_rgba(16,185,129,0.3)]">
                                        <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-2xl font-bold text-white tracking-wide">BPMN Studio</h3>
                                        <p className="text-sm text-gray-400 mt-1 font-medium">Professional Editor.</p>
                                    </div>
                                    <div className="self-center">
                                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center space-x-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 bg-gray-900/60 backdrop-blur-sm z-20">
                                    <button onClick={handleCreateNew} className="flex flex-col items-center justify-center group/btn">
                                        <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center mb-2 shadow-lg group-hover/btn:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                        <span className="text-xs font-bold text-white uppercase tracking-wider drop-shadow-md">Create New</span>
                                    </button>
                                    <div className="h-16 w-px bg-white/10"></div>
                                    <label className="flex flex-col items-center justify-center cursor-pointer group/btn">
                                        <input type="file" onChange={handleFileChange} className="hidden" />
                                        <div className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center mb-2 shadow-lg group-hover/btn:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                        </div>
                                        <span className="text-xs font-bold text-white uppercase tracking-wider drop-shadow-md">Open File</span>
                                    </label>
                                </div>
                            </div>

                            {/* Signavio Standards */}
                            <div className="group relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/80 backdrop-blur-md p-6 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                <label className={`cursor-pointer block h-full w-full ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}>
                                    <input type="file" multiple onChange={handleFastNagarro} disabled={isProcessing} className="hidden" />
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Signavio Standards</h3>
                                            <p className="text-sm text-gray-400 mt-1">{isProcessing ? processStatus : 'Batch process multiple files. Auto-convert to Signavio standards.'}</p>
                                        </div>
                                        <div className="self-center">
                                            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                                                {isProcessing ? (
                                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </label>
                                {processStatus && (<div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700"><div className="h-full bg-purple-500 animate-pulse w-full"></div></div>)}
                            </div>

                            {/* Requirements Builder */}
                            <div onClick={onShowRequirements} className="group relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/80 backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] cursor-pointer h-full flex flex-col justify-between">
                                <div className="flex flex-col space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Requirements</h3>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">Define process requirements interactively.</p>
                                    </div>
                                </div>
                            </div>

                            {/* SGX Converter */}
                            <div onClick={onShowSgxConverter} className="group relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/80 backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:border-rose-500 hover:shadow-[0_0_30px_rgba(225,29,72,0.2)] cursor-pointer h-full flex flex-col justify-between">
                                <div className="flex flex-col space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                            </svg>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:text-rose-400 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">SGX Converter</h3>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">Package files for Signavio.</p>
                                    </div>
                                </div>
                            </div>

                            {/* BPMN Translator */}
                            <div onClick={onShowTranslator} className="group relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/80 backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] cursor-pointer h-full flex flex-col justify-between md:col-span-2">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                        </svg>
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">BPMN Translator</h3>
                                        <p className="text-sm text-gray-400 mt-1">Auto-translate diagrams via free API.</p>
                                    </div>
                                    <div className="self-center">
                                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-0 w-full text-center z-10">
                    <div className="flex flex-col items-center gap-2 animate-bounce">
                        <p className="text-gray-400 text-xs tracking-[0.2em] uppercase">Scroll down to learn more</p>
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* ===== SECTION: BPMN Studio ===== */}
            <section className="bg-gray-950 border-t border-white/5 scroll-reveal">
                <div className="container mx-auto px-8 py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="scroll-child">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                                <h2 className="text-4xl font-black text-white">BPMN Studio</h2>
                            </div>
                            <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mb-8"></div>
                            <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                The BPMN Studio is a fully-featured, professional-grade diagram editor built for creating and modifying Business Process Model and Notation (BPMN) diagrams. It provides an intuitive drag-and-drop interface where you can visually construct complex workflows.
                            </p>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                With integrated tools like undo/redo, zoom controls, fullscreen mode, and export options (SVG, PNG), the editor gives you full control over your diagrams. The auto-styling feature ensures your processes always look clean and professional.
                            </p>
                            <p className="text-gray-400 leading-relaxed">
                                The built-in <span className="text-emerald-400 font-semibold">Magic AI</span> button leverages artificial intelligence to analyze your process flows and suggest optimizations — helping you identify bottlenecks and improvement opportunities.
                            </p>
                        </div>
                        <div className="flex justify-center scroll-child">
                            <div className="relative w-full max-w-md">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-3xl blur-3xl"></div>
                                <div className="relative bg-gray-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-4">
                                    {[
                                        ['M12 4v16m8-8H4', 'Create new diagrams from scratch'],
                                        ['M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', 'Open existing .bpmn files'],
                                        ['M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', 'AI-powered process analysis'],
                                        ['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', 'Export as SVG, PNG or BPMN'],
                                    ].map(([path, label], i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
                                            </div>
                                            <span className="text-gray-300 font-medium">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SECTION: Signavio Standards ===== */}
            <section className="bg-gray-900 border-t border-white/5 scroll-reveal">
                <div className="container mx-auto px-8 py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 flex justify-center scroll-child">
                            <div className="relative w-full max-w-md">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-600/10 rounded-3xl blur-3xl"></div>
                                <div className="relative bg-gray-950/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-4">
                                    {[
                                        ['M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2', 'Select multiple files at once'],
                                        ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', 'Auto-convert to Signavio format'],
                                        ['M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', 'Auto-style and resize elements'],
                                        ['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', 'Automatic download of results'],
                                    ].map(([path, label], i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
                                            </div>
                                            <span className="text-gray-300 font-medium">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 scroll-child">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                </div>
                                <h2 className="text-4xl font-black text-white">Signavio Standards</h2>
                            </div>
                            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full mb-8"></div>
                            <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                The Signavio Standards tool is designed for batch processing multiple BPMN files at once. Simply select your files and the tool automatically converts them to comply with Signavio's formatting and styling guidelines.
                            </p>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Each file goes through a complete transformation pipeline: element resizing to standard dimensions, auto-styling with consistent colors and fonts, and structural adjustments to meet Signavio platform requirements.
                            </p>
                            <p className="text-gray-400 leading-relaxed">
                                The processed files are automatically downloaded with a "_nagarro" suffix, so your original files remain untouched. Whether you have one file or dozens, the batch processor handles them all efficiently.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SECTION: Requirements Builder ===== */}
            <section className="bg-gray-950 border-t border-white/5 scroll-reveal">
                <div className="container mx-auto px-8 py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="scroll-child">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                </div>
                                <h2 className="text-4xl font-black text-white">Requirements Builder</h2>
                            </div>
                            <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-full mb-8"></div>
                            <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                The Requirements Builder is an interactive tool that lets you define business processes step by step — without needing any BPMN knowledge. You simply describe what happens in your process using natural language, and the tool builds the diagram for you.
                            </p>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Add tasks, decisions (with yes/no branches), parallel activities, and even nested sub-processes. Each step you add is instantly reflected in a live preview, so you can see your process taking shape in real-time.
                            </p>
                            <p className="text-gray-400 leading-relaxed">
                                Once complete, export as a detailed PDF document with hierarchical numbering, or generate a full BPMN diagram automatically using AI. The perfect bridge between business stakeholders and technical process modelers.
                            </p>
                        </div>
                        <div className="flex justify-center scroll-child">
                            <div className="relative w-full max-w-md">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-600/10 rounded-3xl blur-3xl"></div>
                                <div className="relative bg-gray-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-4">
                                    {[
                                        ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', 'Define tasks, decisions & sub-processes'],
                                        ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'Real-time live preview'],
                                        ['M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'Export as PDF document'],
                                        ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'AI-powered BPMN generation'],
                                    ].map(([path, label], i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
                                            </div>
                                            <span className="text-gray-300 font-medium">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SECTION: SGX Converter ===== */}
            <section className="bg-gray-900 border-t border-white/5 scroll-reveal">
                <div className="container mx-auto px-8 py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 flex justify-center scroll-child">
                            <div className="relative w-full max-w-md">
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-orange-500/10 rounded-3xl blur-3xl"></div>
                                <div className="relative bg-gray-950/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-4">
                                    {[
                                        ['M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'Create custom folder structures'],
                                        ['M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', 'Upload matching BPMN files'],
                                        ['M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4', 'Package into a single Zip file'],
                                        ['M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', 'Ready for Signavio import'],
                                    ].map(([path, label], i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
                                            </div>
                                            <span className="text-gray-300 font-medium">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 scroll-child">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                </div>
                                <h2 className="text-4xl font-black text-white">SGX Converter</h2>
                            </div>
                            <div className="h-1 w-20 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full mb-8"></div>
                            <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                The SGX Converter makes it incredibly simple to prepare your files for Signavio dictionaries and workspaces.
                            </p>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Build your exact folder hierarchy right in the browser. Drop your specific BPMN files into matching folders like "SD" or "FI", and package them instantly into a `.sgx` (ZIP compressed) file natively parsed by business systems.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SECTION: Translator ===== */}
            <section className="bg-gray-950 border-t border-white/5 scroll-reveal">
                <div className="container mx-auto px-8 py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="scroll-child">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                                </div>
                                <h2 className="text-4xl font-black text-white">BPMN Translator</h2>
                            </div>
                            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-8"></div>
                            <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                Break down language barriers in process documentation instantly, completely free directly in your browser.
                            </p>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                The BPMN Translator reads your process diagrams, identifies all text (task names, event descriptions, lanes), and translates them using a free public API. Choose from multiple languages including German, Spanish, French, and Japanese.
                            </p>
                            <p className="text-gray-400 leading-relaxed">
                                Upload a batch of files in English and download a compressed ZIP containing identical structural mappings in the newly selected target language.
                            </p>
                        </div>
                        <div className="flex justify-center scroll-child">
                            <div className="relative w-full max-w-md">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/10 rounded-3xl blur-3xl"></div>
                                <div className="relative bg-gray-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-4">
                                    {[
                                        ['M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129', 'Supports 10+ major languages'],
                                        ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', 'Preserves identical ID structures'],
                                        ['M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2', 'Batch process multiple files'],
                                        ['M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', '100% Free with no API keys req.'],
                                    ].map(([path, label], i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
                                            </div>
                                            <span className="text-gray-300 font-medium">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-950 border-t border-white/5 py-12">
                <div className="container mx-auto px-8 text-center">
                    <p className="text-gray-500 text-sm tracking-widest uppercase">Presented by Soheil — NIGHTBPMN</p>
                </div>
            </footer>
        </div>
    );
}
