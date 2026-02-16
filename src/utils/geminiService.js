
export const getGeminiKey = () => {
    return localStorage.getItem('gemini_api_key');
};

export const setGeminiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
};

export const callGeminiAI = async (prompt, currentXml) => {
    const apiKey = getGeminiKey();
    if (!apiKey) {
        throw new Error("NO_KEY");
    }

    const systemPrompt = `
    You are an expert BPMN 2.0 process modeler. 
    Your goal is to modify or create BPMN diagrams based on the user's request.
    
    Current XML Context (might be empty):
    ${currentXml ? 'Checking current XML...' : 'No existing XML.'}

    User Request: "${prompt}"

    Instructions:
    - If the user asks to create a process, output the FULL VALID BPMN 2.0 XML.
    - If the user asks to modify (e.g. "add a task"), just output the snippet or the modified full XML.
    - IMPORTANT: Ensure all elements have valid BPMNDI coordinates (BPMNShape/BPMNEdge).
    - LAYOUT RULES: 
      - Arrange the flow from LEFT to RIGHT.
      - Increment the X coordinate by at least 150 for each step.
      - Ensure NO elements overlap.
      - Place parallel paths on different Y coordinates (e.g. Y=100, Y=250).
    - Return ONLY the XML string. No markdown formatting, no code blocks, no explanations.
    - Start directly with <?xml ...
    `;

    try {
        // Use gemini-2.5-flash as requested by user
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemPrompt }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Full Error:", data.error);
            const msg = data.error.message || "Unknown API Error";

            // If model not found, try to list available models to help debug
            if (msg.includes("not found") || data.error.code === 404) {
                try {
                    console.log("Attempting to list available models...");
                    const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                    const listData = await listResp.json();
                    console.log("AVAILABLE MODELS FOR THIS KEY:", listData);
                    if (listData.models) {
                        const modelNames = listData.models.map(m => m.name).join(", ");
                        throw new Error(`Model not found. Your key has access to: ${modelNames}`);
                    }
                } catch (listErr) {
                    console.error("Failed to list models:", listErr);
                }
            }
            throw new Error(msg);
        }

        let text = data.candidates[0].content.parts[0].text;

        // Clean up markdown code blocks if present
        text = text.replace(/```xml/g, '').replace(/```/g, '').trim();

        return text;

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
