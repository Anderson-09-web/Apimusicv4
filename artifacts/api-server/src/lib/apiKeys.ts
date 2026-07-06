/**
 * Stateless API key generation and verification using HMAC-SHA256.
 *
 * Keys are self-contained (no database required):
 * - Format: mk.<base64url_payload>.<hmac_base64url>
 * - Payload encodes expiration timestamp + random jti (prevents replay of identical payloads)
 * - Signature is verified using constant-time comparison to prevent timing attacks
 * - Keys expire after 7 days
 */
import crypto from "node:crypto";
import { config } from "../config.js";

const PREFIX = "mk";
const KEY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface GeneratedKey {
  key: string;
  expiresAt: Date;
}

/**
 * Generate a new HMAC-signed API key with a 7-day expiration.
 */
export function generateApiKey(): GeneratedKey {
  const expiresAt = new Date(Date.now() + KEY_TTL_MS);
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(expiresAt.getTime() / 1000),
      jti: crypto.randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");

  const hmac = crypto
    .createHmac("sha256", config.apiKeySecret)
    .update(payload)
    .digest("base64url");

  return { key: `${PREFIX}.${payload}.${hmac}`, expiresAt };
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verify an API key's signature and expiration.
 * Returns { valid: true } on success, or { valid: false, reason } on failure.
 */
export function verifyApiKey(key: string): VerifyResult {
  if (!key || typeof key !== "string") {
    return { valid: false, reason: "API key is required" };
  }

  const parts = key.split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX) {
    return { valid: false, reason: "Invalid API key format" };
  }

  const [, payload, hmac] = parts as [string, string, string];

  // Verify HMAC signature using constant-time comparison (prevents timing attacks)
  let expectedHmac: string;
  try {
    expectedHmac = crypto
      .createHmac("sha256", config.apiKeySecret)
      .update(payload)
      .digest("base64url");
  } catch {
    return { valid: false, reason: "Invalid API key" };
  }

  try {
    const hBuf = Buffer.from(hmac, "base64url");
    const eBuf = Buffer.from(expectedHmac, "base64url");
    if (hBuf.length !== eBuf.length || !crypto.timingSafeEqual(hBuf, eBuf)) {
      return { valid: false, reason: "Invalid API key" };
    }
  } catch {
    return { valid: false, reason: "Invalid API key" };
  }

  // Verify expiration
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    if (typeof data.exp !== "number" || data.exp <= Math.floor(Date.now() / 1000)) {
      return {
        valid: false,
        reason: "API key has expired. Generate a new one from the documentation.",
      };
    }
  } catch {
    return { valid: false, reason: "Invalid API key" };
  }

  return { valid: true };
}
