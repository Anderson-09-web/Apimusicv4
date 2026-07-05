/**
 * Custom error classes for structured API error handling.
 */

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "API_ERROR",
    public readonly details?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, message, "NOT_FOUND");
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Invalid or missing API key") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: string) {
    super(400, message, "BAD_REQUEST", details);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = "Rate limit exceeded") {
    super(429, message, "RATE_LIMIT_EXCEEDED");
  }
}

export class LavalinkError extends ApiError {
  constructor(message: string, details?: string) {
    super(503, message, "LAVALINK_ERROR", details);
  }
}

export class PlayerNotFoundError extends ApiError {
  constructor(guildId: string) {
    super(404, `No active player for guild ${guildId}`, "PLAYER_NOT_FOUND");
  }
}

export class PlayerNotActiveError extends ApiError {
  constructor(guildId: string) {
    super(400, `Player is not active for guild ${guildId}`, "PLAYER_NOT_ACTIVE");
  }
}
