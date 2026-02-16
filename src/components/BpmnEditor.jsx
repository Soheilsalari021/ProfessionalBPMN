import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import biocModdleDescriptor from '../moddle/bioc.json';
import MagicAIModal from './MagicAIModal';

export default function BpmnEditor({ xml, filename: initialFilename, onFilenameChange }) {
    const containerRef = useRef(null);
    const modelerRef = useRef(null);
    const [selectedElements, setSelectedElements] = useState([]);
    const [customColor, setCustomColor] = useState('#0070F2');
    const [filename, setFilename] = useState(initialFilename || 'diagram.bpmn');
    const [isMagicAIModalOpen, setIsMagicAIModalOpen] = useState(false);

    // Update local filename when prop changes
    useEffect(() => {
        if (initialFilename) {
            setFilename(initialFilename);
        }
    }, [initialFilename]);

    useEffect(() => {
        if (!containerRef.current) return;

        const modeler = new BpmnModeler({
            container: containerRef.current,
            keyboard: {
                bindTo: window
            },
            moddleExtensions: {
                bioc: biocModdleDescriptor
            }
        });

        modelerRef.current = modeler;

        modeler.on('selection.changed', (e) => {
            setSelectedElements(e.newSelection);
        });

        return () => {
            modeler.destroy();
        };
    }, []);

    useEffect(() => {
        if (modelerRef.current && xml) {
            modelerRef.current.importXML(xml).catch(err => {
                console.error('Error importing XML:', err);
            });
        }
    }, [xml]);

    const handleColorChange = (fill, stroke) => {
        if (!modelerRef.current || selectedElements.length === 0) return;

        const modeling = modelerRef.current.get('modeling');
        modeling.setColor(selectedElements, {
            fill: fill,
            stroke: stroke
        });
    };

    const handleDownload = async () => {
        if (!modelerRef.current) return;

        try {
            const { xml } = await modelerRef.current.saveXML({ format: true });
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error saving XML:', err);
        }
    };







    // ... (existing code)

    const handleApplyToAll = () => {
        if (!modelerRef.current) return;

        const elementRegistry = modelerRef.current.get('elementRegistry');
        const modeling = modelerRef.current.get('modeling');

        // Get all elements that are shapes (not connections or the root)
        const allElements = elementRegistry.filter(element => {
            // Exclude connections (check for waypoints)
            if (element.waypoints) return false;

            // Exclude containers and root elements
            const type = element.type;
            return type !== 'bpmn:Process' &&
                type !== 'bpmn:Collaboration' &&
                type !== 'bpmn:Definitions' &&
                type !== 'bpmn:Participant' && // Exclude Pools
                type !== 'bpmn:Lane' &&        // Exclude Lanes
                type !== 'bpmn:TextAnnotation' &&
                type !== 'label';
        });

        modeling.setColor(allElements, {
            fill: customColor,
            stroke: 'black'
        });
    };

    // Funktion zum Anpassen der Größe aller Tasks (und SubProcesses/CallActivities)
    // Function to resize all tasks (and SubProcesses/CallActivities)
    const handleResizeTasks = () => {
        if (!modelerRef.current) return;

        const elementRegistry = modelerRef.current.get('elementRegistry');
        const modeling = modelerRef.current.get('modeling');

        // Liste der Element-Typen, die angepasst werden sollen
        // List of element types to resize
        const taskTypes = [
            'bpmn:Task',
            'bpmn:SubProcess',
            'bpmn:CallActivity',
            'bpmn:UserTask',
            'bpmn:ServiceTask',
            'bpmn:SendTask',
            'bpmn:ReceiveTask',
            'bpmn:ManualTask',
            'bpmn:BusinessRuleTask',
            'bpmn:ScriptTask'
        ];

        // Finde alle relevanten Elemente im Diagramm
        // Find all relevant elements in the diagram
        const tasks = elementRegistry.filter(element => taskTypes.includes(element.type));

        // Setze für jedes Element die Größe auf 100x80 Pixel
        // Set size to 100x80 pixels for each element
        tasks.forEach(task => {
            modeling.resizeShape(task, {
                x: task.x,
                y: task.y,
                width: 100,
                height: 80
            });
        });

        // Verbindungen (Pfeile) neu ausrichten, damit sie gerade sind
        // Re-layout all connections to ensure they are straight
        const connections = elementRegistry.filter(element => element.type === 'bpmn:SequenceFlow');
        connections.forEach(connection => {
            modeling.layoutConnection(connection);
        });
    };

    // Funktion zum Anwenden des Standard-Stils (Farben und Ränder)
    // Function to apply standard styling (colors and borders)
    // Magic AI Handler (Opens Modal)
    const handleMagicAI = () => {
        setIsMagicAIModalOpen(true);
    };

    const handleMagicAIGenerate = async (xml) => {
        if (!modelerRef.current) return;
        try {
            await modelerRef.current.importXML(xml);
        } catch (err) {
            console.error('Error importing generated XML:', err);
            alert('Failed to import generated BPMN. See console for details.');
        }
    };

    const handleStandardStyle = async () => {
        if (!modelerRef.current) return;

        const elementRegistry = modelerRef.current.get('elementRegistry');
        const modeling = modelerRef.current.get('modeling');

        const taskTypes = [
            'bpmn:Task',
            'bpmn:SubProcess',
            'bpmn:UserTask',
            'bpmn:ServiceTask',
            'bpmn:SendTask',
            'bpmn:ReceiveTask',
            'bpmn:ManualTask',
            'bpmn:BusinessRuleTask',
            'bpmn:ScriptTask'
        ];

        // 1. Färbe Tasks Gelb mit schwarzem Rand
        // 1. Color Tasks Yellow with Thin Black Border
        const tasks = elementRegistry.filter(element => taskTypes.includes(element.type));

        // Set colors
        modeling.setColor(tasks, {
            fill: '#FFFFCC',
            stroke: '#000000'
        });

        // Workaround: Setze stroke-width auf 1 via Canvas API, da setColor dies überschreibt
        // Set thin stroke width using canvas API
        const canvas = modelerRef.current.get('canvas');
        tasks.forEach(task => {
            const gfx = canvas.getGraphics(task);
            if (gfx) {
                const visual = gfx.querySelector('.djs-visual');
                if (visual) {
                    const rect = visual.querySelector('rect, path, circle, polygon');
                    if (rect) {
                        rect.setAttribute('stroke-width', '1');
                    }
                }
            }
        });

        // 2. Reset Pools/Lanes to White with Black Border
        const poolsAndLanes = elementRegistry.filter(element =>
            element.type === 'bpmn:Participant' ||
            element.type === 'bpmn:Lane'
        );
        if (poolsAndLanes.length > 0) {
            modeling.setColor(poolsAndLanes, {
                fill: '#FFFFFF',
                stroke: '#000000'
            });
        }

        // 3. Reset Connections to Black
        // Include SequenceFlow and MessageFlow
        const connections = elementRegistry.filter(element =>
            element.type === 'bpmn:SequenceFlow' ||
            element.type === 'bpmn:MessageFlow' ||
            element.type === 'bpmn:Association'
        );
        if (connections.length > 0) {
            modeling.setColor(connections, {
                stroke: '#000000'
            });
        }

        // 4. Fix Signavio metadata bordercolors
        try {
            const { xml } = await modelerRef.current.saveXML({ format: true });

            // Replace all non-standard Signavio bordercolors with black
            const fixedXml = xml
                // Pool/Lane borders: yellow/white → black
                .replace(/(<signavio:signavioMetaData metaKey="bordercolor" metaValue=")#FFE66B(")/gi, '$1#000000$2')
                .replace(/(<signavio:signavioMetaData metaKey="bordercolor" metaValue=")#FFFFFF(")/gi, '$1#000000$2')
                // Task borders: blue/gray → black
                .replace(/(<signavio:signavioMetaData metaKey="bordercolor" metaValue=")#788FA6(")/gi, '$1#000000$2')
                .replace(/(<signavio:signavioMetaData metaKey="bordercolor" metaValue=")#[0-9A-F]{6}(")/gi, '$1#000000$2')
                // Event borders: green → black
                .replace(/(<signavio:signavioMetaData metaKey="bordercolor" metaValue=")#CEE67E(")/gi, '$1#000000$2')
                // Task backgrounds: blue → yellow
                .replace(/(<signavio:signavioMetaData metaKey="bgcolor" metaValue=")#E3F0FF(")/gi, '$1#FFFFCC$2')
                // Pool/Lane backgrounds: yellow → white
                .replace(/(<signavio:signavioMetaData metaKey="bgcolor" metaValue=")#FFF3B8(")/gi, '$1#FFFFFF$2')
                // Event backgrounds: green/pink → white
                .replace(/(<signavio:signavioMetaData metaKey="bgcolor" metaValue=")#F5FAE5(")/gi, '$1#FFFFFF$2')
                .replace(/(<signavio:signavioMetaData metaKey="bgcolor" metaValue=")#FFEAF4(")/gi, '$1#FFFFFF$2');

            // Re-import the fixed XML
            await modelerRef.current.importXML(fixedXml);
        } catch (err) {
            console.error('Error fixing Signavio metadata:', err);
        }
    };

    const handleConvertUserTasks = () => {
        if (!modelerRef.current) return;

        const elementRegistry = modelerRef.current.get('elementRegistry');
        const bpmnReplace = modelerRef.current.get('bpmnReplace');

        // Find all specialized task types
        const specializedTasks = elementRegistry.filter(element =>
            element.type === 'bpmn:UserTask' ||
            element.type === 'bpmn:ManualTask' ||
            element.type === 'bpmn:ServiceTask' ||
            element.type === 'bpmn:SendTask' ||
            element.type === 'bpmn:ReceiveTask' ||
            element.type === 'bpmn:ScriptTask' ||
            element.type === 'bpmn:BusinessRuleTask'
        );

        specializedTasks.forEach(task => {
            bpmnReplace.replaceElement(task, {
                type: 'bpmn:Task'
            });
        });

        // Convert Call Activities to SubProcesses (for thick border -> thin border)
        const callActivities = elementRegistry.filter(element => element.type === 'bpmn:CallActivity');
        callActivities.forEach(callActivity => {
            bpmnReplace.replaceElement(callActivity, {
                type: 'bpmn:SubProcess'
            });
        });
    };

    // Hauptfunktion für "Nagarro" Button: Führt alle Schritte nacheinander aus
    // Main function for "Nagarro" button: Executes all steps sequentially
    const handleNagarro = async () => {
        if (!modelerRef.current) return;

        // Schritt 1: Konvertiere alle spezialisierten Tasks (UserTask, CallActivity etc.) in Standard-Tasks oder SubProcesses
        // Step 1: Convert all specialized tasks to standard tasks
        handleConvertUserTasks();

        // Warte 300ms, damit die Konvertierung im BPMN-Modell abgeschlossen ist
        // Wait 300ms for conversion to complete and registry to update
        await new Promise(resolve => setTimeout(resolve, 300));

        // Schritt 2: Ändere die Größe aller Tasks auf 100x80 Pixel
        // Step 2: Fix task sizes
        handleResizeTasks();

        // Warte 300ms, damit das Resizing fertig ist und das DOM aktualisiert wurde
        // Wait for resizing to complete and DOM to update
        await new Promise(resolve => setTimeout(resolve, 300));

        // Schritt 3: Wende den Standard-Stil an (Gelb, dünner Rand)
        // Step 3: Apply standard style
        await handleStandardStyle();
    };

    // Force Dark Mode Styles via JS to ensure they load
    const darkModeStyles = `
        /* DARK MODE: High Contrast Overrides */
        .bpmn-dark .djs-container { background-color: #111827 !important; } /* gray-900 */
        
        /* Palette & Context Pad Group */
        .bpmn-dark .djs-palette, 
        .bpmn-dark .djs-context-pad, 
        .bpmn-dark .djs-popup { 
            background: #1e293b !important; /* slate-800 - Distinct from canvas */
            border: 1px solid #475569 !important; /* slate-600 */
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
        }

        /* Palette Entries (The Icons) - Force Pure White */
        .bpmn-dark .djs-palette .entry, 
        .bpmn-dark .djs-context-pad .entry { 
            color: #ffffff !important; 
            background-color: transparent !important; /* FIX: Remove potential white bg */
            box-shadow: none !important;
        }
        
        /* Specific Context Pad Entry Fixes */
        .bpmn-dark .djs-context-pad .entry {
            background: transparent !important;
        }
        
        /* Handle Font Icons */
        .bpmn-dark .djs-palette .entry::before, 
        .bpmn-dark .djs-context-pad .entry::before { 
            color: #ffffff !important; 
        }
        
        /* Handle SVG Icons - Stroke AND Fill to ensure visibility */
        .bpmn-dark .djs-palette .entry svg, 
        .bpmn-dark .djs-context-pad .entry svg { 
            fill: #ffffff !important; 
            stroke: #ffffff !important;
        }
        
        /* Specific internal SVG paths often have fill/stroke */
        .bpmn-dark .djs-palette .entry svg path, 
        .bpmn-dark .djs-context-pad .entry svg path { 
            fill: #ffffff !important; 
            stroke: #ffffff !important;
        }

        /* Hover States - Bright Emerald */
        .bpmn-dark .djs-palette .entry:hover, 
        .bpmn-dark .djs-context-pad .entry:hover { 
            background-color: #10b981 !important; /* emerald-500 */
            color: #ffffff !important; 
            cursor: pointer !important;
        }
        
        /* Ensure hover icons stay white */
        .bpmn-dark .djs-palette .entry:hover::before, 
        .bpmn-dark .djs-context-pad .entry:hover::before { 
            color: #ffffff !important; 
        }
        .bpmn-dark .djs-palette .entry:hover svg, 
        .bpmn-dark .djs-context-pad .entry:hover svg { 
            fill: #ffffff !important;
            stroke: #ffffff !important;
        }

        /* Diagram Elements - High Contrast Lines */
        .bpmn-dark .djs-visual > :nth-child(1) { stroke: #f3f4f6 !important; fill: #1f2937 !important; }
        .bpmn-dark .djs-visual text { fill: #ffffff !important; font-weight: 500 !important; }
        .bpmn-dark .djs-connection .djs-visual path { stroke: #f3f4f6 !important; }
        .bpmn-dark .djs-outline { stroke: #34d399 !important; } /* emerald-400 */
    `;

    // ... (existing helper functions)

    // Dark Mode State
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Toggle Dark Mode
    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    return (
        <div className={`flex flex-col h-full w-full ${isDarkMode ? 'bpmn-dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <style>{isDarkMode ? darkModeStyles : ''}</style>

            {/* --- Professional Toolbar --- */}
            <div className={`
                flex items-center justify-between px-6 py-3 border-b z-10 shadow-sm
                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
            `}>
                {/* Left: Brand & File Info */}
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Night<span className="text-emerald-500">BPMN</span>
                        </span>
                    </div>

                    <div className="h-6 w-px bg-gray-700/50"></div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => {
                                setFilename(e.target.value);
                                if (onFilenameChange) onFilenameChange(e.target.value);
                            }}
                            className={`
                                text-sm font-medium px-3 py-1.5 rounded-md border focus:ring-2 focus:ring-emerald-500 outline-none transition-all
                                ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500'
                                    : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'}
                            `}
                            placeholder="filename.bpmn"
                        />
                        <button
                            onClick={handleDownload}
                            className={`
                                flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all
                                ${isDarkMode
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'}
                            `}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download</span>
                        </button>
                    </div>
                </div>

                {/* Right: Tools & Toggles */}
                <div className="flex items-center space-x-4">

                    {/* Tool Group: Automation */}
                    <div className={`flex items-center space-x-1 p-1 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                        <button
                            onClick={handleConvertUserTasks}
                            className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-purple-400' : 'hover:bg-gray-200 text-purple-600'}`}
                            title="Convert to Standard Tasks"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </button>
                        <button
                            onClick={handleResizeTasks}
                            className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-200 text-blue-600'}`}
                            title="Fix Sizes (100x80)"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </button>
                        <button
                            onClick={handleNagarro}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${isDarkMode ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                            title="Run Signavio Standards"
                        >
                            Signavio Standards
                        </button>
                    </div>

                    {/* Tool Group: Magic AI */}
                    <button
                        onClick={handleMagicAI}
                        className={`
                            flex items-center space-x-2 px-4 py-1.5 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all hover:scale-105
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-400 hover:to-rose-400'
                                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'}
                        `}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Magic AI</span>
                    </button>

                    {/* Tool Group: Styling */}
                    <div className={`flex items-center space-x-2 p-1 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                        <div className="flex items-center px-2">
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => {
                                    setCustomColor(e.target.value);
                                    handleColorChange(e.target.value, 'black'); // Simple apply
                                }}
                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
                                title="Pick Color"
                            />
                        </div>
                        <button
                            onClick={handleApplyToAll}
                            className={`p-2 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-200 text-yellow-600'}`}
                            title="Apply Color to All"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                        </button>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`
                            p-2 rounded-full transition-all duration-300
                            ${isDarkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                        `}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        )}
                    </button>
                </div>
            </div>

            <div className={`flex-grow relative h-full w-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`} ref={containerRef}></div>

            <MagicAIModal
                isOpen={isMagicAIModalOpen}
                onClose={() => setIsMagicAIModalOpen(false)}
                onGenerate={handleMagicAIGenerate}
                currentXml={xml}
            />
        </div>
    );
}
