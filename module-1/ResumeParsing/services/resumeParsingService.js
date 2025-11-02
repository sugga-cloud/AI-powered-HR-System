// services/resumeParsingService.js
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/* ---------- tweak these keyword lists as needed ---------- */
const SKILL_KEYWORDS = [
  "javascript","java","python","react","node","c++","c#","sql","html","css",
  "excel","communication","management","leadership","firebase",
  "aws","docker","kubernetes","machine learning","ml","data analysis","tensorflow",
  "pandas","numpy","mongodb","postgres","mysql","git","github"
];

const EDUCATION_KEYWORDS = [
  "btech","b.tech","bachelor","bachelor of","bsc","b.sc","msc","m.sc","ba","ma",
  "mtech","m.tech","phd","diploma","bachelor's","master's"
];

/* ---------- main exported parser ---------- */
export async function parseResumeBuffer(file) {
  try {
    if (!file || !file.mimetype) {
      console.log("❌ parseResumeBuffer: invalid file");
      return { error: "Invalid file" };
    }

    let text = "";

    // PDF extraction (pdfjs-dist) — requires Uint8Array
    if (file.mimetype === "application/pdf") {
      try {
        const uint8 = new Uint8Array(file.buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8 });
        const pdf = await loadingTask.promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((it) => it.str).join(" ") + "\n";
        }
        text = fullText;
      } catch (err) {
        console.log("❌ PDF extraction failed:", err);
        // fallthrough: return error below
      }
    }

    // DOCX extraction (mammoth)
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname?.toLowerCase().endsWith(".docx")
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value || "";
      } catch (err) {
        console.log("❌ DOCX extraction failed:", err);
      }
    }

    if (!text || text.trim().length < 10) {
      console.log("❌ No text found (maybe a scanned image PDF). Mimetype:", file.mimetype);
      return { error: "Unable to extract text", rawText: "" };
    }

    // Normalize text for extraction
    const rawText = text;
    const lower = rawText.toLowerCase();

    const parsed = {
      name: extractName(rawText),
      email: extractEmail(rawText),
      phone: extractPhone(rawText),
      skills: extractSkills(lower),
      experience: extractExperience(lower),
      projects: extractProjects(lower),
      educationLevel: extractEducation(lower),
      atsScore: calculateATSScore(lower),
      rawText,
    };

    console.log("✅ Parsed resume:", {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      skillsCount: parsed.skills.length,
      experience: parsed.experience,
      projects: parsed.projects,
      education: parsed.educationLevel,
      atsScore: parsed.atsScore,
    });

    return parsed;
  } catch (err) {
    console.log("❌ Parsing error:", err);
    return { error: "Failed to parse", rawText: "" };
  }
}

/* =========== helper functions =========== */

function extractEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : "";
}

function extractPhone(text) {
  // common phone patterns — tweak if you need stricter validation
  const m = text.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?[\d\-.\s]{6,14}\d/);
  return m ? m[0].replace(/\s{2,}/g, " ").trim() : "";
}

function extractName(text) {
  // strategy: look at first 10 non-empty lines, choose the first line with 2-4 words and no digits,
  // otherwise fall back to the first non-empty line.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    if (line && !/\d/.test(line)) {
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 5 && words.some(w => /[A-Za-z]/.test(w))) {
        // Simple cleanup: remove title words like "resume", "curriculum"
        if (!/resume|curriculum|cv/i.test(line)) return line;
      }
    }
  }
  return lines[0] || "";
}

function extractSkills(lowerText) {
  const found = new Set();
  for (const s of SKILL_KEYWORDS) {
    if (lowerText.includes(s)) found.add(s);
  }
  return Array.from(found);
}

function extractExperience(lowerText) {
  // catches "3 years", "2 yrs", "5+ years", "3 year"
  const m = lowerText.match(/(\d{1,2})\s*(\+)?\s*(years|year|yrs|yr)/i);
  if (m) return parseInt(m[1], 10);
  // fallback: find "experience: X years" pattern
  const m2 = lowerText.match(/experience[:\s]*([0-9]{1,2})\s*(years|year|yrs|yr)/i);
  if (m2) return parseInt(m2[1], 10);
  return 0;
}

function extractProjects(lowerText) {
  // try "projects: 3" or "project(s) 4"
  const m = lowerText.match(/projects?:?\s*([0-9]{1,2})/i);
  return m ? parseInt(m[1], 10) : 0;
}

function extractEducation(lowerText) {
  for (const edu of EDUCATION_KEYWORDS) {
    if (lowerText.includes(edu)) return edu.toUpperCase();
  }
  return "UNKNOWN";
}

function calculateATSScore(lowerText) {
  const skills = extractSkills(lowerText);
  const skillScore = skills.length * 6;            // 6 points per matched keyword
  const exp = extractExperience(lowerText) * 2;    // 2 points per year
  const proj = extractProjects(lowerText) * 3;     // 3 points per project
  return skillScore + exp + proj;
}
