const axios = require("axios");

/**
 * Ollama AI Service for AI-Resume-Analyzer.
 * Connects directly to local Ollama instance (default: http://127.0.0.1:11434).
 * Auto-detects models, supports Qwen 3, Llama 3, Mistral, and other models.
 */

const OLLAMA_HOST = (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/+$/, "");
const PREFERRED_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:0.5b";

/**
 * Checks connectivity to the local Ollama instance and lists installed models.
 */
async function getOllamaStatus() {
  const start = Date.now();
  try {
    const res = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 3500 });
    const models = (res.data?.models || []).map((m) => ({
      name: m.name,
      size: m.size ? `${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB` : "Unknown",
      modifiedAt: m.modified_at,
      family: m.details?.family || "unknown",
      isFast: m.name.includes("0.5b") || m.name.includes("1b") || m.name.includes("1.5b") || m.name.includes("3b"),
    }));

    // Find best model: preferred model if available, else first model, else default
    const hasPreferred = models.some((m) => m.name === PREFERRED_MODEL || m.name.startsWith(PREFERRED_MODEL));
    const activeModel = hasPreferred ? PREFERRED_MODEL : (models[0]?.name || PREFERRED_MODEL);

    return {
      connected: true,
      host: OLLAMA_HOST,
      activeModel,
      models,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      connected: false,
      host: OLLAMA_HOST,
      activeModel: PREFERRED_MODEL,
      models: [],
      error: `Could not connect to Ollama at ${OLLAMA_HOST}. Ensure Ollama is running ('ollama serve').`,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Helper to safely extract JSON from Ollama's response.
 */
function extractJsonFromResponse(rawText) {
  if (!rawText || typeof rawText !== "string") return null;

  // If response contains markdown ```json ... ``` blocks
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const textToParse = codeBlockMatch ? codeBlockMatch[1].trim() : rawText.trim();

  // Try direct parse
  try {
    return JSON.parse(textToParse);
  } catch {}

  // Try extracting the first valid { ... } object
  const startIdx = textToParse.indexOf("{");
  const endIdx = textToParse.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      return JSON.parse(textToParse.slice(startIdx, endIdx + 1));
    } catch {}
  }

  return null;
}

/**
 * Runs deep AI ATS & Resume Analysis with Ollama.
 *
 * @param {object} params
 * @param {object} params.resume - Structured resume object
 * @param {string} params.jobDescription - Target Job Description
 * @param {string} [params.model] - Optional model override
 * @returns {Promise<object>} Deep AI Review insights
 */
async function analyzeResumeWithOllama({ resume, jobDescription, model }) {
  const status = await getOllamaStatus();
  if (!status.connected) {
    throw new Error(status.error);
  }

  const selectedModel = model || status.activeModel;

  const candidateName = resume?.contact?.name || "Candidate";
  const skillsList = Array.isArray(resume?.skills) ? resume.skills.join(", ") : "";
  const experienceList = Array.isArray(resume?.experience) ? resume.experience.slice(0, 5).join("\n- ") : "";
  const projectsList = Array.isArray(resume?.projects) ? resume.projects.slice(0, 4).join("\n- ") : "";
  const educationList = Array.isArray(resume?.education) ? resume.education.join("\n- ") : "";

  const prompt = `
You are an expert Technical Recruiter and Applicant Tracking System (ATS) Auditor.
Evaluate the candidate's resume against the target Job Description.

[CANDIDATE RESUME SUMMARY]
Name: ${candidateName}
Skills: ${skillsList}
Experience:
- ${experienceList}
Projects:
- ${projectsList}
Education:
- ${educationList}

[TARGET JOB DESCRIPTION]
${jobDescription.slice(0, 3000)}

Analyze the alignment thoroughly. You must return ONLY a JSON object with this exact structure:
{
  "overallScore": <integer between 0 and 100 representing fit>,
  "verdict": "<Strong Match | Moderate Match | Needs Improvement>",
  "executiveSummary": "<2-3 sentences summarizing candidate's overall fit and readiness>",
  "keyStrengths": [
    "<Highlight concrete strength 1 relevant to job description>",
    "<Highlight concrete strength 2>",
    "<Highlight concrete strength 3>"
  ],
  "criticalGaps": [
    "<Identify specific missing skill or requirement from job description>",
    "<Identify second gap or improvement area>"
  ],
  "bulletOptimizations": [
    {
      "original": "<A weak or generic phrase/bullet from resume or standard experience>",
      "improved": "<Action-oriented rewrite using STAR framework with metrics and impact>",
      "reason": "<Why this improved version scores higher with ATS and hiring managers>"
    },
    {
      "original": "<Another bullet or project description to improve>",
      "improved": "<Action-oriented rewrite using STAR framework with metrics and impact>",
      "reason": "<Reason for improvement>"
    }
  ],
  "highImpactKeywordsToAdd": [
    "<Keyword 1>", "<Keyword 2>", "<Keyword 3>", "<Keyword 4>", "<Keyword 5>"
  ],
  "interviewPreparationQuestions": [
    {
      "question": "<A rigorous technical or situational question likely asked for this role>",
      "suggestedFramework": "<How the candidate should structure their answer using their specific projects>"
    },
    {
      "question": "<Second interview question>",
      "suggestedFramework": "<Guidance for answering>"
    }
  ],
  "tailoringAdvice": "<1-2 sentences on how to tailor the resume for this exact application>"
}
`;

  try {
    const timeoutMs = selectedModel.includes("0.5b") ? 25000 : 50000;
    const res = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: selectedModel,
        prompt: prompt.trim(),
        format: "json",
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: selectedModel.includes("0.5b") ? 800 : 1200,
        },
      },
      { timeout: timeoutMs }
    );

    const parsedJson = extractJsonFromResponse(res.data?.response);
    if (!parsedJson) {
      throw new Error("Could not parse structured JSON from Ollama response.");
    }

    return {
      success: true,
      modelUsed: selectedModel,
      insights: parsedJson,
      thinkingSnippet: res.data?.thinking ? res.data.thinking.slice(0, 150) : null,
    };
  } catch (err) {
    console.error("[ollamaService] Analysis failed:", err.message);
    throw new Error(`Ollama analysis failed: ${err.message}`);
  }
}

/**
 * Interactive Chat with Ollama about the candidate's resume and job target.
 */
async function chatWithOllama({ resume, jobDescription, message, history = [], model }) {
  const status = await getOllamaStatus();
  if (!status.connected) {
    throw new Error(status.error);
  }

  const selectedModel = model || status.activeModel;

  const candidateContext = `Candidate: ${resume?.contact?.name || "Candidate"}. Skills: ${(resume?.skills || []).slice(0, 15).join(", ")}.`;
  const jobContext = jobDescription ? `Target Job: ${jobDescription.slice(0, 500)}` : "No specific job provided.";

  const systemPrompt = `You are ResumeAI, a world-class AI Career Coach & Resume Specialist powered by local Ollama (${selectedModel}).
You provide actionable, direct, and encouraging feedback to help candidates ace interviews and optimize their resumes for ATS and hiring managers.
${candidateContext}
${jobContext}
Keep responses concise, formatted in clean markdown with bullet points when appropriate.`;

  const conversationHistory = history
    .slice(-4)
    .map((h) => `${h.role === "user" ? "User" : "ResumeAI"}: ${h.content}`)
    .join("\n");

  const prompt = `${systemPrompt}\n\n${conversationHistory ? conversationHistory + "\n" : ""}User: ${message}\nResumeAI:`;

  try {
    const res = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: selectedModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.5,
          num_predict: 600,
        },
      },
      { timeout: 30000 }
    );

    return {
      success: true,
      model: selectedModel,
      reply: (res.data?.response || "").trim(),
    };
  } catch (err) {
    throw new Error(`Ollama chat error: ${err.message}`);
  }
}

/**
 * Rewrites a single bullet point into an impactful STAR statement with metrics.
 */
async function improveBulletWithOllama({ bulletText, targetRole, model }) {
  const status = await getOllamaStatus();
  if (!status.connected) {
    throw new Error(status.error);
  }

  const selectedModel = model || status.activeModel;

  const prompt = `Rewrite this resume bullet point into an impactful, metrics-driven statement using the STAR framework (Situation, Task, Action, Result) for a ${targetRole || "software"} role.
Original bullet: "${bulletText}"

Return JSON:
{
  "improved": "<High-impact rewritten bullet starting with strong past-tense action verb and measurable metric>",
  "keyChange": "<Brief note on what was upgraded>"
}`;

  const res = await axios.post(
    `${OLLAMA_HOST}/api/generate`,
    {
      model: selectedModel,
      prompt,
      format: "json",
      stream: false,
      options: { temperature: 0.3, num_predict: 400 },
    },
    { timeout: 25000 }
  );

  const parsed = extractJsonFromResponse(res.data?.response);
  return parsed || { improved: bulletText, keyChange: "Could not enhance" };
}

module.exports = {
  getOllamaStatus,
  analyzeResumeWithOllama,
  chatWithOllama,
  improveBulletWithOllama,
};
