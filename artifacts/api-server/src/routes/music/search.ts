/**
 * Music search endpoint.
 * GET /api/music/search
 */
import { Router, type IRouter } from "express";
import type { LavalinkTrack } from "../../lib/lavalink.js";
import { cacheGet, cacheSet, searchCacheKey } from "../../lib/cache.js";
import { BadRequestError, LavalinkError } from "../../lib/errors.js";
import { requireApiKey } from "../../middlewares/auth.js";
import { requireBotSession } from "../../middlewares/session.js";
import { SearchTracksQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

interface SearchResponse {
  loadType: string;
  tracks: ReturnType<typeof trackToApiTrack>[];
  playlistName: string | null;
  query: string;
  source: string;
  cached: boolean;
}

const SOURCE_PREFIXES: Record<string, string> = {
  youtube: "ytsearch:",
  soundcloud: "scsearch:",
  ytsearch: "ytsearch:",
  scsearch: "scsearch:",
  spotify: "spsearch:",
};

router.get("/music/search", requireApiKey, requireBotSession, async (req, res, next) => {
  try {
    const rawQuery = req.query["query"];
    if (!rawQuery || typeof rawQuery !== "string") {
      throw new BadRequestError("Missing required query parameter: query");
    }

    const parsed = SearchTracksQueryParams.safeParse(req.query);
    if (!parsed.success) {
      throw new BadRequestError("Invalid query parameters", parsed.error.message);
    }
    const source = parsed.data.source ?? "ytsearch";
    const limit = parsed.data.limit ?? 10;

    const cacheKey = searchCacheKey(rawQuery, source, limit);
    const cached = cacheGet<SearchResponse>(cacheKey);
    if (cached) {
      res.json({ ...cached, cached: true });
      return;
    }

    const { client } = req.lavaSession;

    // Build identifier for Lavalink
    let identifier: string;
    if (/^https?:\/\//i.test(rawQuery)) {
      // Direct URL — pass as-is
      identifier = rawQuery;
    } else {
      const prefix = SOURCE_PREFIXES[source] ?? "ytsearch:";
      identifier = `${prefix}${rawQuery}`;
    }

    if (!client.connected || !client.sessionId) {
      const ready = await client.waitUntilReady();
      if (!ready) {
        throw new LavalinkError("Lavalink node is not connected (it may be waking up, try again in a few seconds)");
      }
    }

    const result = await client.loadTracks(identifier);

    let tracks: ReturnType<typeof trackToApiTrack>[] = [];
    let loadType: string = result.loadType;
    let playlistName: string | null = null;

    if (result.loadType === "search" && Array.isArray(result.data)) {
      tracks = (result.data as LavalinkTrack[]).slice(0, limit).map(trackToApiTrack);
    } else if (result.loadType === "track" && result.data && !Array.isArray(result.data)) {
      const track = result.data as LavalinkTrack;
      tracks = [trackToApiTrack(track)];
    } else if (result.loadType === "playlist") {
      const pl = result.data as { tracks: LavalinkTrack[]; info: { name: string } };
      tracks = pl.tracks.slice(0, limit).map(trackToApiTrack);
      playlistName = pl.info?.name ?? null;
    }

    const response = {
      loadType,
      tracks,
      playlistName,
      query: rawQuery,
      source,
      cached: false,
    };

    // Cache non-empty results
    if (tracks.length > 0) {
      cacheSet(cacheKey, response);
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
});

function trackToApiTrack(track: LavalinkTrack) {
  return {
    encoded: track.encoded,
    info: {
      identifier: track.info.identifier,
      title: track.info.title,
      author: track.info.author,
      duration: track.info.length,
      uri: track.info.uri,
      artworkUrl: track.info.artworkUrl,
      sourceName: track.info.sourceName,
      isStream: track.info.isStream,
      isSeekable: track.info.isSeekable,
    },
    requester: null,
  };
}

export default router;
