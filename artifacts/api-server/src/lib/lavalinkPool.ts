/**
 * Lavalink session pool.
 *
 * Maintains one LavalinkClient + PlayerManager pair per Discord bot user ID.
 * Sessions are created on first request and reused thereafter, so different
 * bots can share one Lavalink node without interfering with each other.
 *
 * Resource controls
 * ─────────────────
 * MAX_SESSIONS (env: LAVALINK_MAX_SESSIONS, default 50): hard cap on concurrent
 * sessions. When the pool is full and a new bot ID arrives, the least-recently-used
 * session is evicted and its Lavalink client destroyed.
 */
import { LavalinkClient } from "./lavalink.js";
import { PlayerManager } from "./playerManager.js";
import { logger } from "./logger.js";
import { config } from "../config.js";

export interface LavalinkSession {
  client: LavalinkClient;
  playerManager: PlayerManager;
}

interface PoolEntry extends LavalinkSession {
  lastUsedAt: number;
}

const MAX_SESSIONS = Math.max(
  1,
  parseInt(process.env["LAVALINK_MAX_SESSIONS"] ?? "50", 10),
);

class LavalinkPool {
  private sessions = new Map<string, PoolEntry>();

  /**
   * Return the existing session for this bot user ID, or create one.
   * Evicts the LRU session if the pool is at capacity.
   */
  getOrCreate(botUserId: string): LavalinkSession {
    const existing = this.sessions.get(botUserId);
    if (existing) {
      existing.lastUsedAt = Date.now();
      return existing;
    }

    // Evict LRU session if at cap
    if (this.sessions.size >= MAX_SESSIONS) {
      this.evictLru();
    }

    const client = new LavalinkClient(botUserId);
    const playerManager = new PlayerManager(client);

    client.on("ready", (sessionId, resumed) => {
      logger.info({ sessionId, resumed, botUserId }, "Lavalink session ready");
    });
    client.on("reconnecting", (attempt) => {
      logger.warn({ attempt, botUserId }, "Reconnecting to Lavalink...");
    });
    client.on("disconnected", (code, reason) => {
      logger.warn({ code, reason, botUserId }, "Lavalink disconnected");
    });
    client.on("stats", (stats) => {
      logger.debug(
        {
          botUserId,
          players: stats.players,
          playingPlayers: stats.playingPlayers,
          memUsedMb: Math.round(stats.memory.used / 1024 / 1024),
        },
        "Lavalink stats",
      );
    });

    client.connect();

    const entry: PoolEntry = { client, playerManager, lastUsedAt: Date.now() };
    this.sessions.set(botUserId, entry);
    logger.info({ botUserId, totalSessions: this.sessions.size }, "Created new Lavalink session");
    return entry;
  }

  /**
   * Default session — uses DISCORD_BOT_USER_ID from config.
   * Created at startup so Lavalink is warm before the first request.
   */
  get default(): LavalinkSession {
    return this.getOrCreate(config.lavalink.botUserId);
  }

  /** Current number of active sessions. */
  get size(): number {
    return this.sessions.size;
  }

  /** Destroy all sessions (graceful shutdown). */
  destroyAll(): void {
    for (const { client } of this.sessions.values()) {
      client.destroy();
    }
    this.sessions.clear();
  }

  /** Evict the least-recently-used session to make room. */
  private evictLru(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.sessions) {
      if (entry.lastUsedAt < lruTime) {
        lruTime = entry.lastUsedAt;
        lruKey = key;
      }
    }

    if (lruKey) {
      const evicted = this.sessions.get(lruKey)!;
      evicted.client.destroy();
      this.sessions.delete(lruKey);
      logger.warn(
        { evictedBotUserId: lruKey, maxSessions: MAX_SESSIONS },
        "Evicted LRU Lavalink session — pool at capacity",
      );
    }
  }
}

export const lavalinkPool = new LavalinkPool();
