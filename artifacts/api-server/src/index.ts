import app from "./app.js";
import { logger } from "./lib/logger.js";
import { lavalinkPool } from "./lib/lavalinkPool.js";
import { validateConfig, config } from "./config.js";

// Validate config at startup (throws in production if required vars are missing)
validateConfig();

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

// ─── Initialize default Lavalink session ──────────────────────────────────────
// Starts a session for DISCORD_BOT_USER_ID from config and connects immediately.
// Additional sessions are created on demand when requests arrive with different
// X-Bot-User-Id values (one session per Discord bot user ID).
void lavalinkPool.default;

// ─── Start HTTP Server ────────────────────────────────────────────────────────

const server = app.listen(port, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port, nodeEnv: config.nodeEnv }, "Discord Music API server listening");
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down gracefully...");
  server.close(() => {
    logger.info("HTTP server closed — all connections drained");
    lavalinkPool.destroyAll();
    process.exit(0);
  });
  // Force exit if drain takes too long
  setTimeout(() => {
    logger.warn("Graceful shutdown timeout — forcing exit");
    lavalinkPool.destroyAll();
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
