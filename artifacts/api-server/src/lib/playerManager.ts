/**
 * Per-guild player state management.
 *
 * Manages in-memory queues, loop mode, shuffle, volume and delegates
 * playback commands to the Lavalink client.
 */
import { lavalinkClient, type LavalinkTrack } from "./lavalink.js";
import { logger } from "./logger.js";

export type LoopMode = "none" | "track" | "queue";

export interface Track {
  encoded: string;
  info: {
    identifier: string;
    title: string;
    author: string;
    duration: number;
    uri: string | null;
    artworkUrl: string | null;
    sourceName: string;
    isStream: boolean;
    isSeekable: boolean;
  };
  requester: string | null;
}

export interface GuildPlayerState {
  guildId: string;
  channelId: string | null;
  currentTrack: Track | null;
  queue: Track[];
  volume: number;
  loopMode: LoopMode;
  shuffle: boolean;
  paused: boolean;
  position: number;
  connected: boolean;
}

function lavalinkTrackToTrack(lav: LavalinkTrack, requester?: string | null): Track {
  return {
    encoded: lav.encoded,
    info: {
      identifier: lav.info.identifier,
      title: lav.info.title,
      author: lav.info.author,
      duration: lav.info.length,
      uri: lav.info.uri,
      artworkUrl: lav.info.artworkUrl,
      sourceName: lav.info.sourceName,
      isStream: lav.info.isStream,
      isSeekable: lav.info.isSeekable,
    },
    requester: requester ?? null,
  };
}

class PlayerManager {
  private players = new Map<string, GuildPlayerState>();

  constructor() {
    // Auto-advance queue on track end
    lavalinkClient.on("trackEnd", async (event) => {
      const player = this.players.get(event.guildId);
      if (!player) return;

      const endedTrack = lavalinkTrackToTrack(event.track);

      if (event.reason === "replaced" || event.reason === "stopped" || event.reason === "cleanup") {
        return;
      }

      if (player.loopMode === "track") {
        // Re-play the same track
        try {
          await lavalinkClient.updatePlayer(event.guildId, {
            track: { encoded: endedTrack.encoded },
          });
        } catch (err) {
          logger.error({ err, guildId: event.guildId }, "Failed to loop track");
        }
        return;
      }

      if (player.loopMode === "queue" && player.currentTrack) {
        // Add current track back to end of queue
        player.queue.push(player.currentTrack);
      }

      const nextTrack = player.queue.shift();

      if (!nextTrack) {
        player.currentTrack = null;
        player.position = 0;
        logger.info({ guildId: event.guildId }, "Queue exhausted");
        return;
      }

      player.currentTrack = nextTrack;
      try {
        await lavalinkClient.updatePlayer(event.guildId, {
          track: { encoded: nextTrack.encoded },
        });
        logger.info(
          { guildId: event.guildId, track: nextTrack.info.title },
          "Auto-advancing to next track",
        );
      } catch (err) {
        logger.error({ err, guildId: event.guildId }, "Failed to advance queue");
      }
    });

    // Sync position from Lavalink
    lavalinkClient.on("playerUpdate", (event) => {
      const player = this.players.get(event.guildId);
      if (player) {
        player.position = event.state.position;
        player.connected = event.state.connected;
      }
    });

    lavalinkClient.on("trackStart", (event) => {
      const player = this.players.get(event.guildId);
      if (player) {
        player.currentTrack = lavalinkTrackToTrack(event.track, player.currentTrack?.requester);
        player.paused = false;
        player.position = 0;
        logger.info(
          { guildId: event.guildId, track: event.track.info.title },
          "Track started",
        );
      }
    });

    lavalinkClient.on("trackException", (event) => {
      logger.error(
        { guildId: event.guildId, track: event.track.info.title, exception: event.exception },
        "Track exception",
      );
    });

    lavalinkClient.on("trackStuck", (event) => {
      logger.warn(
        { guildId: event.guildId, track: event.track.info.title, threshold: event.thresholdMs },
        "Track stuck",
      );
    });
  }

  /** Get or create a player state (does not connect to Lavalink). */
  getOrCreate(guildId: string, channelId?: string): GuildPlayerState {
    let player = this.players.get(guildId);
    if (!player) {
      player = {
        guildId,
        channelId: channelId ?? null,
        currentTrack: null,
        queue: [],
        volume: 100,
        loopMode: "none",
        shuffle: false,
        paused: false,
        position: 0,
        connected: false,
      };
      this.players.set(guildId, player);
    }
    if (channelId) player.channelId = channelId;
    return player;
  }

  /** Get a player state, returns undefined if not found. */
  get(guildId: string): GuildPlayerState | undefined {
    return this.players.get(guildId);
  }

  /** Remove a player (call after disconnect). */
  remove(guildId: string): void {
    this.players.delete(guildId);
  }

  /** Get all active guild IDs. */
  getAllGuildIds(): string[] {
    return [...this.players.keys()];
  }

  // ─── Queue helpers ───────────────────────────────────────────────────────

  addToQueue(guildId: string, track: Track): void {
    const player = this.getOrCreate(guildId);
    if (player.shuffle) {
      // Insert at random position in queue
      const pos = Math.floor(Math.random() * (player.queue.length + 1));
      player.queue.splice(pos, 0, track);
    } else {
      player.queue.push(track);
    }
  }

  addManyToQueue(guildId: string, tracks: Track[], shuffleFirst = false): void {
    const player = this.getOrCreate(guildId);
    const toAdd = shuffleFirst ? shuffleArray([...tracks]) : tracks;
    player.queue.push(...toAdd);
  }

  shuffleQueue(guildId: string): void {
    const player = this.getOrCreate(guildId);
    player.queue = shuffleArray(player.queue);
  }

  clearQueue(guildId: string): void {
    const player = this.getOrCreate(guildId);
    player.queue = [];
  }

  // ─── Track helpers ───────────────────────────────────────────────────────

  /** Convert a Lavalink track to our Track type. */
  fromLavalink(lav: LavalinkTrack, requester?: string | null): Track {
    return lavalinkTrackToTrack(lav, requester);
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export const playerManager = new PlayerManager();
