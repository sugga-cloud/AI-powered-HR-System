import AI from "../AI/genAI-1.0.mjs";
import { runTool, listTools, listToolsWithSignatures, listModels, getModelSchema, getToolSchema } from "../tools/index.js"; // added model helpers


const ai = new AI({
  apiKey: process.env.GROQ_API_KEY,
});

const MAX_STEPS = 6;
import { loadMemory, saveMemory } from "../memory/memoryService.js";

export const runAgent = async ({ userInput, context, sessionId, employeeId }) => {
  let step = 0;

  const memoryMessages = await loadMemory(sessionId);

const systemInstruction = `
You are an autonomous HR Workforce Agent named Aurion.
Use conversation history for context.
Available tools with signatures:
${listToolsWithSignatures().join("\n")}

Available Data Models:
${listModels().join(", ")}

There are helper tools you can invoke to understand other tools or models:
  • getToolSchema(toolName) – returns parameter list and usage notes for a tool
  • getModelSchema(modelName) – returns fields and structure for a data model

STRICT RULES:
1. Respond ONLY in JSON format.
2. If something is asked use tools to fetch data from the system. Do not make up data.
3. To use a tool, return: {"action": "toolName", "parameters": {...}}
4. To finish, return: {"action": "respond", "message": "human-like response"}
5. Do not include any text, greetings, or explanations outside the JSON.
6. If you need any information to use a tool give action respond and ask your needs in message.
7. If the provided data is not sufficient or you are unsure about how to proceed, ask for clarification or more information instead of making assumptions.
8. For database create, update and delete events ask the user first before performing the action. Always wait for user confirmation before making changes to the database.
10. If you are unsure about the user's request, ask clarifying questions instead of making assumptions.
11. Information is not complete return response with action respond and ask user for more information. Do not make assumptions. Always ask for more information if you are not sure about the user's request or if the information provided is incomplete.
12. Answer for follow ups if required.
`;

let messages = [
  { role: "system", content: systemInstruction },
  ...memoryMessages,
  { role: "user", content: `Context: ${JSON.stringify(context)}\nRequest: ${userInput}` }
];

  while (step < MAX_STEPS) {
    step++;
    const raw = await ai.ask(messages, "json");

    let parsed;
    try {
      // If 'raw' is already an object, just use it. 
      // If it's a string, clean and parse it.
      if (typeof raw === "object" && raw !== null) {
        parsed = raw;
      } else {
        parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      }
    } catch (e) {
      console.error("Parse Error context:", raw);
      throw new Error("Invalid JSON from AI");
    }

    console.log("Step:", step);
    console.log("AI Output:", parsed);
    if (parsed.action === "respond") {
      await saveMemory(sessionId, 'EMP002', [
        { role: "user", content: userInput },
        { role: "assistant", content: parsed.message }
    ]);
      return parsed.message;
    }

    if (!parsed.action) {
      throw new Error("Agent did not provide action");
    }

    let actionName = parsed.action;

// Handle AI returning wrapped format
if (parsed.parameters?.tool) {
  parsed.parameters = parsed.parameters.params || {};
}

if (!listTools().includes(actionName)) {
  throw new Error("Tool not found: " + actionName);
}

const result = await runTool(
  actionName,
  parsed.parameters || {}
);

    messages.push({
      role: "assistant",
      content: JSON.stringify(parsed)
    });

    messages.push({
      role: "system",
      content: `Tool result: ${JSON.stringify(result)}`
    });
  }
// If it loops too many times:
  const escalationMessage = "Escalated to human HR due to complexity.";
  await saveMemory(sessionId, employeeId, [
    { role: "user", content: userInput },
    { role: "assistant", content: escalationMessage }
  ]);
  return escalationMessage;
  return "Escalated to human HR due to complexity.";
};