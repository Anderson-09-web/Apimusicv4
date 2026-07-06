/**
 * API key management endpoints.
 *
 * POST /api/keys/generate — generate a new 7-day API key
 */
import crypto from "node:crypto";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { generateApiKey } from "../lib/apiKeys.js";
import { config } from "../config.js";
import { BadRequestError, UnauthorizedError } from "../lib/errors.js";

const router = Router();

// Strict rate limiter for key generation — prevents password brute-force
const keyGenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many key generation attempts. Try again in 15 minutes.",
    code: "RATE_LIMIT_EXCEEDED",
    details: null,
  },
});

router.post("/keys/generate", keyGenLimiter, (req, res, next) => {
  try {
    const body = req.body as { password?: unknown };

    if (!body.password || typeof body.password !== "string") {
      throw new BadRequestError("password is required");
    }

    // HMAC-based comparison avoids length-leaking branch before timingSafeEqual
    // (comparing HMACs normalizes output length and is constant-time)
    const hashSupplied = crypto
      .createHmac("sha256", config.apiKeySecret)
      .update(body.password.trim())
      .digest();
    const hashExpected = crypto
      .createHmac("sha256", config.apiKeySecret)
      .update(config.adminPassword)
      .digest();
    const match = crypto.timingSafeEqual(hashSupplied, hashExpected);

    if (!match) {
      throw new UnauthorizedError("Incorrect password");
    }

    const { key, expiresAt } = generateApiKey();

    res.status(201).json({
      key,
      expiresAt: expiresAt.toISOString(),
      expiresIn: "7 days",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
