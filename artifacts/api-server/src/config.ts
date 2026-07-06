/**
 * Application configuration loaded from environment variables.
 * All sensitive values should be set as env vars — never hardcoded.
 */

const DEV_INSECURE_SECRET = "dev-insecure-secret-do-not-use-in-production";

export const config = {
  port: parseInt(process.env["PORT"] ?? "5000", 10),
  nodeEnv: process.env["NODE_ENV"] ?? "development",

  /**
   * HMAC secret used to sign and verify generated API keys.
   * Required in production. Must be at least 32 characters.
   */
  apiKeySecret: process.env["API_KEY_SECRET"] ?? DEV_INSECURE_SECRET,

  /**
   * Password that grants access to generate a new API key via the docs.
   * Defaults to the well-known password used in the documentation.
   */
  adminPassword: process.env["ADMIN_PASSWORD"] ?? "Blocker-X-Music",

  lavalink: {
    host: process.env["LAVALINK_HOST"] ?? "localhost",
    port: parseInt(process.env["LAVALINK_PORT"] ?? "2333", 10),
    password: process.env["LAVALINK_PASSWORD"] ?? "youshallnotpass",
    secure: process.env["LAVALINK_SECURE"] === "true",
    /** Milliseconds between reconnect attempts */
    reconnectInterval: parseInt(process.env["LAVALINK_RECONNECT_INTERVAL"] ?? "5000", 10),
    /** Max reconnect attempts before giving up (0 = infinite) */
    reconnectMaxRetries: parseInt(process.env["LAVALINK_RECONNECT_MAX_RETRIES"] ?? "0", 10),
    /** Discord bot user ID required by Lavalink WebSocket handshake */
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
 * Validates critical config at startup.
 * Throws in production if required values are missing.
 * Warns in development to allow local testing without full config.
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (config.apiKeySecret === DEV_INSECURE_SECRET) {
    errors.push(
      "API_KEY_SECRET is not set. Set a secure random secret of at least 32 characters.",
    );
  }

  if (errors.length > 0) {
    if (config.nodeEnv === "production") {
      throw new Error(
        `[config] Missing required configuration:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
      );
    } else {
      errors.forEach((e) => console.warn(`[config] WARNING: ${e}`));
    }
  }
}
