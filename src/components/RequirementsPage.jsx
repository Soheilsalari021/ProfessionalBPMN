import React, { useState, useEffect } from 'react';
import { callGeminiAI } from '../utils/geminiService';
import { processNagarroBPMN } from '../utils/bpmnProcessor';
import { generateRequirementsPDF } from '../utils/pdfGenerator';

const STEP_TYPES = {
    TASK: 'TASK',
    DECISION: 'DECISION',
    PARALLEL: 'PARALLEL',
    SUBPROCESS: 'SUBPROCESS'
};

const RequirementsPage = ({ onBack, onGenerate }) => {
    // Basic Process Info
    const [processName, setProcessName] = useState('');
    const [trigger, setTrigger] = useState('');

    // Steps Flow and Navigation
    const [title, setTitle] = useState('Anforderungen aufgeben'); // Dynamic title based on view
    const [steps, setSteps] = useState([]); // This is the ROOT flow
    const [viewPath, setViewPath] = useState([]); // Array of { id, name } to track current depth

    // Derived state: Current Steps (based on viewPath)
    // Helper to find the current steps array based on viewPath
    const getCurrentSteps = (rootSteps, path) => {
        let current = rootSteps;
        for (const segment of path) {
            if (!current) return [];
            const step = current.find(s => s.id === segment.id);
            if (step && step.type === STEP_TYPES.SUBPROCESS) {
                current = step.steps || [];
            } else {
                return []; // Should not happen or step not found
            }
        }
        return current || [];
    };

    const currentSteps = getCurrentSteps(steps, viewPath) || [];

    // Helper to update the root steps immutably given new steps for the current view
    const updateCurrentSteps = (newSteps) => {
        if (viewPath.length === 0) {
            setSteps(newSteps);
            return;
        }

        const updateRecursive = (currentList, pathIndex) => {
            const segment = viewPath[pathIndex];
            return currentList.map(step => {
                if (step.id === segment.id) {
                    if (pathIndex === viewPath.length - 1) {
                        // We found the parent of the current view
                        return { ...step, steps: newSteps };
                    } else {
                        // Continue drilling down
                        return { ...step, steps: updateRecursive(step.steps, pathIndex + 1) };
                    }
                }
                return step;
            });
        };

        setSteps(updateRecursive(steps, 0));
    };

    const [knownRoles, setKnownRoles] = useState(['Mitarbeiter', 'Manager', 'System']);
    const [newRoleInput, setNewRoleInput] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [warnings, setWarnings] = useState([]);

    // Real-time Validation Effect
    useEffect(() => {
        const newWarnings = [];
        if (!processName) newWarnings.push("Prozessname fehlt");
        if (!trigger) newWarnings.push("Start-Auslöser fehlt");

        steps.forEach((step, index) => {
            const num = index + 1;
            if (step.type === STEP_TYPES.TASK) {
                if (!step.role) newWarnings.push(`Schritt ${num}: Rolle fehlt`);
                if (step.action && step.action.length < 3) newWarnings.push(`Schritt ${num}: Aktion zu kurz`);
            }
            if (step.type === STEP_TYPES.DECISION) {
                if (!step.question) newWarnings.push(`Schritt ${num}: Frage fehlt`);
                if (!step.role) newWarnings.push(`Schritt ${num}: Rolle fehlt`);
            }
        });
        setWarnings(newWarnings);
    }, [steps, processName, trigger, knownRoles]);

    // Step Types
    const STEP_TYPES = {
        TASK: 'task',
        DECISION: 'decision',
        PARALLEL: 'parallel',
        SUBPROCESS: 'subprocess'
    };

    const addStep = (type) => {
        const newStep = {
            id: Date.now(),
            type,
            role: knownRoles[0] || '', // Default to first available role
            // Fields depend on type
            action: '', // For TASK

            // Decision Fields (Enhanced)
            question: '',
            yesBranch: { actions: [], endsProcess: false },
            noBranch: { actions: [], endsProcess: false },

            parallelActions: [], // Array of strings/objects

            // Subprocess Fields
            name: '',
            steps: []
        };
        updateCurrentSteps([...currentSteps, newStep]);
    };

    const updateStep = (id, field, value) => {
        updateCurrentSteps(currentSteps.map(step =>
            step.id === id ? { ...step, [field]: value } : step
        ));
    };

    const enterSubprocess = (step) => {
        setViewPath([...viewPath, { id: step.id, name: step.name || "Unterprozess" }]);
    };

    const navigateUp = (index) => {
        if (index === -1) {
            setViewPath([]);
        } else {
            setViewPath(viewPath.slice(0, index + 1));
        }
    };

    // Helper to update nested decision branches
    const updateDecisionBranch = (stepId, branchType, changeType, value, index = null) => {
        updateCurrentSteps(currentSteps.map(step => {
            if (step.id !== stepId) return step;

            const branchKey = branchType === 'yes' ? 'yesBranch' : 'noBranch';
            const branch = { ...step[branchKey] };

            if (changeType === 'addAction') {
                branch.actions = [...branch.actions, { text: "", role: step.role }];
            } else if (changeType === 'updateActionText') {
                branch.actions[index] = { ...branch.actions[index], text: value };
            } else if (changeType === 'updateActionRole') {
                branch.actions[index] = { ...branch.actions[index], role: value };
            } else if (changeType === 'removeAction') {
                branch.actions = branch.actions.filter((_, i) => i !== index);
            } else if (changeType === 'toggleEnd') {
                branch.endsProcess = value;
            }

            return { ...step, [branchKey]: branch };
        }));
    };

    const removeStep = (id) => {
        updateCurrentSteps(currentSteps.filter(step => step.id !== id));
    };

    const addRole = () => {
        if (newRoleInput && !knownRoles.includes(newRoleInput)) {
            setKnownRoles([...knownRoles, newRoleInput]);
            setNewRoleInput('');
        }
    };

    const removeRole = (role) => {
        setKnownRoles(knownRoles.filter(r => r !== role));
    };

    const validateBPMNRules = () => {
        const errors = [];
        if (viewPath.length === 0) {
            if (!processName) errors.push("Der Prozess benötigt einen Namen.");
            if (!trigger) errors.push("Der Prozess benötigt einen Start-Auslöser (Event).");
        } else {
            // Subprocess validation
            if (currentSteps.length === 0) errors.push("Der Unterprozess ist leer. Füge Schritte hinzu.");
        }

        currentSteps.forEach((step, index) => {
            const num = index + 1;
            if (step.type === STEP_TYPES.TASK) {
                if (!step.role) errors.push(`Schritt ${num}: Eine Rolle muss zugewiesen sein (Pool/Lane Regel).`);
                if (!step.action || step.action.length < 3) errors.push(`Schritt ${num}: Die Aufgabe muss beschrieben sein (Verb + Objekt).`);
            }
            if (step.type === STEP_TYPES.DECISION) {
                if (!step.question) errors.push(`Schritt ${num}: Die Entscheidung benötigt eine Frage.`);
                if (!step.role) errors.push(`Schritt ${num}: Wer trifft die Entscheidung? (Rolle fehlt).`);
                // Check complex actions
                [...step.yesBranch.actions, ...step.noBranch.actions].forEach(act => {
                    if (typeof act === 'object' && !act.role) errors.push(`Schritt ${num}: Eine Aktion in der Entscheidung hat keine Rolle.`);
                    if (typeof act === 'object' && !act.text) errors.push(`Schritt ${num}: Eine Aktion in der Entscheidung ist leer.`);
                });
            }
            if (step.type === STEP_TYPES.SUBPROCESS) {
                if (!step.name) errors.push(`Schritt ${num}: Unterprozess benötigt einen Namen.`);
            }
        });
        return errors;
    };

    // Recursive prompt generation
    const generateFlowDescription = (stepsToProcess, level = 0) => {
        let description = "";
        const indent = "  ".repeat(level);

        stepsToProcess.forEach((step, index) => {
            const num = index + 1;
            if (step.type === STEP_TYPES.TASK) {
                description += `${indent}${num}. [Task] ${step.role} führt aus: "${step.action}"\n`;
            } else if (step.type === STEP_TYPES.DECISION) {
                // Handle complex actions objects
                const dataToString = (actions) => actions.map(a => typeof a === 'object' ? `(${a.role}: ${a.text})` : a).join(", ") || "Nichts";

                const yesActs = dataToString(step.yesBranch.actions);
                const noActs = dataToString(step.noBranch.actions);
                const yesEnd = step.yesBranch.endsProcess ? "(Prozess endet hier)" : "(Geht weiter)";
                const noEnd = step.noBranch.endsProcess ? "(Prozess endet hier)" : "(Geht weiter)";

                description += `${indent}${num}. [Decision] (${step.role}) prüft: "${step.question}"? \n`;
                description += `${indent}   - Ja: ${yesActs} ${yesEnd}\n`;
                description += `${indent}   - Nein: ${noActs} ${noEnd}\n`;
            } else if (step.type === STEP_TYPES.PARALLEL) {
                description += `${indent}${num}. [Parallel] Gleichzeitig passiert:\n   - ${step.parallelActions.join('\n   - ')}\n`;
            } else if (step.type === STEP_TYPES.SUBPROCESS) {
                description += `${indent}${num}. [SubProcess] "${step.name}" (Role: ${step.role || "General"})\n`;
                if (step.steps && step.steps.length > 0) {
                    description += `${indent}   Contains:\n`;
                    description += generateFlowDescription(step.steps, level + 1);
                } else {
                    description += `${indent}   (Empty Subprocess)\n`;
                }
            }
        });
        return description;
    };

    const handleGenerate = async () => {
        const validationErrors = validateBPMNRules();
        if (validationErrors.length > 0) {
            setError(validationErrors.join(" | "));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check validation of nested processes too? 
            // For now, generate anyway.

            const flowDescription = generateFlowDescription(steps);

            const prompt = `
            Create a professional BPMN 2.0 XML process based on the following flow.
            
            Process Name: ${processName}
            Start Event (Trigger): ${trigger}
            
            Flow Steps:
            ${flowDescription}
            
            STRICT BPMN 2.0 RULES TO FOLLOW:
            1.  **Pools & Lanes**: 
                - Create ONE Participant (Pool) for "My Company".
                - Inside this Pool, create a LaneSet.
                - Create a Lane for EACH unique Role mentioned.
                - Place every Task/Gateway in the correct Lane corresponding to the Role performing it.
            
            2.  **Sub-Processes**:
                - If a step is [SubProcess], check if it has internal steps.
                - If it has content, model it as an **Expanded Sub-Process** (or Collapsed if very large).
                - Use a separate Start Event and End Event INSIDE the Sub-Process.
                - Connect flows entering/leaving the Sub-Process correctly.
            
            3.  **Flow & Layout**:
                - Flow must go from Left to Right.
                - Sequence Flows must connect EVERY element. No floating elements!
            
            4.  **Gateways (Decisions)**:
                - Use Exclusive Gateway (XOR) for decisions.
                - Name the Gateway with the Question (e.g. "Invoice > 100?").
                - LABEL the outgoing Sequence Flows with "Yes" and "No".
                - If an action has a specific role (e.g. "(Manager: Approve)"), model it as a Task in the *Manager's* Lane following the Gateway.
                - Ensure splitting gateways merge back if the flow continues.
            
            5.  **Start & End**:
                - Start Event must have NO incoming flow.
                - End Events must have NO outgoing flow.
                - If a path ends, use an End Event.
            
            6.  **Task Naming**:
                - Use "Verb + Object" naming style (e.g. "Approve Invoice", NOT "Approval").
            
            Refine the model to look professional and clearly laid out.
            Return ONLY valid BPMN 2.0 XML.
            `;

            const xml = await callGeminiAI(prompt);
            const processedXml = await processNagarroBPMN(xml);

            onGenerate(processedXml, `${processName.replace(/\s+/g, '_')}.bpmn`);

        } catch (err) {
            console.error(err);
            setError(err.message || "Fehler bei der Generierung");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPDF = async () => {
        const previewElement = document.querySelector('.preview-container');
        if (!previewElement) {
            alert('Vorschau nicht gefunden. Bitte stelle sicher, dass die Vorschau sichtbar ist.');
            return;
        }

        console.log('=== PDF EXPORT DEBUG ===');
        console.log('processName:', processName);
        console.log('trigger:', trigger);
        console.log('steps (root):', steps);
        console.log('currentSteps:', currentSteps);
        console.log('viewPath:', viewPath);
        console.log('steps.length:', steps?.length);
        console.log('currentSteps.length:', currentSteps?.length);

        // Use currentSteps which has the actual data
        const stepsToExport = currentSteps;

        if (!stepsToExport || stepsToExport.length === 0) {
            alert('Keine Schritte vorhanden. Bitte füge zuerst Schritte hinzu.');
            return;
        }

        try {
            await generateRequirementsPDF(processName, trigger, stepsToExport, previewElement);
        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('Fehler beim Erstellen des PDFs: ' + error.message);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-gray-900 text-gray-100 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-8 py-4 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
                        ← Zurück
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">📋</span> Anforderungen
                        </h1>
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <button
                                onClick={() => setViewPath([])}
                                className={`hover:text-emerald-400 ${viewPath.length === 0 ? 'text-emerald-500 font-bold' : ''}`}
                            >
                                Hauptprozess
                            </button>
                            {viewPath.map((segment, index) => (
                                <React.Fragment key={segment.id}>
                                    <span>/</span>
                                    <button
                                        onClick={() => setViewPath(viewPath.slice(0, index + 1))}
                                        className={`hover:text-emerald-400 ${index === viewPath.length - 1 ? 'text-emerald-500 font-bold' : ''}`}
                                    >
                                        {segment.name}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportPDF}
                        className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-500 hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        📄 PDF Exportieren
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className={`
                            px-6 py-2 bg-emerald-600 text-white rounded-full font-bold shadow-lg 
                            hover:bg-emerald-500 hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2
                            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        {isLoading ? 'Generiere BPMN...' : '✨ Prozess erstellen'}
                    </button>
                </div>
            </div>

            {/* Main Content: Split View */}
            <div className="flex-grow flex overflow-hidden">

                {/* LEFT: Builder Form */}
                <div className="w-1/2 p-8 overflow-y-auto border-r border-gray-800 bg-gray-900/50">

                    {error && (
                        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-6 mb-8">
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                            <h3 className="text-lg font-semibold text-emerald-400 mb-4">Basis-Informationen</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Name des Prozesses</label>
                                    <input
                                        type="text"
                                        value={processName}
                                        onChange={(e) => setProcessName(e.target.value)}
                                        placeholder="z.B. Urlaubsantrag"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Auslöser (Start)</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-transparent shrink-0"></div>
                                        <input
                                            type="text"
                                            value={trigger}
                                            onChange={(e) => setTrigger(e.target.value)}
                                            placeholder="z.B. Mitarbeiter sendet Formular"
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Roles Management */}
                    <div className="space-y-6 mb-8">
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                            <h3 className="text-lg font-semibold text-emerald-400 mb-4">Beteiligte Rollen / Abteilungen</h3>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newRoleInput}
                                    onChange={(e) => setNewRoleInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addRole()}
                                    placeholder="Neue Rolle hinzufügen (z.B. Personalabteilung)"
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={addRole}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold"
                                >
                                    +
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {knownRoles.map((role, index) => (
                                    <span key={index} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-gray-600">
                                        {role}
                                        <button onClick={() => removeRole(role)} className="hover:text-red-400 font-bold ml-1">×</button>
                                    </span>
                                ))}
                                {knownRoles.length === 0 && (
                                    <span className="text-gray-500 text-sm italic">Keine Rollen definiert.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Steps Builder */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-emerald-400 mb-2">Ablauf</h3>

                        {currentSteps.map((step, index) => (
                            <div key={step.id} className="relative group bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-emerald-500/30 transition-all">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeStep(step.id)} className="text-red-400 hover:text-red-300">
                                        🗑️
                                    </button>
                                </div>

                                <div className="mb-3 flex items-center gap-2">
                                    <span className="bg-gray-700 text-gray-300 text-xs font-bold px-2 py-1 rounded">
                                        SCHRITT {index + 1}
                                    </span>
                                    <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">
                                        {step.type === STEP_TYPES.TASK && "👤 Aufgabe"}
                                        {step.type === STEP_TYPES.DECISION && "🤔 Entscheidung"}
                                        {step.type === STEP_TYPES.PARALLEL && "🔀 Parallel"}
                                        {step.type === STEP_TYPES.SUBPROCESS && "📂 Unterprozess"}
                                    </span>
                                </div>

                                {/* Task Inputs */}
                                {step.type === STEP_TYPES.TASK && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">WER? (Rolle)</label>
                                            <select
                                                value={step.role}
                                                onChange={(e) => updateStep(step.id, 'role', e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                                            >
                                                {knownRoles.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                                {!knownRoles.includes(step.role) && step.role && <option value={step.role}>{step.role}</option>}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">WAS? (Aktion)</label>
                                            <input
                                                type="text"
                                                value={step.action}
                                                onChange={(e) => updateStep(step.id, 'action', e.target.value)}
                                                placeholder="füllt Antrag aus"
                                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Decision Inputs (Enhanced with Granular Roles) */}
                                {step.type === STEP_TYPES.DECISION && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">WER ENTSCHEIDET?</label>
                                            <select
                                                value={step.role}
                                                onChange={(e) => updateStep(step.id, 'role', e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white mb-3"
                                            >
                                                {knownRoles.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                                {!knownRoles.includes(step.role) && step.role && <option value={step.role}>{step.role}</option>}
                                            </select>

                                            <label className="text-xs text-gray-500 block mb-1">FRAGE?</label>
                                            <input
                                                type="text"
                                                value={step.question}
                                                onChange={(e) => updateStep(step.id, 'question', e.target.value)}
                                                placeholder="Ist der Antrag okay?"
                                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Branch Renderer Helper */}
                                            {['yes', 'no'].map(branchType => {
                                                const branch = step[branchType === 'yes' ? 'yesBranch' : 'noBranch'];
                                                const colorClass = branchType === 'yes' ? 'text-emerald-400' : 'text-red-400';
                                                const label = branchType === 'yes' ? 'WENN JA:' : 'WENN NEIN:';

                                                return (
                                                    <div key={branchType} className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className={`text-xs ${colorClass} font-bold`}>{label}</label>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {branch.actions.map((act, i) => {
                                                                const actionText = typeof act === 'object' ? act.text : act;
                                                                const actionRole = typeof act === 'object' ? act.role : step.role;

                                                                return (
                                                                    <div key={i} className="flex flex-col gap-1 mb-2 bg-gray-800 p-2 rounded relative group">
                                                                        <button onClick={() => updateDecisionBranch(step.id, branchType, 'removeAction', null, i)} className="absolute top-1 right-1 text-gray-500 hover:text-red-400">×</button>

                                                                        <select
                                                                            value={actionRole}
                                                                            onChange={(e) => updateDecisionBranch(step.id, branchType, 'updateActionRole', e.target.value, i)}
                                                                            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300 w-full"
                                                                        >
                                                                            {knownRoles.map((r, idx) => <option key={idx} value={r}>{r}</option>)}
                                                                        </select>
                                                                        <input
                                                                            type="text"
                                                                            value={actionText}
                                                                            onChange={(e) => updateDecisionBranch(step.id, branchType, 'updateActionText', e.target.value, i)}
                                                                            placeholder="Aktion..."
                                                                            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white w-full"
                                                                        />
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* End Process Item */}
                                                            {branch.endsProcess && (
                                                                <div className="flex gap-1 items-center bg-red-900/20 border border-red-900/50 rounded px-2 py-1">
                                                                    <span className="text-xs text-red-300 flex-grow">🛑 Prozess endet hier</span>
                                                                    <button onClick={() => updateDecisionBranch(step.id, branchType, 'toggleEnd', false)} className="text-red-400 hover:text-red-200">×</button>
                                                                </div>
                                                            )}

                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    onClick={() => updateDecisionBranch(step.id, branchType, 'addAction')}
                                                                    className="flex-1 text-xs text-gray-400 hover:text-white border border-dashed border-gray-600 rounded px-2 py-1"
                                                                >
                                                                    + Aktion
                                                                </button>
                                                                {!branch.endsProcess && (
                                                                    <button
                                                                        onClick={() => updateDecisionBranch(step.id, branchType, 'toggleEnd', true)}
                                                                        className="flex-1 text-xs text-red-400 hover:text-red-300 border border-dashed border-red-900/50 rounded px-2 py-1"
                                                                    >
                                                                        + Ende
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Parallel Inputs (Simplified for non-experts: just a list of actions) */}
                                {step.type === STEP_TYPES.PARALLEL && (
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">WAS PASSIERT GLEICHZEITIG? (Kommagetrennt)</label>
                                        <textarea
                                            value={step.parallelActions.join(', ')}
                                            onChange={(e) => updateStep(step.id, 'parallelActions', e.target.value.split(',').map(s => s.trim()))}
                                            placeholder="Rechnung buchen, Ware versenden, Kunden informieren"
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm h-20"
                                        />
                                    </div>
                                )}

                                {/* Subprocess Inputs */}
                                {step.type === STEP_TYPES.SUBPROCESS && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">NAME DES UNTERPROZESSES</label>
                                            <input
                                                type="text"
                                                value={step.name}
                                                onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                                                placeholder="z.B. Rechnungsprüfung"
                                                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded border border-gray-700">
                                            <span className="text-sm text-gray-400">
                                                Enthält {step.steps ? step.steps.length : 0} Schritte
                                            </span>
                                            <button
                                                onClick={() => enterSubprocess(step)}
                                                className="bg-gray-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-gray-600 hover:border-emerald-500"
                                            >
                                                📂 Öffnen / Bearbeiten
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Step Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => addStep(STEP_TYPES.TASK)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-emerald-400 transition-all flex justify-center items-center gap-2">
                                + Aufgabe
                            </button>
                            <button onClick={() => addStep(STEP_TYPES.DECISION)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-emerald-400 transition-all flex justify-center items-center gap-2">
                                + Entscheidung
                            </button>
                            <button onClick={() => addStep(STEP_TYPES.PARALLEL)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-emerald-400 transition-all flex justify-center items-center gap-2">
                                + Parallel
                            </button>
                            <button onClick={() => addStep(STEP_TYPES.SUBPROCESS)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-emerald-400 transition-all flex justify-center items-center gap-2">
                                + Unterprozess
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Visual Preview */}
                <div className="preview-container w-1/2 bg-gray-950 p-8 relative overflow-hidden flex flex-col items-center overflow-y-auto">
                    <h3 className="absolute top-4 left-4 text-xs font-bold text-gray-600 uppercase tracking-widest">Live Vorschau</h3>

                    {/* Validation Warnings */}
                    {warnings.length > 0 && (
                        <div className="absolute top-12 right-4 left-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 z-10">
                            <h4 className="text-xs font-bold text-yellow-500 mb-1 flex items-center gap-2">
                                ⚠️ Optimierungsvorschläge
                            </h4>
                            <ul className="text-[10px] text-yellow-200/80 space-y-1 list-disc pl-3">
                                {warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    )}

                    <div className="mt-10 flex flex-col items-center space-y-4 w-full max-w-md">

                        {/* Start Event */}
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full border-4 border-white bg-transparent relative flex items-center justify-center">
                                {viewPath.length > 0 && <span className="text-[10px] text-gray-500 font-bold">SUB</span>}
                            </div>
                            <span className="mt-2 text-xs text-gray-500 max-w-[150px] text-center">
                                {viewPath.length === 0 ? (trigger || "Start") : (viewPath[viewPath.length - 1].name || "Sub-Start")}
                            </span>
                        </div>

                        {/* Arrow */}
                        {(currentSteps && currentSteps.length > 0) && <div className="h-8 w-px bg-gray-600"></div>}

                        {/* Steps Preview */}
                        {currentSteps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="w-full">
                                    {step.type === STEP_TYPES.TASK && (
                                        <div className="bg-yellow-100 border-2 border-black rounded-lg p-3 text-black text-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] w-full">
                                            <div className="text-xs font-bold uppercase mb-1 opacity-70">{step.role || "Rolle?"}</div>
                                            <div className="font-medium">{step.action || "Aktion?"}</div>
                                        </div>
                                    )}

                                    {step.type === STEP_TYPES.DECISION && (
                                        <div className="flex flex-col items-center">
                                            <div className="bg-orange-100 border-2 border-black rotate-45 w-24 h-24 flex items-center justify-center mb-4">
                                                <div className="-rotate-45 text-black text-center text-xs p-1 font-bold">
                                                    {step.question || "?"}
                                                </div>
                                            </div>
                                            <div className="flex justify-between w-full text-xs text-gray-500 px-4 gap-4">
                                                <div className="flex-1 flex flex-col items-center">
                                                    <span className="text-emerald-400 font-bold mb-1">JA</span>
                                                    {step.yesBranch.actions.map((act, i) => {
                                                        const txt = typeof act === 'object' ? act.text : act;
                                                        const role = typeof act === 'object' ? act.role : step.role;
                                                        return (
                                                            <div key={i} className="bg-yellow-50 border border-black p-1 mb-1 text-[10px] text-black rounded w-full text-center">
                                                                <div className="font-bold opacity-50 mb-1">{role}</div>
                                                                <div>{txt || "..."}</div>
                                                            </div>
                                                        );
                                                    })}
                                                    {step.yesBranch.endsProcess && (
                                                        <div className="w-6 h-6 rounded-full border-4 border-red-500 bg-transparent mt-1" title="Endet"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col items-center">
                                                    <span className="text-red-400 font-bold mb-1">NEIN</span>
                                                    {step.noBranch.actions.map((act, i) => {
                                                        const txt = typeof act === 'object' ? act.text : act;
                                                        const role = typeof act === 'object' ? act.role : step.role;
                                                        return (
                                                            <div key={i} className="bg-yellow-50 border border-black p-1 mb-1 text-[10px] text-black rounded w-full text-center">
                                                                <div className="font-bold opacity-50 mb-1">{role}</div>
                                                                <div>{txt || "..."}</div>
                                                            </div>
                                                        );
                                                    })}
                                                    {step.noBranch.endsProcess && (
                                                        <div className="w-6 h-6 rounded-full border-4 border-red-500 bg-transparent mt-1" title="Endet"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step.type === STEP_TYPES.PARALLEL && (
                                        <div className="flex flex-col items-center w-full">
                                            <div className="bg-white border-2 border-black rotate-45 w-12 h-12 flex items-center justify-center mb-2">
                                                <span className="-rotate-45 text-2xl text-black font-bold">+</span>
                                            </div>
                                            <div className="flex gap-2 justify-center w-full">
                                                {(step.parallelActions.length > 0 ? step.parallelActions : ["...", "..."]).map((action, i) => (
                                                    <div key={i} className="bg-yellow-50 border border-black p-2 text-xs text-black rounded flex-1 text-center">
                                                        {action}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-white border-2 border-black rotate-45 w-12 h-12 flex items-center justify-center mt-2">
                                                <span className="-rotate-45 text-2xl text-black font-bold">+</span>
                                            </div>
                                        </div>
                                    )}

                                    {step.type === STEP_TYPES.SUBPROCESS && (
                                        <div className="w-full bg-blue-50 border-2 border-black border-dashed rounded-lg p-3 text-black text-center relative pointer-events-none">
                                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">SUB</div>
                                            <div className="text-xs font-bold uppercase mb-1 opacity-70">Unterprozess</div>
                                            <div className="font-medium">{step.name || "Name?"}</div>
                                            <div className="text-[10px] opacity-70 mt-1">
                                                {step.steps ? step.steps.length : 0} Schritte
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {index < currentSteps.length - 1 && <div className="h-8 w-px bg-gray-600"></div>}
                            </React.Fragment>
                        ))}

                        {/* End Event */}
                        {(currentSteps && currentSteps.length > 0) && <div className="h-8 w-px bg-gray-600"></div>}
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full border-4 border-red-500 bg-transparent relative flex items-center justify-center">
                                {viewPath.length > 0 && <span className="text-[10px] text-red-500 font-bold">SUB</span>}
                            </div>
                            <span className="mt-2 text-xs text-gray-500">Ende</span>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default RequirementsPage;
