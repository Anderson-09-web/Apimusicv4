# Discord Music API

A production-ready REST API for Discord music bots, built on **Node.js 24 + TypeScript** with **Lavalink v4** as the audio engine. Your Discord bot sends HTTP requests — this API handles playback, queueing, search, caching and reconnection.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (dev mode, auto-rebuild)
- `pnpm --filter @workspace/music-api-docs run dev` — run the documentation web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `docker compose up -d` — start API + Lavalink v4 together

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifacts/api-server)
- Docs: React + Vite (artifacts/music-api-docs)
- Audio: Lavalink v4 (direct REST + WebSocket client)
- Cache: node-cache (in-memory, configurable TTL)
- Rate limiting: express-rate-limit
- Validation: Zod (via @workspace/api-zod)
- Logging: Pino
- API codegen: Orval (from OpenAPI spec in lib/api-spec/)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all contracts)
- `lib/api-zod/src/generated/` — generated Zod validation schemas (server-side)
- `lib/api-client-react/src/generated/` — generated React Query hooks (docs/frontend)
- `artifacts/api-server/src/lib/lavalink.ts` — Lavalink v4 REST + WebSocket client
- `artifacts/api-server/src/lib/playerManager.ts` — per-guild queue and player state
- `artifacts/api-server/src/lib/cache.ts` — search cache
- `artifacts/api-server/src/config.ts` — all env var config
- `artifacts/api-server/src/routes/music/` — all music endpoints
- `lavalink/application.yml` — Lavalink node configuration

## Architecture decisions

- **Direct Lavalink v4 REST + WebSocket** instead of Shoukaku: standalone API servers don't have a Discord.js client, so a custom low-level client is more appropriate than a Discord-aware library.
- **Voice relay pattern**: Discord bot must relay VOICE_STATE_UPDATE + VOICE_SERVER_UPDATE to `POST /api/music/guilds/:guildId/voice`. The API server never connects to Discord directly.
- **In-memory player state**: player state lives in-process (Map). If you need multi-instance support, move it to Redis.
- **Fail-fast in production**: `validateConfig()` throws if `API_KEY` or `DISCORD_BOT_USER_ID` are missing when `NODE_ENV=production`.
- **Non-blocking Lavalink connect**: server starts accepting requests immediately; Lavalink reconnects in background with exponential backoff.

## Product

A REST API that Discord music bots call to delegate all audio playback. Supports:
- 17 endpoints: search, play, playlist, pause, resume, skip, stop, volume, loop, shuffle, queue, clear, now-playing, status, disconnect, voice relay, node status
- Sources: YouTube, SoundCloud, Spotify (via LavaSrc plugin), any Lavalink-compatible URL
- Multi-bot, multi-guild: fully isolated player state per guild ID
- Production features: API key auth, rate limiting, search cache, auto-reconnect, structured logging

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Lavalink v4 requires `DISCORD_BOT_USER_ID` in the WebSocket handshake — set it or WS auth will fail.
- Bot must call `POST /voice` BEFORE calling `POST /play` — otherwise Lavalink can't connect to the voice channel.
- The `lavalink/application.yml` includes LavaSrc and YouTube plugin configs — add Spotify `clientId`/`clientSecret` for Spotify support.
- In development, missing `API_KEY` only warns (not throws) so the server starts without auth.
- Search cache key includes `limit` to avoid poisoning higher-limit results with cached low-limit results.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `README.md` for full API reference and integration examples
