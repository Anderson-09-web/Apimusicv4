/**
 * Bot session middleware.
 *
 * Reads the X-Bot-User-Id header (the caller's Discord bot user ID),
 * validates it, and attaches the matching Lavalink session to the request.
 * A new Lavalink session is created automatically if this bot hasn't
 * connected before.
 */
import type { Request, Response, NextFunction } from "express";
import { lavalinkPool, type LavalinkSession } from "../lib/lavalinkPool.js";
import { BadRequestError } from "../lib/errors.js";

// Augment Express Request so TypeScript knows about req.lavaSession
declare global {
  namespace Express {
    interface Request {
      lavaSession: LavalinkSession;
    }
  }
}

export function requireBotSession(req: Request, _res: Response, next: NextFunction): void {
  const botUserId = req.headers["x-bot-user-id"];

  if (!botUserId || typeof botUserId !== "string") {
    next(
      new BadRequestError(
        "Missing X-Bot-User-Id header — send your Discord bot's user ID (e.g. 123456789012345678)",
      ),
    );
    return;
  }

  if (!/^\d{17,20}$/.test(botUserId)) {
    next(
      new BadRequestError(
        "X-Bot-User-Id must be a valid Discord snowflake ID (17–20 digits)",
      ),
    );
    return;
  }

  req.lavaSession = lavalinkPool.getOrCreate(botUserId);
  next();
}
