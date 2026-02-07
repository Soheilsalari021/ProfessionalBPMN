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

        // 1. Convert all specialized tasks to standard tasks
        const elementRegistry = modeler.get('elementRegistry');
        const bpmnReplace = modeler.get('bpmnReplace');

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

        // Convert Call Activities to SubProcesses (for thin borders)
        const callActivities = elementRegistry.filter(element => element.type === 'bpmn:CallActivity');
        callActivities.forEach(callActivity => {
            bpmnReplace.replaceElement(callActivity, {
                type: 'bpmn:SubProcess'
            });
        });

        // 2. Fix task sizes (including subprocesses)
        const modeling = modeler.get('modeling');
        const tasks = elementRegistry.filter(element => element.type === 'bpmn:Task');
        const subProcesses = elementRegistry.filter(element => element.type === 'bpmn:SubProcess');

        // Resize all tasks
        tasks.forEach(task => {
            const bounds = {
                x: task.x,
                y: task.y,
                width: 100,
                height: 80
            };
            modeling.resizeShape(task, bounds);
        });

        // Resize all subprocesses to match task size
        subProcesses.forEach(subProcess => {
            const bounds = {
                x: subProcess.x,
                y: subProcess.y,
                width: 100,
                height: 80
            };
            modeling.resizeShape(subProcess, bounds);
        });

        // 3. Apply standard colors directly
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

        // Color Tasks Yellow with Thin Black Border
        const allTasks = elementRegistry.filter(element => taskTypes.includes(element.type));

        // Set colors
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

        // 4. Apply standard style via XML post-processing
        const { xml: processedXml } = await modeler.saveXML({ format: true });

        // Post-process XML for Signavio compatibility
        const finalXml = processedXml
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

        // Re-import to apply changes
        await modeler.importXML(finalXml);
        const { xml: finalProcessedXml } = await modeler.saveXML({ format: true });

        return finalProcessedXml;
    } finally {
        // Cleanup
        modeler.destroy();
        document.body.removeChild(container);
    }
}
