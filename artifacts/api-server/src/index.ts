import app from "./app.js";
import { logger } from "./lib/logger.js";
import { lavalinkClient } from "./lib/lavalink.js";
import { validateConfig, config } from "./config.js";

// Validate config at startup (throws in production if required vars are missing)
validateConfig();

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

// ─── Connect to Lavalink ──────────────────────────────────────────────────────

lavalinkClient.on("ready", (sessionId, resumed) => {
  logger.info({ sessionId, resumed }, "Lavalink session ready");
});
lavalinkClient.on("reconnecting", (attempt) => {
  logger.warn({ attempt }, "Reconnecting to Lavalink...");
});
lavalinkClient.on("disconnected", (code, reason) => {
  logger.warn({ code, reason }, "Lavalink disconnected");
});
lavalinkClient.on("stats", (stats) => {
  logger.debug(
    {
      players: stats.players,
      playingPlayers: stats.playingPlayers,
      memUsedMb: Math.round(stats.memory.used / 1024 / 1024),
    },
    "Lavalink stats",
  );
});

// Connect to Lavalink — non-blocking, API starts serving immediately
lavalinkClient.connect();

// ─── Start HTTP Server ────────────────────────────────────────────────────────

const server = app.listen(port, (err) => {
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
    lavalinkClient.destroy();
    process.exit(0);
  });
  // Force exit if drain takes too long
  setTimeout(() => {
    logger.warn("Graceful shutdown timeout — forcing exit");
    lavalinkClient.destroy();
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
