import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { rateLimiter } from "./middlewares/rateLimiter.js";

const app: Express = express();

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
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

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered AFTER routes
app.use(errorHandler);

export default app;
