const { checkParserHealth } = require("../services/parserService");

/**
 * GET /api/health
 * Liveness probe used by clients and orchestrators. Always returns 200 for the
 * backend itself; includes parser status when available without failing when
 * the parser is still waking up (Render free-tier cold start).
 */
async function getHealth(req, res) {
  const parser = await checkParserHealth();
  res.status(200).json({ status: "ok", parser });
}

module.exports = { getHealth };
