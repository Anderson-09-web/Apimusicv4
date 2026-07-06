/**
 * Queue management endpoints.
 * GET    /api/music/guilds/:guildId/queue
 * DELETE /api/music/guilds/:guildId/queue
 * POST   /api/music/guilds/:guildId/shuffle
 */
import { Router, type IRouter } from "express";
import { PlayerNotFoundError, BadRequestError } from "../../lib/errors.js";
import { requireApiKey } from "../../middlewares/auth.js";
import { requireBotSession } from "../../middlewares/session.js";

const router: IRouter = Router();

// ─── GET /music/guilds/:guildId/queue ───────────────────────────────────────

router.get("/music/guilds/:guildId/queue", requireApiKey, requireBotSession, (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const { playerManager } = req.lavaSession;
    const player = playerManager.get(guildId);
    if (!player) throw new PlayerNotFoundError(guildId);

    res.json({
      guildId: player.guildId,
      tracks: player.queue,
      total: player.queue.length,
      currentTrack: player.currentTrack,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /music/guilds/:guildId/queue ────────────────────────────────────

router.delete("/music/guilds/:guildId/queue", requireApiKey, requireBotSession, (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const { playerManager } = req.lavaSession;
    const player = playerManager.get(guildId);
    if (!player) throw new PlayerNotFoundError(guildId);

    const cleared = player.queue.length;
    playerManager.clearQueue(guildId);

    res.json({
      success: true,
      message: `Cleared ${cleared} tracks from the queue`,
      guildId,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /music/guilds/:guildId/shuffle ────────────────────────────────────

router.post("/music/guilds/:guildId/shuffle", requireApiKey, requireBotSession, (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const { playerManager } = req.lavaSession;
    const player = playerManager.get(guildId);
    if (!player) throw new PlayerNotFoundError(guildId);
    if (player.queue.length === 0) throw new BadRequestError("Queue is empty, nothing to shuffle");

    playerManager.shuffleQueue(guildId);

    res.json({
      success: true,
      message: `Shuffled ${player.queue.length} tracks`,
      guildId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
