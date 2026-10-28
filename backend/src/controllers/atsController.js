const ApiError = require("../middleware/ApiError");
const { analyzeResume } = require("../services/atsService");
const {
  auditResumeFormatting,
  multiMatchJobs,
  getSampleData,
  evaluateAtsRuleChecklist,
  getRecommendedJobsData,
} = require("../services/aiIntelligenceService");
const db = require("../database/db");

/**
 * POST /api/ats/analyze
 * Body: { resume: <parsed resume JSON>, jobDescription: <string>, fileName: <string> }
 */
function analyze(req, res, next) {
  try {
    const { resume, jobDescription, fileName } = req.body || {};

    if (!resume || typeof resume !== "object" || Array.isArray(resume)) {
      throw new ApiError(400, "A parsed 'resume' object is required.");
    }
    if (typeof jobDescription !== "string" || !jobDescription.trim()) {
      throw new ApiError(400, "A non-empty 'jobDescription' string is required.");
    }

    const result = analyzeResume(resume, jobDescription);

    // Save into embedded database
    const saved = db.analyses.insert({
      userId: req.user?.id || null,
      filename: fileName || "Resume",
      candidateName: resume?.contact?.name || "Candidate",
      jobDescription,
      atsScore: result.atsScore,
      skillMatch: result.skillMatch,
      completeness: result.resumeCompleteness,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      suggestions: result.suggestions,
      resume,
    });

    res.status(200).json({
      success: true,
      analysisId: saved.id,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ats/audit
 * Body: { resume }
 * Runs formatting, red-flags, action-verb power, and metrics audits.
 */
function audit(req, res, next) {
  try {
    const { resume } = req.body || {};
    if (!resume || typeof resume !== "object") {
      throw new ApiError(400, "A parsed 'resume' object is required.");
    }

    const auditResult = auditResumeFormatting({ resume });
    res.status(200).json(auditResult);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ats/rule-checklist
 * Body: { resume, jobDescription }
 * Runs 10-point rule evaluation with interactive auto-fixes.
 */
function ruleChecklist(req, res, next) {
  try {
    let { resume, resumeText, jobDescription } = req.body || {};
    if (!resume && resumeText) {
      resume = { rawText: resumeText };
    } else if (typeof resume === "string") {
      resume = { rawText: resume };
    }
    if (!resume || typeof resume !== "object") {
      throw new ApiError(400, "A parsed 'resume' object or 'resumeText' is required.");
    }

    const result = evaluateAtsRuleChecklist({ resume, jobDescription });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}


/**
 * POST /api/ats/multi-match
 * Body: { resume, jobDescriptions: [...] }
 */
function multiMatch(req, res, next) {
  try {
    const { resume, jobDescriptions } = req.body || {};
    if (!resume || typeof resume !== "object") {
      throw new ApiError(400, "A parsed 'resume' object is required.");
    }
    if (!Array.isArray(jobDescriptions) || jobDescriptions.length === 0) {
      throw new ApiError(400, "An array of 'jobDescriptions' is required.");
    }

    const report = multiMatchJobs({ resume, jobDescriptions });
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ats/samples
 * Returns pre-built sample resumes and job descriptions for 1-click testing.
 */
function samples(req, res, next) {
  try {
    const data = getSampleData();
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ats/recommended-jobs
 * POST /api/ats/recommended-jobs
 * Body: { resume }
 * Returns smart matched job opportunities with live ATS score calculation.
 */
function recommendedJobs(req, res, next) {
  try {
    const resume = req.body?.resume || req.query?.resume;
    const result = getRecommendedJobsData({ resume });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  analyze,
  audit,
  ruleChecklist,
  multiMatch,
  samples,
  recommendedJobs,
};
