import jsPDF from 'jspdf';

const STEP_TYPES = {
    TASK: 'TASK',
    DECISION: 'DECISION',
    PARALLEL: 'PARALLEL',
    SUBPROCESS: 'SUBPROCESS'
};

/**
 * Generates a detailed PDF requirements document for BPMN modelers
 */
export const generateRequirementsPDF = async (processName, trigger, steps, previewElement) => {
    console.log('=== generateRequirementsPDF CALLED ===');
    console.log('Arguments:', { processName, trigger, steps, stepsLength: steps?.length });

    // Validate input
    if (!steps || !Array.isArray(steps)) {
        const errorMsg = `FEHLER: steps ist ${steps === null ? 'null' : steps === undefined ? 'undefined' : 'kein Array'}`;
        console.error(errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
    }

    if (steps.length === 0) {
        const errorMsg = 'FEHLER: steps Array ist leer (length = 0)';
        console.error(errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
    }

    console.log('Validation passed. Creating PDF...');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // Helper to check page break
    const checkPage = () => {
        if (y > pageHeight - 20) {
            pdf.addPage();
            y = margin;
        }
    };

    // ===== HEADER =====
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BPMN Anforderungsdokument', margin, 15);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, margin, 25);
    pdf.text(`Prozess: ${processName || 'Unbenannt'}`, margin, 32);

    y = 50;
    pdf.setTextColor(0, 0, 0);

    // ===== PROCESS INFO =====
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Prozessinformationen', margin, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Start-Auslöser: ${trigger || 'Nicht definiert'}`, margin, y);
    y += 10;

    // ===== DETAILED STEPS =====
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detaillierte Schrittbeschreibung', margin, y);
    y += 10;

    // Recursive function to render steps
    const renderSteps = (stepsList, numberPrefix = '', indent = 0) => {
        const leftMargin = margin + (indent * 5);

        stepsList.forEach((step, index) => {
            const stepNumber = numberPrefix ? `${numberPrefix}.${index + 1}` : `${index + 1}`;

            checkPage();

            // Step header
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');

            let header = '';
            if (step.type === STEP_TYPES.TASK) {
                header = `${stepNumber}. [AUFGABE] ${step.role || 'Rolle?'}: ${step.action || 'Keine Aktion'}`;
            } else if (step.type === STEP_TYPES.DECISION) {
                header = `${stepNumber}. [ENTSCHEIDUNG] ${step.role || 'Rolle?'}: ${step.question || 'Keine Frage'}`;
            } else if (step.type === STEP_TYPES.PARALLEL) {
                header = `${stepNumber}. [PARALLEL] Gleichzeitige Aktionen`;
            } else if (step.type === STEP_TYPES.SUBPROCESS) {
                header = `${stepNumber}. [UNTERPROZESS] ${step.name || 'Unbenannt'}`;
            }

            pdf.text(header, leftMargin, y);
            y += 6;

            // Step details
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');

            if (step.type === STEP_TYPES.DECISION) {
                // YES Branch
                pdf.setFont('helvetica', 'bold');
                pdf.text(`   ${stepNumber}.1 JA-Zweig:`, leftMargin, y);
                y += 5;
                pdf.setFont('helvetica', 'normal');

                if (step.yesBranch && step.yesBranch.actions && step.yesBranch.actions.length > 0) {
                    step.yesBranch.actions.forEach((action) => {
                        checkPage();
                        const actionText = typeof action === 'object' ? action.text : action;
                        const actionRole = typeof action === 'object' ? action.role : step.role;
                        pdf.text(`      - ${actionRole}: ${actionText || '...'}`, leftMargin, y);
                        y += 4;
                    });
                } else {
                    pdf.text(`      (Keine Aktionen)`, leftMargin, y);
                    y += 4;
                }
                y += 2;

                // NO Branch
                pdf.setFont('helvetica', 'bold');
                pdf.text(`   ${stepNumber}.2 NEIN-Zweig:`, leftMargin, y);
                y += 5;
                pdf.setFont('helvetica', 'normal');

                if (step.noBranch && step.noBranch.actions && step.noBranch.actions.length > 0) {
                    step.noBranch.actions.forEach((action) => {
                        checkPage();
                        const actionText = typeof action === 'object' ? action.text : action;
                        const actionRole = typeof action === 'object' ? action.role : step.role;
                        pdf.text(`      - ${actionRole}: ${actionText || '...'}`, leftMargin, y);
                        y += 4;
                    });
                } else {
                    pdf.text(`      (Keine Aktionen)`, leftMargin, y);
                    y += 4;
                }
                y += 4;
            } else if (step.type === STEP_TYPES.PARALLEL) {
                if (step.parallelActions && step.parallelActions.length > 0) {
                    step.parallelActions.forEach((action) => {
                        checkPage();
                        pdf.text(`   - ${action}`, leftMargin, y);
                        y += 4;
                    });
                } else {
                    pdf.text(`   (Keine parallelen Aktionen)`, leftMargin, y);
                    y += 4;
                }
                y += 4;
            } else if (step.type === STEP_TYPES.SUBPROCESS) {
                y += 2;
                if (step.steps && step.steps.length > 0) {
                    renderSteps(step.steps, stepNumber, indent + 1);
                } else {
                    pdf.text(`   (Leerer Unterprozess)`, leftMargin, y);
                    y += 4;
                }
                y += 4;
            } else {
                // TASK - already rendered in header
                y += 2;
            }

            y += 3;
        });
    };

    console.log('About to render steps:', steps);
    renderSteps(steps);

    // ===== VISUAL PREVIEW PLACEHOLDER =====
    checkPage();
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Visuelle Vorschau (User-Ansicht)', margin, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('(Die visuelle Vorschau wurde aufgrund technischer Einschränkungen nicht erfasst.', margin, y);
    y += 5;
    pdf.text('Bitte beziehen Sie sich auf die detaillierte Schrittbeschreibung oben.)', margin, y);

    // ===== DOWNLOAD =====
    const fileName = `${processName || 'Prozess'}_Anforderungen.pdf`;
    console.log('Saving PDF as:', fileName);
    pdf.save(fileName);
    console.log('PDF saved successfully!');
};
