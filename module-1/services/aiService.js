import AI from "../AI/genAI-1.0.mjs";
import dotenv from "dotenv";
dotenv.config();

const ai = new AI({
  apiKey: process.env.OPEN_ROUTER_API || "test_key",
});

/**
 * Generate or refine a structured JD JSON from user prompt.
 * If previousResponse is provided, it is used as context for refinement.
 */
export async function generateAIJD(prompt, previousResponse = null) {
  try {
    const messages = [
      {
        role: "system",
        content: `You are an expert HR assistant.
You generate or refine Job Descriptions in strict JSON format.
Always return ONLY a valid JSON object.
Never include quotes (\`,\`\`\`), extra space, explanations or plain text.
The JSON structure must be:

{
  "jobTitle": "string",
  "company": "string",
  "location": "string",
  "employmentType": "string",
  "skills": ["string"],
  "experience": "string",
  "salaryRange": "string",
  "aiMetadata": {
    "shortSummary": "string",
    "highlights": ["string"],
    "hashtags": ["string"]
  }
}`,
      },
    ];

    // Include previous AI response as context if available
    if (previousResponse) {
      messages.push({
        role: "assistant",
        content: `Here is the previously generated JD JSON:\n${JSON.stringify(previousResponse)} update information here`,
      });
    }

    // Add the user's new instruction
    messages.push({
      role: "user",
      content: prompt,
    });

    const aiResponse = await ai.ask(messages, "json");

    // Ensure it's valid JSON
    let jdJSON;
    if (typeof aiResponse === "string") {
      jdJSON = JSON.parse(aiResponse);
    } else {
      jdJSON = aiResponse;
    }

    return jdJSON;
  } catch (err) {
    console.error("Error generating AI JD:", err);
    throw new Error("AI JD generation failed");
  }
}

/**
 * Generate or refine a structured test JSON based on job role, skills, and difficulty level.
 * If previousResponse is provided, it’s used to refine or expand the test.
 */
export async function generateAITest(prompt, previousResponse = null) {
  try {
    const messages = [
      {
        role: "system",
        content: `You are an expert AI Test Generator for HR systems.
You create structured assessment tests (MCQs, coding, aptitude, or communication).
Always return ONLY a valid JSON object (no markdown, no quotes, no explanations).

The JSON must strictly follow this structure:
{
  "testTitle": "string",
  "testType": "MCQ" | "Coding" | "Aptitude" | "Communication" | "Custom",
  "durationMinutes": number,
  "totalMarks": number,
  "questions": [
    {
      "question_id": "string",
      "question_text": "string",
      "options": ["string", "string", "string", "string"],
      "correct_answer": "string",
      "marks": number
    }
  ],
  "aiMetadata": {
    "difficulty": "Easy" | "Medium" | "Hard",
    "topicCoverage": ["string"],
    "generationNotes": "string"
  }
}`,
      },
    ];

    // If previous test exists, include it as refinement context
    if (previousResponse) {
      messages.push({
        role: "assistant",
        content: `Here is the previously generated test JSON:\n${JSON.stringify(
          previousResponse
        )}\nPlease refine or extend it based on new requirements.`,
      });
    }

    // Add the user’s new request/prompt
    messages.push({
      role: "user",
      content: prompt,
    });

    const aiResponse = await ai.ask(messages, "json");

    // Parse to valid JSON safely
    let testJSON;
    if (typeof aiResponse === "string") {
      testJSON = JSON.parse(aiResponse);
    } else {
      testJSON = aiResponse;
    }

    return testJSON;
  } catch (err) {
    console.error("Error generating AI Test:", err);
    throw new Error("AI Test generation failed");
  }
}