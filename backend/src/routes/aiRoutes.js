const express = require("express");
const {
  status,
  analyze,
  chat,
  improveBullet,
  handleTailorResume,
  handleCoverLetter,
  handleInterviewPrep,
  handleGradeAnswer,
  handleSalaryEstimate,
  handleNegotiationCoach,
  listTailoredResumes,
  listCoverLetters,
  handleCompareCandidates,
  handleOutreachPitch,
  handleLearningRoadmap,
  handleLinkedInProfile,
  handlePowerBullet,
  handleSkillsQuiz,
  handleFollowUpQuestion,
  handleCareerTrajectory,
  handleStarStories,
  handleDebiasAudit,
  handleExecutiveBio,
  handleInterviewSprint,
  handleLocalizeResume,
  handlePortfolio,
  handleResumeDiff,
} = require("../controllers/aiController");

const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/ai/status
router.get("/status", status);

// GET /api/ai/models (alias to status for model selector)
router.get("/models", status);

// POST /api/ai/analyze
router.post("/analyze", optionalAuth, analyze);

// POST /api/ai/chat
router.post("/chat", optionalAuth, chat);

// POST /api/ai/improve-bullet
router.post("/improve-bullet", optionalAuth, improveBullet);

// POST /api/ai/tailor-resume
router.post("/tailor-resume", optionalAuth, handleTailorResume);

// POST /api/ai/cover-letter
router.post("/cover-letter", optionalAuth, handleCoverLetter);

// POST /api/ai/interview-prep
router.post("/interview-prep", optionalAuth, handleInterviewPrep);

// POST /api/ai/grade-answer
router.post("/grade-answer", optionalAuth, handleGradeAnswer);

// POST /api/ai/follow-up-question
router.post("/follow-up-question", optionalAuth, handleFollowUpQuestion);

// POST /api/ai/salary-estimate
router.post("/salary-estimate", optionalAuth, handleSalaryEstimate);

// POST /api/ai/negotiation-coach
router.post("/negotiation-coach", optionalAuth, handleNegotiationCoach);

// POST /api/ai/compare-candidates
router.post("/compare-candidates", optionalAuth, handleCompareCandidates);

// POST /api/ai/outreach-pitch
router.post("/outreach-pitch", optionalAuth, handleOutreachPitch);

// POST /api/ai/learning-roadmap
router.post("/learning-roadmap", optionalAuth, handleLearningRoadmap);

// POST /api/ai/linkedin-optimize
router.post("/linkedin-optimize", optionalAuth, handleLinkedInProfile);

// POST /api/ai/power-bullet
router.post("/power-bullet", optionalAuth, handlePowerBullet);

// POST /api/ai/skills-quiz
router.post("/skills-quiz", optionalAuth, handleSkillsQuiz);

// POST /api/ai/career-trajectory
router.post("/career-trajectory", optionalAuth, handleCareerTrajectory);

// POST /api/ai/star-stories
router.post("/star-stories", optionalAuth, handleStarStories);

// POST /api/ai/debias-audit
router.post("/debias-audit", optionalAuth, handleDebiasAudit);

// POST /api/ai/executive-bio
router.post("/executive-bio", optionalAuth, handleExecutiveBio);

// POST /api/ai/interview-sprint
router.post("/interview-sprint", optionalAuth, handleInterviewSprint);

// POST /api/ai/localize-resume
router.post("/localize-resume", optionalAuth, handleLocalizeResume);

// POST & GET /api/ai/portfolio
router.post("/portfolio", optionalAuth, handlePortfolio);
router.get("/portfolio", optionalAuth, handlePortfolio);

// POST /api/ai/resume-diff
router.post("/resume-diff", optionalAuth, handleResumeDiff);

// GET /api/ai/tailored
router.get("/tailored", optionalAuth, listTailoredResumes);

// GET /api/ai/cover-letters
router.get("/cover-letters", optionalAuth, listCoverLetters);

module.exports = router;

