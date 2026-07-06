/**
 * Lavalink nodes status endpoint.
 * GET /api/music/nodes/status
 */
import { Router, type IRouter } from "express";
import { lavalinkClient } from "../../lib/lavalink.js";
import { config } from "../../config.js";

const router: IRouter = Router();

router.get("/music/nodes/status", async (req, res, next) => {
  try {
    let stats = lavalinkClient.lastStats;
    let ping = 0;

    if (lavalinkClient.connected) {
      try {
        stats = await lavalinkClient.getStats();
        // Measure ping via a lightweight REST call
        const start = Date.now();
        await lavalinkClient.getStats();
        ping = Date.now() - start;
      } catch {
        // Use cached stats if live fetch fails
      }
    }

    const node = {
      name: config.lavalink.clientName,
      url: `${config.lavalink.host}:${config.lavalink.port}`,
      connected: lavalinkClient.connected,
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
      connectedNodes: lavalinkClient.connected ? 1 : 0,
      totalPlayers: node.players,
      nodes: [node],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
