import React, { useState } from 'react';

// SVG Icon Components
const RocketIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const EditorIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const ClipboardIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const DocumentIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const BatchIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);

// Small content icons
const PlusIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
);

const FolderIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

const SaveIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);

const WrenchIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

const ToolbarIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
);

const SparklesIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const ListIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SplitIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);

const BoltIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const BoxIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const FileExportIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CogIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const FilesIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const DownloadIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

// Gradient configs for section icons
const sectionGradients = [
    'from-emerald-400 to-teal-500',
    'from-blue-400 to-indigo-500',
    'from-emerald-500 to-cyan-600',
    'from-amber-400 to-orange-500',
    'from-purple-500 to-indigo-600',
];

const sectionIcons = [RocketIcon, EditorIcon, ClipboardIcon, DocumentIcon, BatchIcon];

export default function TutorialPage({ onBack }) {
    const [activeSection, setActiveSection] = useState(0);

    const sections = [
        {
            title: 'Erste Schritte',
            subtitle: 'So startest du mit dem BPMN Editor',
            content: [
                {
                    heading: 'Neues Diagramm erstellen',
                    text: 'Fahre mit der Maus über die "BPMN Studio" Kachel auf der Startseite und klicke auf "Create New", um ein leeres Diagramm zu öffnen.',
                    icon: PlusIcon
                },
                {
                    heading: 'Bestehendes Diagramm öffnen',
                    text: 'Klicke auf "Open File" oder ziehe eine .bpmn-Datei per Drag & Drop auf die BPMN Studio Kachel.',
                    icon: FolderIcon
                },
                {
                    heading: 'Diagramm speichern',
                    text: 'Dein Diagramm wird automatisch im Browser gespeichert. Du kannst es auch als .bpmn-Datei herunterladen über die Toolbar.',
                    icon: SaveIcon
                }
            ]
        },
        {
            title: 'BPMN Editor',
            subtitle: 'Alle Funktionen des Editors',
            content: [
                {
                    heading: 'Elemente hinzufügen',
                    text: 'Klicke auf ein Element im Diagramm und nutze das Kontextmenü, um neue Tasks, Gateways, Events oder Verbindungen hinzuzufügen.',
                    icon: WrenchIcon
                },
                {
                    heading: 'Elemente bearbeiten',
                    text: 'Doppelklicke auf ein Element, um den Namen zu bearbeiten. Über das Properties-Panel rechts kannst du weitere Eigenschaften anpassen.',
                    icon: PencilIcon
                },
                {
                    heading: 'Toolbar-Funktionen',
                    text: 'Die Toolbar oben bietet: Rückgängig/Wiederholen, Zoom, Vollbild, Export als SVG/PNG, und die Auto-Style Funktion für professionelles Aussehen.',
                    icon: ToolbarIcon
                },
                {
                    heading: 'Magic AI',
                    text: 'Klicke auf den "Magic AI" Button in der Toolbar, um KI-gestützte Vorschläge für dein Diagramm zu erhalten. Die AI kann Prozesse analysieren und Optimierungen vorschlagen.',
                    icon: SparklesIcon
                }
            ]
        },
        {
            title: 'Anforderungen Builder',
            subtitle: 'Prozesse interaktiv definieren',
            content: [
                {
                    heading: 'Anforderungen öffnen',
                    text: 'Klicke auf "Anforderungen aufgeben" in der Navigation, um den interaktiven Requirements Builder zu öffnen.',
                    icon: ListIcon
                },
                {
                    heading: 'Schritte hinzufügen',
                    text: 'Verwende die Buttons am unteren Rand: + Aufgabe, + Entscheidung, + Parallel, + Unterprozess. Jeder Schritt wird automatisch in der Live-Vorschau angezeigt.',
                    icon: PlusIcon
                },
                {
                    heading: 'Aufgaben definieren',
                    text: 'Wähle eine Rolle (z.B. Mitarbeiter, Manager) und beschreibe die Aktion, die ausgeführt werden soll.',
                    icon: CheckIcon
                },
                {
                    heading: 'Entscheidungen modellieren',
                    text: 'Definiere eine Frage und füge Aktionen für den JA- und NEIN-Zweig hinzu. Jeder Zweig kann mehrere Aktionen enthalten.',
                    icon: SplitIcon
                },
                {
                    heading: 'Parallele Schritte',
                    text: 'Beschreibe Aktionen, die gleichzeitig ausgeführt werden sollen, z.B. "Rechnung buchen, Ware versenden, Kunden informieren".',
                    icon: BoltIcon
                },
                {
                    heading: 'Unterprozesse',
                    text: 'Erstelle verschachtelte Prozesse mit eigenem Namen. Klicke auf "Öffnen / Bearbeiten" um in den Unterprozess hineinzunavigieren.',
                    icon: BoxIcon
                }
            ]
        },
        {
            title: 'PDF Export & Prozess',
            subtitle: 'Exportieren und Generieren',
            content: [
                {
                    heading: 'PDF Exportieren',
                    text: 'Klicke auf "PDF Exportieren" im Anforderungen-Builder, um ein detailliertes PDF-Dokument mit allen Schritten, hierarchischer Nummerierung und Prozessinformationen zu erstellen.',
                    icon: FileExportIcon
                },
                {
                    heading: 'Prozess erstellen',
                    text: 'Klicke auf "Prozess erstellen", um aus deinen Anforderungen automatisch ein BPMN-Diagramm zu generieren. Die KI erstellt den Prozess basierend auf deinen Schritten.',
                    icon: CogIcon
                },
                {
                    heading: 'Live Vorschau',
                    text: 'Auf der rechten Seite des Anforderungen-Builders siehst du eine Live-Vorschau deines Prozesses, die sich automatisch aktualisiert wenn du Schritte hinzufügst oder änderst.',
                    icon: EyeIcon
                }
            ]
        },
        {
            title: 'Signavio Standards',
            subtitle: 'Batch-Konvertierung für Signavio',
            content: [
                {
                    heading: 'Dateien auswählen',
                    text: 'Klicke auf die "Signavio Standards" Kachel auf der Startseite und wähle eine oder mehrere .bpmn-Dateien aus.',
                    icon: FilesIcon
                },
                {
                    heading: 'Automatische Konvertierung',
                    text: 'Alle ausgewählten Dateien werden automatisch in Signavio-Standards konvertiert: Styling, Größenanpassung und Standardisierung werden angewendet.',
                    icon: RefreshIcon
                },
                {
                    heading: 'Download',
                    text: 'Die verarbeiteten Dateien werden automatisch heruntergeladen mit dem Suffix "_nagarro" im Dateinamen.',
                    icon: DownloadIcon
                }
            ]
        }
    ];

    const SectionIcon = sectionIcons[activeSection];

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium">Zurück</span>
                    </button>
                    <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        Tutorial & Anleitung
                    </h1>
                    <div className="w-20"></div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8 flex gap-8">
                {/* Sidebar Navigation */}
                <div className="w-72 flex-shrink-0">
                    <div className="sticky top-24 space-y-2">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-3">Kapitel</h2>
                        {sections.map((section, index) => {
                            const NavIcon = sectionIcons[index];
                            return (
                                <button
                                    key={index}
                                    onClick={() => setActiveSection(index)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${activeSection === index
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                        }`}
                                >
                                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${sectionGradients[index]} flex items-center justify-center flex-shrink-0`}>
                                        <div className="scale-75"><NavIcon /></div>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{section.title}</div>
                                        <div className="text-xs opacity-60 mt-0.5">{section.subtitle}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow max-w-3xl">
                    {/* Section Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${sectionGradients[activeSection]} flex items-center justify-center shadow-lg`}>
                                <div className="scale-125"><SectionIcon /></div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white">{sections[activeSection].title}</h2>
                                <p className="text-gray-400 mt-1">{sections[activeSection].subtitle}</p>
                            </div>
                        </div>
                        <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full mt-4"></div>
                    </div>

                    {/* Content Cards */}
                    <div className="space-y-6">
                        {sections[activeSection].content.map((item, index) => {
                            const ItemIcon = item.icon;
                            return (
                                <div
                                    key={index}
                                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${sectionGradients[activeSection]} bg-opacity-20 border border-white/10 flex items-center justify-center`}>
                                            <ItemIcon />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                                                {item.heading}
                                            </h3>
                                            <p className="text-gray-400 leading-relaxed text-sm">
                                                {item.text}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
                        <button
                            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                            disabled={activeSection === 0}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${activeSection === 0
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Vorheriges Kapitel
                        </button>
                        <span className="text-gray-600 text-sm font-medium">
                            {activeSection + 1} / {sections.length}
                        </span>
                        <button
                            onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                            disabled={activeSection === sections.length - 1}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${activeSection === sections.length - 1
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30'
                                }`}
                        >
                            Nächstes Kapitel
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
