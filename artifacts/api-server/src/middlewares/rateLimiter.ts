/**
 * Rate limiting middleware using express-rate-limit.
 * Limits requests per IP window to prevent abuse.
 */
import { rateLimit } from "express-rate-limit";
import { config } from "../config.js";

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Rate limit exceeded. Please slow down your requests.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  skip: (req) => req.path === "/api/healthz",
});
