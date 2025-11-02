import axios from "axios";
import pdfParse from "pdf-parse";
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

export async function shortListedCandidatesForJD(candidates, job) {
  // Validate input
  if (!Array.isArray(candidates) || candidates.length === 0)
    throw new Error("Candidates list is empty or invalid.");
  if (!job) throw new Error("Job data is missing.");

  // Loop through all candidates and evaluate with AI
  const results = [];

  for (const candidate of candidates) {
    const messages = [
      {
        role: "system",
        content:
          "You are an expert AI recruiter. Analyze candidates objectively based on their skills, experience, and suitability for the given job description. Respond in JSON format only. without any commas or inverted commas. your response should start with '{' and end with '}'",
      },
      {
        role: "user",
        content: `Candidate details: ${JSON.stringify(candidate)} \n\nJob description: ${JSON.stringify(
          job
        )} \n\nEvaluate the candidate and return JSON in the format:
        {
          "score": 0-100,
          "confidence": 0-1,
          "recommendation": "Strong fit | Average fit | Weak fit | Not suitable",
          "reasoning": "short explanation",
          "status": "shortlisted | rejected"
        }`,
      },
    ];

    // Call your AI model
    const aiResponse = await ai.ask(messages, "json");

    let evaluation;
    try {
      evaluation =
        typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
    } catch (err) {
      console.error("Invalid AI JSON response for candidate:", candidate.name);
      evaluation = {
        score: 0,
        confidence: 0,
        recommendation: "Not suitable",
        reasoning: "AI response could not be parsed.",
        status: "rejected",
      };
    }

    // Push result in ShortlistedCandidate-compatible format
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
  }

  return results;
}

// it extracts candidate details from the resume and store them in candidate model
export async function getCandidateDetailsFromResume(jdId, resumeUrl) {
  try {
    // 1️⃣ Download resume PDF
    const response = await axios.get(resumeUrl, { responseType: "arraybuffer" });
    const pdfBuffer = Buffer.from(response.data, "utf-8");

    // 2️⃣ Extract text from resume
    const pdfData = await pdfParse(pdfBuffer);
    const resumeText = pdfData.text;

    // 3️⃣ Prepare structured extraction prompt
    const prompt = `
You are an expert resume parser. 
Extract information from the given resume text and return it strictly in JSON format without any comma,inverted comma or quotes, matching the following structure:

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
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "link": ""
    }
  ],
  "interests": [],
  "job_id": ""
}

Make sure:
- All keys are always present.
- Dates are ISO strings if available.
- Use an empty array or empty string where information is missing.

Resume text:
${resumeText}
    `;

    // 4️⃣ Ask AI for structured output
    const aiResponse = await ai.ask([{ role: "user", content: prompt }], "json");

    // 5️⃣ Parse JSON safely
    let candidateData;
    try {
      candidateData = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
    } catch (error) {
      console.error("❌ Failed to parse AI JSON:", aiResponse);
      throw new Error("AI returned invalid JSON format");
    }

    // 6️⃣ Add job_id and resume URL
    candidateData.job_id = jdId;
    candidateData.resume = resumeUrl;

    // 7️⃣ Return structured data ready for mongoose save
    return candidateData;
  } catch (error) {
    console.error("Error in getCandidateDetailsFromResume:", error.message);
    throw error;
  }
}
