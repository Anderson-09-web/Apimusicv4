/**
 * API key authentication middleware.
 * Validates the X-API-Key header using HMAC-signed key verification.
 */
import type { Request, Response, NextFunction } from "express";
import { verifyApiKey } from "../lib/apiKeys.js";
import { UnauthorizedError } from "../lib/errors.js";

export function requireApiKey(req: Request, _res: Response, next: NextFunction): void {
  const key = req.headers["x-api-key"];

  if (!key || typeof key !== "string") {
    next(new UnauthorizedError("Missing X-API-Key header"));
    return;
  }

  const result = verifyApiKey(key);
  if (!result.valid) {
    next(new UnauthorizedError(result.reason ?? "Invalid API key"));
    return;
  }

  next();
}
