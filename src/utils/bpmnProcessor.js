import BpmnModeler from 'bpmn-js/lib/Modeler';
import biocModdleDescriptor from '../moddle/bioc.json';

/**
 * Process a single BPMN file with Nagarro transformations
 * @param {string} xml - BPMN XML content
 * @returns {Promise<string>} - Processed BPMN XML
 */
export async function processNagarroBPMN(xml) {
    // Create a temporary modeler instance
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    const modeler = new BpmnModeler({
        container: container,
        moddleExtensions: {
            bioc: biocModdleDescriptor
        }
    });

    try {
        // Import XML
        await modeler.importXML(xml);

        const elementRegistry = modeler.get('elementRegistry');
        const bpmnReplace = modeler.get('bpmnReplace');
        const modeling = modeler.get('modeling');

        // =====================================================
        // Step 1: Convert all specialized tasks to standard tasks
        // (Matches editor's handleConvertUserTasks)
        // =====================================================
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

        // Convert Call Activities to SubProcesses (thick border → thin border)
        const callActivities = elementRegistry.filter(element => element.type === 'bpmn:CallActivity');
        callActivities.forEach(callActivity => {
            bpmnReplace.replaceElement(callActivity, {
                type: 'bpmn:SubProcess'
            });
        });

        // Wait for conversion to complete (matches editor's 300ms delay)
        await new Promise(resolve => setTimeout(resolve, 300));

        // =====================================================
        // Step 2: Resize all tasks to 100x80 pixels
        // (Matches editor's handleResizeTasks)
        // =====================================================
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

        const tasksToResize = elementRegistry.filter(element => taskTypes.includes(element.type));

        tasksToResize.forEach(task => {
            if (task.x === undefined || task.y === undefined) return;
            modeling.resizeShape(task, {
                x: task.x,
                y: task.y,
                width: 100,
                height: 80
            });
        });

        // Re-layout all connections to ensure they are straight
        const sequenceFlows = elementRegistry.filter(element => element.type === 'bpmn:SequenceFlow');
        sequenceFlows.forEach(connection => {
            modeling.layoutConnection(connection);
        });

        // Wait for resizing to complete (matches editor's 300ms delay)
        await new Promise(resolve => setTimeout(resolve, 300));

        // =====================================================
        // Step 3: Apply standard style (colors and Signavio metadata)
        // (Matches editor's handleStandardStyle)
        // =====================================================

        // Color Tasks Yellow with Black Border
        const allTasks = elementRegistry.filter(element => taskTypes.includes(element.type));
        modeling.setColor(allTasks, {
            fill: '#FFFFCC',
            stroke: '#000000'
        });

        // Set thin stroke width using canvas API
        const canvas = modeler.get('canvas');
        allTasks.forEach(task => {
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

        // Reset Pools/Lanes to White with Black Border
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

        // Reset Connections to Black
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

        // Fix Signavio metadata bordercolors/bgcolors via XML post-processing
        const { xml: processedXml } = await modeler.saveXML({ format: true });

        const finalXml = processedXml
            // All borders → black
            .replace(/(<signavio:signavioMetaData metaKey="bordercolor" metaValue=")#[0-9A-Fa-f]{6}(")/gi, '$1#000000$2')
            // Task backgrounds → yellow
            .replace(/(<signavio:signavioMetaData metaKey="bgcolor" metaValue=")#E3F0FF(")/gi, '$1#FFFFCC$2')
            // Pool/Lane backgrounds → white
            .replace(/(<signavio:signavioMetaData metaKey="bgcolor" metaValue=")#FFF3B8(")/gi, '$1#FFFFFF$2')
            // Event backgrounds → white
            .replace(/(<signavio:signavioMetaData metaKey="bgcolor" metaValue=")#F5FAE5(")/gi, '$1#FFFFFF$2')
            .replace(/(<signavio:signavioMetaData metaKey="bgcolor" metaValue=")#FFEAF4(")/gi, '$1#FFFFFF$2');

        // Re-import to apply changes, then export final XML
        await modeler.importXML(finalXml);
        const { xml: finalProcessedXml } = await modeler.saveXML({ format: true });

        return finalProcessedXml;
    } finally {
        // Cleanup
        modeler.destroy();
        document.body.removeChild(container);
    }
}
