const { waitForParserAwake } = require("../services/parserService");

// Ensures only one background wake loop runs at a time (repeated warmup pings
// from the frontend won't stack up concurrent health polls / trip Render 429).
let warmingUp = false;

/**
 * GET /api/warmup
 * Returns immediately so the frontend is never blocked, then keeps pinging the
 * parser's /health in the background until it reports healthy (or the wake
 * budget is exhausted). This gives the parser a head start on Render's cold
 * boot while the user is still choosing / uploading their file, so the actual
 * /parse request lands on an already-awake service.
 */
function warmUp(req, res) {
  res.status(200).json({ status: "ok" });

  if (warmingUp) return;
  warmingUp = true;

  waitForParserAwake()
    .catch((err) => {
      console.warn("[warmup] Background parser wake failed:", err.message || err);
    })
    .finally(() => {
      warmingUp = false;
    });
}

module.exports = { warmUp };
