/**
 * Application configuration loaded from environment variables.
 * All sensitive values (API keys, passwords) should be set as env vars — never hardcoded.
 */

export const config = {
  port: parseInt(process.env["PORT"] ?? "5000", 10),
  nodeEnv: process.env["NODE_ENV"] ?? "development",

  /** API key required in X-API-Key header for all music endpoints */
  apiKey: process.env["API_KEY"] ?? "",

  lavalink: {
    host: process.env["LAVALINK_HOST"] ?? "localhost",
    port: parseInt(process.env["LAVALINK_PORT"] ?? "2333", 10),
    password: process.env["LAVALINK_PASSWORD"] ?? "youshallnotpass",
    secure: process.env["LAVALINK_SECURE"] === "true",
    /** Seconds between reconnect attempts */
    reconnectInterval: parseInt(process.env["LAVALINK_RECONNECT_INTERVAL"] ?? "5000", 10),
    /** Max reconnect attempts before giving up (0 = infinite) */
    reconnectMaxRetries: parseInt(process.env["LAVALINK_RECONNECT_MAX_RETRIES"] ?? "0", 10),
    /** Discord bot user ID — required by Lavalink handshake */
    botUserId: process.env["DISCORD_BOT_USER_ID"] ?? "1234567890",
    clientName: process.env["CLIENT_NAME"] ?? "discord-music-api/1.0",
  },

  cache: {
    /** Seconds to cache search results */
    ttl: parseInt(process.env["CACHE_TTL"] ?? "300", 10),
    /** Maximum number of cached entries */
    maxKeys: parseInt(process.env["CACHE_MAX_KEYS"] ?? "500", 10),
  },

  rateLimit: {
    /** Rate limit window in milliseconds */
    windowMs: parseInt(process.env["RATE_LIMIT_WINDOW_MS"] ?? "60000", 10),
    /** Maximum requests per window per IP */
    max: parseInt(process.env["RATE_LIMIT_MAX"] ?? "100", 10),
  },
} as const;

/**
 * Validates critical config at startup — throws on missing required values.
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.apiKey || config.apiKey.length < 16) {
    errors.push(
      "API_KEY is not set or too short. Set a secure API key of at least 16 characters.",
    );
  }
  if (!process.env["DISCORD_BOT_USER_ID"]) {
    errors.push(
      "DISCORD_BOT_USER_ID is not set. Set your Discord bot's user ID.",
    );
  }

  if (errors.length > 0) {
    if (config.nodeEnv === "production") {
      throw new Error(`[config] Missing required configuration:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
    } else {
      // Warn in development so you can still start without full config
      errors.forEach((e) => console.warn(`[config] WARNING: ${e}`));
    }
  }
}
