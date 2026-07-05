/**
 * Global error handler middleware.
 * Converts ApiError and unknown errors into a consistent JSON response.
 */
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details ?? null,
    });
    return;
  }

  // Log unexpected errors
  logger.error({ err, method: req.method, url: req.url }, "Unhandled error");

  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    details: null,
  });
}
