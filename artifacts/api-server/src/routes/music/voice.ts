/**
 * Voice event relay endpoint.
 *
 * The Discord bot must call this endpoint to relay Discord gateway voice events
 * to Lavalink. This is required for Lavalink to establish the actual voice connection.
 *
 * Flow:
 *  1. Bot joins a voice channel on Discord.
 *  2. Discord sends VOICE_STATE_UPDATE + VOICE_SERVER_UPDATE to the bot.
 *  3. Bot POSTs both events here.
 *  4. This endpoint forwards the voice info to Lavalink so it can connect.
 *
 * POST /api/music/guilds/:guildId/voice
 */
import { Router, type IRouter } from "express";
import { BadRequestError, LavalinkError } from "../../lib/errors.js";
import { requireApiKey } from "../../middlewares/auth.js";
import { requireBotSession } from "../../middlewares/session.js";

const router: IRouter = Router();

interface VoiceUpdateBody {
  sessionId: string;
  token: string;
  endpoint: string;
  channelId?: string;
}

function validateVoiceUpdate(body: unknown): VoiceUpdateBody {
  if (!body || typeof body !== "object") throw new BadRequestError("Request body is required");
  const b = body as Record<string, unknown>;
  if (!b["sessionId"] || typeof b["sessionId"] !== "string")
    throw new BadRequestError("sessionId is required and must be a string");
  if (!b["token"] || typeof b["token"] !== "string")
    throw new BadRequestError("token is required and must be a string");
  if (!b["endpoint"] || typeof b["endpoint"] !== "string")
    throw new BadRequestError("endpoint is required and must be a string");
  return {
    sessionId: b["sessionId"],
    token: b["token"],
    endpoint: b["endpoint"],
    channelId: typeof b["channelId"] === "string" ? b["channelId"] : undefined,
  };
}

router.post("/music/guilds/:guildId/voice", requireApiKey, requireBotSession, async (req, res, next) => {
  try {
    const { guildId } = req.params as { guildId: string };
    const { sessionId, token, endpoint, channelId } = validateVoiceUpdate(req.body);
    const { client, playerManager } = req.lavaSession;

    if (!client.connected || !client.sessionId) {
      const ready = await client.waitUntilReady();
      if (!ready) {
        throw new LavalinkError("Lavalink node is not connected (it may be waking up, try again in a few seconds)");
      }
    }

    // Update player in Lavalink with Discord voice connection info
    await client.updatePlayer(
      guildId,
      {
        voice: { token, endpoint, sessionId },
      },
      true, // noReplace — don't replace current track
    );

    // Ensure we have a local player state
    const player = playerManager.getOrCreate(guildId, channelId);
    if (channelId) player.channelId = channelId;
    player.connected = true;

    res.json({
      success: true,
      message: "Voice state updated. Lavalink is now connected to the voice channel.",
      guildId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
