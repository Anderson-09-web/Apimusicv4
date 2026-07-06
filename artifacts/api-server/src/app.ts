import path from "node:path";
import { existsSync } from "node:fs";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { rateLimiter } from "./middlewares/rateLimiter.js";
import { config } from "./config.js";

const app: Express = express();

// Trust reverse-proxy headers (required for accurate IP-based rate limiting on Render)
app.set("trust proxy", 1);

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    // Never log the API key, even in development
    redact: ["req.headers['x-api-key']"],
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(rateLimiter);

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Static Documentation (production) ───────────────────────────────────────
// In production, the built docs are served from the same process as the API.
// Priority: STATIC_DIR env var → conventional path from project root.
const docsDir =
  process.env["STATIC_DIR"] ??
  path.resolve(process.cwd(), "artifacts/music-api-docs/dist/public");

if (config.nodeEnv === "production" && existsSync(docsDir)) {
  logger.info({ docsDir }, "Serving static documentation");
  app.use(express.static(docsDir));

  // SPA fallback — serve index.html for any non-API route not matched by a static file
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next(); // Let API 404s fall through to error handler
    }
    res.sendFile(path.join(docsDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered AFTER all routes and middleware
app.use(errorHandler);

export default app;
