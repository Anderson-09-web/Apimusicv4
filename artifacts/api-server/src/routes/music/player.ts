/**
 * Player control endpoints.
 * POST   /api/music/guilds/:guildId/play
 * POST   /api/music/guilds/:guildId/playlist
 * POST   /api/music/guilds/:guildId/pause
 * POST   /api/music/guilds/:guildId/resume
 * POST   /api/music/guilds/:guildId/skip
 * POST   /api/music/guilds/:guildId/stop
 * PATCH  /api/music/guilds/:guildId/volume
 * PATCH  /api/music/guilds/:guildId/loop
 * GET    /api/music/guilds/:guildId/now-playing
 * GET    /api/music/guilds/:guildId/status
 * DELETE /api/music/guilds/:guildId/disconnect
 */
import { Router, type IRouter } from "express";
import { lavalinkClient, type LavalinkTrack } from "../../lib/lavalink.js";
import { playerManager } from "../../lib/playerManager.js";
import {
  BadRequestError,
  LavalinkError,
  NotFoundError,
  PlayerNotFoundError,
} from "../../lib/errors.js";
import { requireApiKey } from "../../middlewares/auth.js";
import {
  PlayTrackBody,
  PlayPlaylistBody,
  SetVolumeBody,
  SetLoopBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SOURCE_PREFIXES: Record<string, string> = {
  youtube: "ytsearch:",
  soundcloud: "scsearch:",
  ytsearch: "ytsearch:",
  scsearch: "scsearch:",
  spotify: "spsearch:",
};

// ─── POST /music/guilds/:guildId/play ────────────────────────────────────────

router.post("/music/guilds/:guildId/play", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const bodyParsed = PlayTrackBody.safeParse(req.body);
    if (!bodyParsed.success) {
      throw new BadRequestError("Invalid request body", bodyParsed.error.message);
    }
    const { query, channelId, requesterId, source, addToQueue = true } = bodyParsed.data;

    if (!lavalinkClient.connected || !lavalinkClient.sessionId) {
      throw new LavalinkError("Lavalink node is not connected");
    }

    // Build identifier
    let identifier: string;
    if (/^https?:\/\//i.test(query)) {
      identifier = query;
    } else {
      const prefix = SOURCE_PREFIXES[source ?? "ytsearch"] ?? "ytsearch:";
      identifier = `${prefix}${query}`;
    }

    const result = await lavalinkClient.loadTracks(identifier);

    let track: LavalinkTrack | null = null;

    if (result.loadType === "track") {
      track = result.data as LavalinkTrack;
    } else if (result.loadType === "search" && Array.isArray(result.data) && result.data.length > 0) {
      track = (result.data as LavalinkTrack[])[0]!;
    } else if (result.loadType === "playlist") {
      const pl = result.data as { tracks: LavalinkTrack[]; info: { name: string } };
      if (pl.tracks.length > 0) track = pl.tracks[0]!;
    }

    if (!track) {
      throw new NotFoundError("No tracks found for the given query");
    }

    const player = playerManager.getOrCreate(guildId, channelId);
    const apiTrack = playerManager.fromLavalink(track, requesterId ?? null);

    let status: "playing" | "queued";
    let position: number | null = null;

    if (player.currentTrack && addToQueue) {
      // Something is playing — add to queue
      playerManager.addToQueue(guildId, apiTrack);
      position = player.queue.length;
      status = "queued";
    } else {
      // Start playing immediately
      player.currentTrack = apiTrack;
      status = "playing";

      await lavalinkClient.updatePlayer(guildId, {
        track: { encoded: track.encoded },
        volume: player.volume,
      });
    }

    res.json({
      status,
      track: apiTrack,
      position,
      queueSize: player.queue.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /music/guilds/:guildId/playlist ───────────────────────────────────

router.post("/music/guilds/:guildId/playlist", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const bodyParsed = PlayPlaylistBody.safeParse(req.body);
    if (!bodyParsed.success) {
      throw new BadRequestError("Invalid request body", bodyParsed.error.message);
    }
    const { url, channelId, requesterId, shuffle = false } = bodyParsed.data;

    if (!lavalinkClient.connected || !lavalinkClient.sessionId) {
      throw new LavalinkError("Lavalink node is not connected");
    }

    const result = await lavalinkClient.loadTracks(url);

    if (result.loadType !== "playlist") {
      throw new BadRequestError("The provided URL is not a playlist");
    }

    const pl = result.data as { tracks: LavalinkTrack[]; info: { name: string } };

    if (!pl.tracks || pl.tracks.length === 0) {
      throw new NotFoundError("Playlist is empty");
    }

    const apiTracks = pl.tracks.map((t) => playerManager.fromLavalink(t, requesterId ?? null));

    const player = playerManager.getOrCreate(guildId, channelId);

    let status: "playing" | "queued";

    if (player.currentTrack) {
      playerManager.addManyToQueue(guildId, apiTracks, shuffle);
      status = "queued";
    } else {
      const firstTrack = apiTracks[0]!;
      const remaining = apiTracks.slice(1);
      player.currentTrack = firstTrack;
      playerManager.addManyToQueue(guildId, remaining, shuffle);

      await lavalinkClient.updatePlayer(guildId, {
        track: { encoded: firstTrack.encoded },
        volume: player.volume,
      });
      status = "playing";
    }

    res.json({
      status,
      playlistName: pl.info?.name ?? "Unknown Playlist",
      tracksLoaded: pl.tracks.length,
      queueSize: player.queue.length,
      firstTrack: apiTracks[0],
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /music/guilds/:guildId/pause ──────────────────────────────────────

router.post("/music/guilds/:guildId/pause", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const player = playerManager.get(guildId);
    if (!player || !player.currentTrack) throw new PlayerNotFoundError(guildId);

    player.paused = true;
    await lavalinkClient.updatePlayer(guildId, { paused: true });

    res.json({ success: true, message: "Playback paused", guildId });
  } catch (err) {
    next(err);
  }
});

// ─── POST /music/guilds/:guildId/resume ─────────────────────────────────────

router.post("/music/guilds/:guildId/resume", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const player = playerManager.get(guildId);
    if (!player || !player.currentTrack) throw new PlayerNotFoundError(guildId);

    player.paused = false;
    await lavalinkClient.updatePlayer(guildId, { paused: false });

    res.json({ success: true, message: "Playback resumed", guildId });
  } catch (err) {
    next(err);
  }
});

// ─── POST /music/guilds/:guildId/skip ───────────────────────────────────────

router.post("/music/guilds/:guildId/skip", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const player = playerManager.get(guildId);
    if (!player || !player.currentTrack) throw new PlayerNotFoundError(guildId);

    const skippedTrack = player.currentTrack;

    if (player.loopMode === "queue") {
      player.queue.push(skippedTrack);
    }

    const nextTrack = player.queue.shift() ?? null;
    player.currentTrack = nextTrack;
    player.position = 0;

    if (nextTrack) {
      await lavalinkClient.updatePlayer(guildId, {
        track: { encoded: nextTrack.encoded },
      });
    } else {
      // Stop player — nothing left in queue
      await lavalinkClient.updatePlayer(guildId, { track: { encoded: null } });
    }

    res.json({
      success: true,
      skippedTrack,
      nextTrack,
      queueSize: player.queue.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /music/guilds/:guildId/stop ───────────────────────────────────────

router.post("/music/guilds/:guildId/stop", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const player = playerManager.get(guildId);
    if (!player) throw new PlayerNotFoundError(guildId);

    player.currentTrack = null;
    player.queue = [];
    player.paused = false;
    player.position = 0;

    await lavalinkClient.updatePlayer(guildId, { track: { encoded: null } });

    res.json({ success: true, message: "Playback stopped and queue cleared", guildId });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /music/guilds/:guildId/volume ────────────────────────────────────

router.patch("/music/guilds/:guildId/volume", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const bodyParsed = SetVolumeBody.safeParse(req.body);
    if (!bodyParsed.success) {
      throw new BadRequestError("Invalid volume", bodyParsed.error.message);
    }
    const { volume } = bodyParsed.data;

    if (!lavalinkClient.connected || !lavalinkClient.sessionId) {
      throw new LavalinkError("Lavalink node is not connected");
    }

    const player = playerManager.getOrCreate(guildId);
    player.volume = volume;

    await lavalinkClient.updatePlayer(guildId, { volume });

    res.json({ success: true, message: `Volume set to ${volume}`, guildId });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /music/guilds/:guildId/loop ──────────────────────────────────────

router.patch("/music/guilds/:guildId/loop", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const bodyParsed = SetLoopBody.safeParse(req.body);
    if (!bodyParsed.success) {
      throw new BadRequestError("Invalid loop mode", bodyParsed.error.message);
    }
    const { mode } = bodyParsed.data;

    const player = playerManager.getOrCreate(guildId);
    player.loopMode = mode as "none" | "track" | "queue";

    res.json({ success: true, message: `Loop mode set to ${mode}`, guildId });
  } catch (err) {
    next(err);
  }
});

// ─── GET /music/guilds/:guildId/now-playing ──────────────────────────────────

router.get("/music/guilds/:guildId/now-playing", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const player = playerManager.get(guildId);
    if (!player || !player.currentTrack) throw new NotFoundError("Nothing is currently playing");

    res.json({
      track: player.currentTrack,
      position: player.position,
      paused: player.paused,
      volume: player.volume,
      loopMode: player.loopMode,
      queueSize: player.queue.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /music/guilds/:guildId/status ──────────────────────────────────────

router.get("/music/guilds/:guildId/status", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const player = playerManager.get(guildId);
    if (!player) throw new PlayerNotFoundError(guildId);

    // Try to get live ping from Lavalink
    let ping = 0;
    try {
      const lp = await lavalinkClient.getPlayer(guildId);
      ping = lp.state?.ping ?? 0;
    } catch {
      // not critical
    }

    res.json({
      guildId: player.guildId,
      connected: player.connected,
      channelId: player.channelId,
      playing: !!player.currentTrack,
      paused: player.paused,
      volume: player.volume,
      loopMode: player.loopMode,
      shuffleEnabled: player.shuffle,
      queueSize: player.queue.length,
      currentTrack: player.currentTrack,
      position: player.position,
      ping,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /music/guilds/:guildId/disconnect ────────────────────────────────

router.delete("/music/guilds/:guildId/disconnect", requireApiKey, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const player = playerManager.get(guildId);
    if (!player) throw new PlayerNotFoundError(guildId);

    await lavalinkClient.destroyPlayer(guildId);
    playerManager.remove(guildId);

    res.json({ success: true, message: "Player disconnected and destroyed", guildId });
  } catch (err) {
    next(err);
  }
});

export default router;
