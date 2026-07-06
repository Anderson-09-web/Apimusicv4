/**
 * Lavalink nodes status endpoint.
 * GET /api/music/nodes/status
 */
import { Router, type IRouter } from "express";
import { lavalinkPool } from "../../lib/lavalinkPool.js";
import { config } from "../../config.js";
import { requireApiKey } from "../../middlewares/auth.js";

const router: IRouter = Router();

// Node status reflects the shared Lavalink node — no per-bot session needed.
router.get("/music/nodes/status", requireApiKey, async (req, res, next) => {
  try {
    const { client } = lavalinkPool.default;
    let stats = client.lastStats;
    let ping = 0;

    if (client.connected) {
      try {
        stats = await client.getStats();
        // Measure ping via a lightweight REST call
        const start = Date.now();
        await client.getStats();
        ping = Date.now() - start;
      } catch {
        // Use cached stats if live fetch fails
      }
    }

    const node = {
      name: config.lavalink.clientName,
      url: `${config.lavalink.host}:${config.lavalink.port}`,
      connected: client.connected,
      players: stats?.players ?? 0,
      playingPlayers: stats?.playingPlayers ?? 0,
      uptime: stats?.uptime ?? 0,
      memoryUsed: stats?.memory?.used ?? 0,
      memoryFree: stats?.memory?.free ?? 0,
      cpuCores: stats?.cpu?.cores ?? 0,
      cpuLoad: stats?.cpu?.lavalinkLoad ?? 0,
      ping,
    };

    res.json({
      totalNodes: 1,
      connectedNodes: client.connected ? 1 : 0,
      totalPlayers: node.players,
      nodes: [node],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
