/**
 * Lavalink session pool.
 *
 * Maintains one LavalinkClient + PlayerManager pair per Discord bot user ID.
 * Sessions are created on first request and reused thereafter, so different
 * bots can share one Lavalink node without interfering with each other.
 */
import { LavalinkClient } from "./lavalink.js";
import { PlayerManager } from "./playerManager.js";
import { logger } from "./logger.js";
import { config } from "../config.js";

export interface LavalinkSession {
  client: LavalinkClient;
  playerManager: PlayerManager;
}

class LavalinkPool {
  private sessions = new Map<string, LavalinkSession>();

  /**
   * Return the existing session for this bot user ID, or create one.
   * Creating a session auto-connects to Lavalink.
   */
  getOrCreate(botUserId: string): LavalinkSession {
    let session = this.sessions.get(botUserId);
    if (!session) {
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
      session = { client, playerManager };
      this.sessions.set(botUserId, session);
      logger.info({ botUserId }, "Created new Lavalink session");
    }
    return session;
  }

  /**
   * Default session — uses DISCORD_BOT_USER_ID from config.
   * Created at startup so Lavalink is warm before the first request.
   */
  get default(): LavalinkSession {
    return this.getOrCreate(config.lavalink.botUserId);
  }

  /** Destroy all sessions (graceful shutdown). */
  destroyAll(): void {
    for (const { client } of this.sessions.values()) {
      client.destroy();
    }
    this.sessions.clear();
  }
}

export const lavalinkPool = new LavalinkPool();
