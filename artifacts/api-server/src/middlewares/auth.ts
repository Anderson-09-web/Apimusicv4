/**
 * API key authentication middleware.
 * Validates the X-API-Key header against the configured API_KEY.
 */
import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { UnauthorizedError } from "../lib/errors.js";

export function requireApiKey(req: Request, _res: Response, next: NextFunction): void {
  const key = req.headers["x-api-key"];
  if (!key || key !== config.apiKey) {
    next(new UnauthorizedError("Invalid or missing X-API-Key header"));
    return;
  }
  next();
}
