/**
 * Lavalink v4 REST + WebSocket client.
 *
 * Handles:
 * - WebSocket connection with auto-reconnect
 * - REST API calls for player management
 * - Track loading / search
 * - Event emission for track lifecycle
 */
import EventEmitter from "node:events";
import { config } from "../config.js";
import { logger } from "./logger.js";
import { LavalinkError } from "./errors.js";

// ─── Lavalink v4 Types ──────────────────────────────────────────────────────

export interface LavalinkTrackInfo {
  identifier: string;
  isSeekable: boolean;
  author: string;
  length: number;
  isStream: boolean;
  position: number;
  title: string;
  uri: string | null;
  artworkUrl: string | null;
  isrc: string | null;
  sourceName: string;
}

export interface LavalinkTrack {
  encoded: string;
  info: LavalinkTrackInfo;
  pluginInfo: Record<string, unknown>;
  userData: Record<string, unknown>;
}

export interface LavalinkLoadResult {
  loadType: "track" | "playlist" | "search" | "empty" | "error";
  data:
    | LavalinkTrack
    | { tracks: LavalinkTrack[]; info: { name: string; selectedTrack: number }; pluginInfo: unknown }
    | LavalinkTrack[]
    | { message: string; severity: string; cause: string }
    | Record<string, never>;
}

export interface LavalinkPlayerState {
  time: number;
  position: number;
  connected: boolean;
  ping: number;
}

export interface LavalinkPlayer {
  guildId: string;
  track?: LavalinkTrack;
  volume: number;
  paused: boolean;
  state: LavalinkPlayerState;
  voice: { token: string; endpoint: string; sessionId: string };
  filters: Record<string, unknown>;
}

export interface LavalinkStats {
  players: number;
  playingPlayers: number;
  uptime: number;
  memory: { free: number; used: number; allocated: number; reservable: number };
  cpu: { cores: number; systemLoad: number; lavalinkLoad: number };
  frameStats?: { sent: number; nulled: number; deficit: number } | null;
}

export interface LavalinkInfo {
  version: { semver: string; major: number; minor: number; patch: number };
  buildTime: number;
  git: { branch: string; commit: string; commitTime: number };
  jvm: string;
  lavaplayer: string;
  sourceManagers: string[];
  filters: string[];
  plugins: Array<{ name: string; version: string }>;
}

export interface VoiceState {
  token: string;
  endpoint: string;
  sessionId: string;
}

// ─── Events ─────────────────────────────────────────────────────────────────

export interface TrackStartEvent {
  guildId: string;
  track: LavalinkTrack;
}

export interface TrackEndEvent {
  guildId: string;
  track: LavalinkTrack;
  reason: "finished" | "loadFailed" | "stopped" | "replaced" | "cleanup";
}

export interface TrackExceptionEvent {
  guildId: string;
  track: LavalinkTrack;
  exception: { message: string; severity: string; cause: string };
}

export interface TrackStuckEvent {
  guildId: string;
  track: LavalinkTrack;
  thresholdMs: number;
}

export interface WebSocketClosedEvent {
  guildId: string;
  code: number;
  reason: string;
  byRemote: boolean;
}

export interface PlayerUpdateEvent {
  guildId: string;
  state: LavalinkPlayerState;
}

// ─── Client ─────────────────────────────────────────────────────────────────

export declare interface LavalinkClient {
  on(event: "ready", listener: (sessionId: string, resumed: boolean) => void): this;
  on(event: "connected", listener: () => void): this;
  on(event: "disconnected", listener: (code: number, reason: string) => void): this;
  on(event: "reconnecting", listener: (attempt: number) => void): this;
  on(event: "trackStart", listener: (event: TrackStartEvent) => void): this;
  on(event: "trackEnd", listener: (event: TrackEndEvent) => void): this;
  on(event: "trackException", listener: (event: TrackExceptionEvent) => void): this;
  on(event: "trackStuck", listener: (event: TrackStuckEvent) => void): this;
  on(event: "wsClose", listener: (event: WebSocketClosedEvent) => void): this;
  on(event: "playerUpdate", listener: (event: PlayerUpdateEvent) => void): this;
  on(event: "stats", listener: (stats: LavalinkStats) => void): this;
}

export class LavalinkClient extends EventEmitter {
  public sessionId: string | null = null;
  public connected = false;
  public lastStats: LavalinkStats | null = null;

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  /**
   * @param botUserId Discord bot user ID sent in the Lavalink WebSocket handshake.
   *                  Defaults to DISCORD_BOT_USER_ID from config.
   */
  constructor(private readonly botUserId: string = config.lavalink.botUserId) {
    super();
  }

  private get baseUrl(): string {
    const protocol = config.lavalink.secure ? "https" : "http";
    return `${protocol}://${config.lavalink.host}:${config.lavalink.port}`;
  }

  private get wsUrl(): string {
    const protocol = config.lavalink.secure ? "wss" : "ws";
    return `${protocol}://${config.lavalink.host}:${config.lavalink.port}/v4/websocket`;
  }

  private get authHeaders(): Record<string, string> {
    return {
      Authorization: config.lavalink.password,
      "Content-Type": "application/json",
    };
  }

  /** Connect to Lavalink WebSocket. */
  connect(): void {
    if (this.destroyed) return;

    logger.info({ url: this.wsUrl }, "Connecting to Lavalink...");

    const headers: Record<string, string> = {
      Authorization: config.lavalink.password,
      "User-Id": this.botUserId,
      "Client-Name": config.lavalink.clientName,
    };
    if (this.sessionId) {
      headers["Session-Id"] = this.sessionId;
    }

    // Node.js 24 has native WebSocket
    const ws = new WebSocket(this.wsUrl, { headers } as WebSocketInit);
    this.ws = ws;

    ws.onopen = () => {
      logger.info("Lavalink WebSocket connected");
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit("connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        this.handleMessage(msg);
      } catch (err) {
        logger.error({ err }, "Failed to parse Lavalink WS message");
      }
    };

    ws.onclose = (event) => {
      this.connected = false;
      this.ws = null;
      logger.warn({ code: event.code, reason: event.reason }, "Lavalink WS disconnected");
      this.emit("disconnected", event.code, event.reason);
      if (!this.destroyed) this.scheduleReconnect();
    };

    ws.onerror = (event) => {
      logger.error({ error: String(event) }, "Lavalink WS error");
    };
  }

  /**
   * Wait until the client has an active session, up to `timeoutMs`.
   * Useful to ride out brief reconnects (e.g. after the Lavalink host
   * wakes up from a free-tier sleep) instead of failing immediately.
   */
  async waitUntilReady(timeoutMs = 10000): Promise<boolean> {
    if (this.connected && this.sessionId) return true;

    return new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.off("ready", onReady);
      };
      const onReady = () => {
        cleanup();
        resolve(true);
      };
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);
      this.on("ready", onReady);
    });
  }

  /** Gracefully destroy the client. */
  destroy(): void {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close(1000, "Client destroyed");
      this.ws = null;
    }
    this.connected = false;
  }

  private scheduleReconnect(): void {
    const maxRetries = config.lavalink.reconnectMaxRetries;
    if (maxRetries > 0 && this.reconnectAttempts >= maxRetries) {
      logger.error({ attempts: this.reconnectAttempts }, "Lavalink max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(config.lavalink.reconnectInterval * this.reconnectAttempts, 30000);

    logger.info({ attempt: this.reconnectAttempts, delayMs: delay }, "Scheduling Lavalink reconnect");
    this.emit("reconnecting", this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(msg: Record<string, unknown>): void {
    switch (msg["op"]) {
      case "ready": {
        this.sessionId = msg["sessionId"] as string;
        const resumed = msg["resumed"] as boolean;
        logger.info({ sessionId: this.sessionId, resumed }, "Lavalink session ready");
        this.emit("ready", this.sessionId, resumed);
        break;
      }
      case "stats": {
        this.lastStats = msg as unknown as LavalinkStats;
        this.emit("stats", this.lastStats);
        break;
      }
      case "playerUpdate": {
        this.emit("playerUpdate", {
          guildId: msg["guildId"],
          state: msg["state"],
        } as PlayerUpdateEvent);
        break;
      }
      case "event": {
        this.handleEvent(msg);
        break;
      }
      default:
        logger.debug({ op: msg["op"] }, "Unknown Lavalink WS message");
    }
  }

  private handleEvent(msg: Record<string, unknown>): void {
    const guildId = msg["guildId"] as string;
    switch (msg["type"]) {
      case "TrackStartEvent":
        this.emit("trackStart", { guildId, track: msg["track"] } as TrackStartEvent);
        break;
      case "TrackEndEvent":
        this.emit("trackEnd", {
          guildId,
          track: msg["track"],
          reason: (msg["reason"] as string).toLowerCase(),
        } as TrackEndEvent);
        break;
      case "TrackExceptionEvent":
        this.emit("trackException", {
          guildId,
          track: msg["track"],
          exception: msg["exception"],
        } as TrackExceptionEvent);
        break;
      case "TrackStuckEvent":
        this.emit("trackStuck", {
          guildId,
          track: msg["track"],
          thresholdMs: msg["thresholdMs"],
        } as TrackStuckEvent);
        break;
      case "WebSocketClosedEvent":
        this.emit("wsClose", {
          guildId,
          code: msg["code"],
          reason: msg["reason"],
          byRemote: msg["byRemote"],
        } as WebSocketClosedEvent);
        break;
    }
  }

  // ─── REST Methods ─────────────────────────────────────────────────────────

  private async rest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/v4${path}`;
    const init: RequestInit = {
      method,
      headers: this.authHeaders,
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      throw new LavalinkError("Failed to connect to Lavalink node", String(err));
    }

    if (!res.ok) {
      let errBody = "";
      try {
        errBody = await res.text();
      } catch {
        // ignore
      }
      throw new LavalinkError(
        `Lavalink REST error: ${res.status} ${res.statusText}`,
        errBody,
      );
    }

    // 204 No Content
    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
  }

  /** Load tracks by identifier (URL or search query with prefix like "ytsearch:"). */
  async loadTracks(identifier: string): Promise<LavalinkLoadResult> {
    return this.rest<LavalinkLoadResult>(
      "GET",
      `/loadtracks?identifier=${encodeURIComponent(identifier)}`,
    );
  }

  /**
   * Update or create a player.
   * Used for: playing a track, pausing, resuming, volume, voice state.
   */
  async updatePlayer(
    guildId: string,
    data: {
      track?: { encoded: string | null };
      volume?: number;
      paused?: boolean;
      voice?: VoiceState;
      filters?: Record<string, unknown>;
      position?: number;
    },
    noReplace = false,
  ): Promise<LavalinkPlayer> {
    if (!this.sessionId) throw new LavalinkError("No active Lavalink session");
    return this.rest<LavalinkPlayer>(
      "PATCH",
      `/sessions/${this.sessionId}/players/${guildId}?noReplace=${noReplace}`,
      data,
    );
  }

  /** Destroy a player. */
  async destroyPlayer(guildId: string): Promise<void> {
    if (!this.sessionId) throw new LavalinkError("No active Lavalink session");
    return this.rest<void>("DELETE", `/sessions/${this.sessionId}/players/${guildId}`);
  }

  /** Get all players. */
  async getPlayers(): Promise<LavalinkPlayer[]> {
    if (!this.sessionId) throw new LavalinkError("No active Lavalink session");
    return this.rest<LavalinkPlayer[]>("GET", `/sessions/${this.sessionId}/players`);
  }

  /** Get a single player. */
  async getPlayer(guildId: string): Promise<LavalinkPlayer> {
    if (!this.sessionId) throw new LavalinkError("No active Lavalink session");
    return this.rest<LavalinkPlayer>(
      "GET",
      `/sessions/${this.sessionId}/players/${guildId}`,
    );
  }

  /** Get Lavalink node statistics. */
  async getStats(): Promise<LavalinkStats> {
    return this.rest<LavalinkStats>("GET", "/stats");
  }

  /** Get Lavalink node info. */
  async getInfo(): Promise<LavalinkInfo> {
    return this.rest<LavalinkInfo>("GET", "/info");
  }

  /** Update session (resuming configuration). */
  async updateSession(resuming: boolean, timeout: number): Promise<void> {
    if (!this.sessionId) throw new LavalinkError("No active Lavalink session");
    return this.rest<void>("PATCH", `/sessions/${this.sessionId}`, { resuming, timeout });
  }
}

