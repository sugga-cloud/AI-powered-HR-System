import axios from "axios";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import AI from "../AI/genAI-1.0.mjs";
import dotenv from "dotenv";
dotenv.config();

const ai = new AI({
  apiKey: process.env.OPEN_ROUTER_API || "test_key",
});

/**
 * Generate or refine a structured JD JSON from user prompt.
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

    if (previousResponse) {
      messages.push({
        role: "assistant",
        content: `Here is the previously generated JD JSON:\n${JSON.stringify(previousResponse)} update information here`,
      });
    }

    messages.push({ role: "user", content: prompt });

    const aiResponse = await ai.ask(messages, "json");
    const jdJSON = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;

    return jdJSON;
  } catch (err) {
    console.error("Error generating AI JD:", err);
    throw new Error("AI JD generation failed");
  }
}

/**
 * Generate or refine a structured test JSON.
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

    if (previousResponse) {
      messages.push({
        role: "assistant",
        content: `Here is the previously generated test JSON:\n${JSON.stringify(previousResponse)}\nPlease refine or extend it based on new requirements.`,
      });
    }

    messages.push({ role: "user", content: prompt });

    const aiResponse = await ai.ask(messages, "json");
    let testJSON = typeof aiResponse === "string" ? aiResponse.trim() : aiResponse;

    if (typeof testJSON === "string") {
      if (testJSON.startsWith("```")) {
        testJSON = testJSON.replace(/```(json)?/g, "").trim();
      }
      testJSON = JSON.parse(testJSON);
    }

    return testJSON;
  } catch (err) {
    console.error("Error generating AI Test:", err);
    throw new Error("AI Test generation failed");
  }
}

/**
 * Evaluate and shortlist candidates for a given JD using AI
 */

function withTimeout(promise, ms, msg = "Operation timed out") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms))
  ]);
}

export async function shortListedCandidatesForJD(candidates, job) {
  if (!Array.isArray(candidates) || candidates.length === 0)
    throw new Error("Candidates list is empty or invalid.");
  if (!job) throw new Error("Job data is missing.");

  console.log("🚀 Starting AI evaluation for candidates...");
  const results = [];

  for (const candidate of candidates) {
    try {
      const messages = [
        {
          role: "system",
          content: `
You are an expert AI recruiter.
Analyze candidates objectively based on their skills, experience, and suitability for the given job description.
Return output **strictly as VALID JSON ONLY** (no markdown, no explanations, no code fences, no extra text).
The JSON must exactly match this format:
{
  "score": 0-100,
  "confidence": 0-1,
  "recommendation": "Strong fit | Average fit | Weak fit | Not suitable",
  "reasoning": "short explanation",
  "status": "shortlisted | rejected"
}`,
        },
        {
          role: "user",
          content: `Candidate details: ${JSON.stringify(candidate)}
Job description: ${JSON.stringify(job)}
Now respond strictly in JSON.`,
        },
      ];

      // 🧠 Ask AI (with timeout)
      const aiResponse = await withTimeout(
        ai.ask(messages, "json"),
        30000,
        "AI evaluation timeout"
      );

      // 🧹 Sanitize response
      let cleanResponse = typeof aiResponse === "string"
        ? aiResponse
        : JSON.stringify(aiResponse);

      cleanResponse = cleanResponse
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      // Ensure the response starts and ends with braces
      const jsonStart = cleanResponse.indexOf("{");
      const jsonEnd = cleanResponse.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) {
        console.warn("⚠️ AI did not return valid JSON format for:", candidate.name);
        throw new Error("AI response missing valid JSON structure.");
      }

      const jsonString = cleanResponse.slice(jsonStart, jsonEnd + 1);

      // ✅ Parse safely
      let evaluation;
      try {
        evaluation = JSON.parse(jsonString);
      } catch (err) {
        console.error("❌ JSON parse error for candidate:", candidate.name, err.message);
        evaluation = {
          score: 0,
          confidence: 0,
          recommendation: "Not suitable",
          reasoning: "AI response could not be parsed.",
          status: "rejected",
        };
      }

      console.log(`✅ AI evaluation for ${candidate.name}: ${evaluation.status}`);

      // Build result entry
      results.push({
        candidateId: candidate._id,
        jobId: job._id,
        shortlistedAt: new Date(),
        status: evaluation.status || "rejected",
        loginId: candidate.email || null,
        password: candidate.password || null,
        aiEvaluation: {
          score: evaluation.score || 0,
          confidence: evaluation.confidence || 0,
          reasoning: evaluation.reasoning || "No reasoning provided.",
          recommendation: evaluation.recommendation || "Unknown",
          evaluatedAt: new Date(),
        },
      });
    } catch (err) {
      console.error(`❌ Error evaluating candidate ${candidate.name}:`, err.message);
      results.push({
        candidateId: candidate._id,
        jobId: job._id,
        shortlistedAt: new Date(),
        status: "rejected",
        loginId: candidate.email || null,
        password: candidate.password || null,
        aiEvaluation: {
          score: 0,
          confidence: 0,
          reasoning: "AI evaluation failed: " + err.message,
          recommendation: "Unknown",
          evaluatedAt: new Date(),
        },
      });
    }
  }

  console.log("🏁 Candidate evaluation completed.");
  return results;
}

/**
 * Extracts candidate details from resume using AI
 */
import pdfParse from "pdf-parse-fixed";

export async function getCandidateDetailsFromResume(jdId, resumeUrl) {
  try {
    console.log("🔍 Starting resume parsing for:", resumeUrl);

    // 1️⃣ Download resume
    const response = await axios.get(resumeUrl, { responseType: "arraybuffer" });
    const pdfBuffer = Buffer.from(response.data);

    // 2️⃣ Parse PDF text
    const data = await pdfParse(pdfBuffer);
    const resumeText = data.text?.trim() || "";
    if (!resumeText) throw new Error("Empty or invalid PDF content: " + resumeUrl);

    // 3️⃣ Strict JSON-only prompt for AI
    const prompt = `
You are a professional resume parser AI.

Extract all relevant information from the given resume text.
Also handle the data types according to following schema:
{
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String },
        skills: { type: [String] },
        summary: { type: String },
        experience: [
            {
                company: { type: String },
                role: { type: String },
                duration: { type: String },
                description: { type: String },
            },
        ],
            education: [
            {
                institution: { type: String },
                degree: { type: String },
                fieldOfStudy: { type: String },
                startDate: { type: Date },
                endDate: { type: Date },
            },
        ],
        projects: [
            {
                name: { type: String },
                description: { type: String },
                technologies: { type: [String] },
                link: { type: String },
            },
        ],
        interests: { type: [String] },
        
    }
.
Return output STRICTLY in **valid JSON format**.
Do NOT include explanations, markdown formatting, backticks, or any text outside the JSON also for key and values use appropriate quotes so that json would be perfect.

Here is the exact JSON structure to follow:

{
  "name": "",
  "email": "",
  "phone": "",
  "resume": "",
  "skills": [],
  "summary": "",
  "experience": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "fieldOfStudy": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "projects": [],
  "interests": [],
  "job_id": ""
}

Resume text:
${resumeText}
`;

    // 4️⃣ Get AI response
    const aiResponse = await ai.ask([{ role: "user", content: prompt }], "json");

    // 5️⃣ Sanitize AI response
    let cleanResponse = aiResponse;
    if (typeof aiResponse !== "string") cleanResponse = JSON.stringify(aiResponse);

    // Remove potential code fences or extra text
    cleanResponse = cleanResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1") // extract JSON body
      .trim();

    // 6️⃣ Validate JSON parsing
    let candidateData;
    try {
      candidateData = JSON.parse(cleanResponse);
    } catch (parseErr) {
      console.error("❌ JSON parse error:", parseErr.message);
      console.log("🔍 Raw AI output:", cleanResponse);
      throw new Error("AI returned invalid JSON. Please check the output.");
    }

    // 7️⃣ Add metadata
    candidateData.job_id = jdId;
    candidateData.resume = resumeUrl;

    console.log("✅ Resume parsed successfully for JD:", jdId);
    return candidateData;

  } catch (error) {
    console.error("❌ Error in getCandidateDetailsFromResume:", error.message);
    throw error;
  }
}
