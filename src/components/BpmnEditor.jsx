import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import biocModdleDescriptor from '../moddle/bioc.json';

export default function BpmnEditor({ xml, filename: initialFilename, onFilenameChange }) {
    const containerRef = useRef(null);
    const modelerRef = useRef(null);
    const [selectedElements, setSelectedElements] = useState([]);
    const [customColor, setCustomColor] = useState('#0070F2');
    const [filename, setFilename] = useState(initialFilename || 'diagram.bpmn');

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

    const colors = [
        { name: 'White', fill: 'white', stroke: 'black' },
        { name: 'Red', fill: '#ffe6e6', stroke: '#cc0000' },
        { name: 'Green', fill: '#e6ffec', stroke: '#00cc33' },
        { name: 'Blue', fill: '#e6f7ff', stroke: '#0066cc' },
        { name: 'Yellow', fill: '#ffffcc', stroke: '#cccc00' },
    ];

    const hasSelection = selectedElements.length > 0;



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

    // ... (existing helper functions)

    return (
        <div className="flex flex-col h-full w-full">
            <div className="bg-gray-100 p-2 border-b flex items-center space-x-4 flex-wrap gap-y-2">
                <button
                    onClick={handleDownload}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Download BPMN
                </button>

                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Filename:</span>
                    <input
                        type="text"
                        value={filename}
                        onChange={(e) => {
                            setFilename(e.target.value);
                            if (onFilenameChange) {
                                onFilenameChange(e.target.value);
                            }
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="diagram.bpmn"
                    />
                </div>

                <div className="h-6 w-px bg-gray-300 mx-2"></div>

                <div className="flex items-center space-x-2 border-r pr-4 mr-2">
                    <span className="text-sm font-medium text-gray-700">All Elements:</span>
                    <div className="flex items-center border rounded overflow-hidden">
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="h-8 w-8 cursor-pointer border-0 p-0"
                            title="Choose color"
                        />
                        <input
                            type="text"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="h-8 w-20 px-1 text-sm border-l uppercase"
                            placeholder="#000000"
                        />
                    </div>
                    <button
                        onClick={handleApplyToAll}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                        Apply to All
                    </button>
                    <button
                        onClick={handleConvertUserTasks}
                        className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 ml-2"
                        title="Convert all User Tasks to Standard Tasks"
                    >
                        Convert User Tasks
                    </button>
                    <button
                        onClick={handleResizeTasks}
                        className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700 ml-2"
                        title="Reset all tasks to standard size (100x80)"
                    >
                        Fix Size
                    </button>
                    <button
                        onClick={handleStandardStyle}
                        className="bg-yellow-100 text-black border border-yellow-300 px-3 py-1 rounded text-sm hover:bg-yellow-200 ml-2"
                        title="Apply standard style to all tasks (#FFFFCC)"
                    >
                        Standard
                    </button>
                    <button
                        onClick={handleNagarro}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 ml-2 shadow-md"
                        title="Convert Tasks + Fix Size + Apply Standard Style"
                    >
                        🚀 Nagarro
                    </button>
                </div>

                <span className="text-sm font-medium text-gray-700">Selected:</span>
                <div className="flex space-x-2">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => handleColorChange(color.fill, color.stroke)}
                            disabled={!hasSelection}
                            className={`w-8 h-8 rounded border border-gray-300 shadow-sm ${!hasSelection ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                            style={{ backgroundColor: color.fill, borderColor: color.stroke }}
                            title={`Set ${color.name}`}
                        />
                    ))}
                </div>
                {!hasSelection && <span className="text-xs text-danger-500 font-bold ml-2 text-red-500">Click element to style</span>}
            </div>

            <div className="flex-grow relative h-full w-full bg-white" ref={containerRef}></div>
        </div>
    );
}
