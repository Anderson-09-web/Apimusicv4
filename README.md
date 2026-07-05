# Discord Music API

A production-ready REST API for Discord music bots, built on **Node.js 24** + **TypeScript** with **Lavalink v4** as the audio engine.

Your Discord bot sends HTTP requests — this API handles everything else: playback, queueing, search, caching, rate limiting and reconnection.

---

## Features

- **Lavalink v4** — low-latency, high-quality audio playback
- **Multi-bot / multi-guild** — fully isolated player state per guild
- **Source support** — YouTube, SoundCloud, Spotify (via LavaSrc), and any Lavalink-compatible URL
- **Smart queue** — auto-advance, loop (track / queue), shuffle
- **Search cache** — in-memory LRU cache for repeated searches (configurable TTL)
- **API Key auth** — all music endpoints require `X-API-Key`
- **Rate limiting** — per-IP request throttling
- **Auto-reconnect** — reconnects to Lavalink with exponential backoff
- **Structured logs** — Pino JSON logging with log level control
- **Global error handler** — consistent JSON error responses
- **Docker-ready** — Dockerfile + docker-compose included

---

## Quick Start

### 1. Copy environment config

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Start with Docker Compose

```bash
docker compose up -d
```

This starts:
- **`music-api`** — the Discord Music API on port `5000`
- **`lavalink`** — Lavalink v4 on port `2333`

### 3. Verify

```bash
curl http://localhost:5000/api/healthz
# {"status":"ok"}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | `development` or `production` |
| `API_KEY` | — | **Required.** Secret key sent in `X-API-Key` header (min 16 chars) |
| `DISCORD_BOT_USER_ID` | — | **Required.** Your Discord bot's User ID |
| `LAVALINK_HOST` | `localhost` | Lavalink hostname |
| `LAVALINK_PORT` | `2333` | Lavalink port |
| `LAVALINK_PASSWORD` | `youshallnotpass` | Lavalink server password |
| `LAVALINK_SECURE` | `false` | Use `wss://` / `https://` |
| `LAVALINK_RECONNECT_INTERVAL` | `5000` | Reconnect delay in ms |
| `LAVALINK_RECONNECT_MAX_RETRIES` | `0` | Max retries (0 = infinite) |
| `CACHE_TTL` | `300` | Search cache TTL in seconds |
| `CACHE_MAX_KEYS` | `500` | Max cache entries |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in ms |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |

---

## Authentication

Every music endpoint requires the `X-API-Key` header:

```http
X-API-Key: your-super-secret-api-key
```

---

## Voice Connection Flow

Lavalink needs Discord voice connection info to transmit audio. Your bot must relay Discord gateway events to this API:

```
1. User runs !play in a voice channel
2. Bot calls  POST /api/music/guilds/{guildId}/voice  ← relay voice state
3. Bot calls  POST /api/music/guilds/{guildId}/play   ← start playback
```

### Step 1 — Bot relays voice events

```js
// discord.js example
client.on("raw", (packet) => {
  if (packet.t === "VOICE_SERVER_UPDATE" && packet.d.guild_id === targetGuildId) {
    fetch(`http://music-api:5000/api/music/guilds/${packet.d.guild_id}/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({
        sessionId: voiceStateSession,  // from VOICE_STATE_UPDATE
        token: packet.d.token,
        endpoint: packet.d.endpoint,
        channelId: voiceChannelId,
      }),
    });
  }
});
```

### Step 2 — Play a track

```js
fetch(`http://music-api:5000/api/music/guilds/${guildId}/play`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
  body: JSON.stringify({
    query: "Never Gonna Give You Up",
    channelId: voiceChannelId,
    requesterId: interaction.user.id,
    source: "ytsearch",
    addToQueue: true,
  }),
});
```

---

## API Endpoints

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check (no auth required) |
| `GET` | `/api/music/nodes/status` | Lavalink node stats |

### Search
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/music/search?query=&source=` | Search tracks |

**Sources:** `ytsearch` (YouTube), `scsearch` (SoundCloud), `spotify`, `youtube` (URL), `soundcloud` (URL)

### Player
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/music/guilds/:guildId/play` | Play a track or URL |
| `POST` | `/api/music/guilds/:guildId/playlist` | Load and play a playlist |
| `POST` | `/api/music/guilds/:guildId/pause` | Pause playback |
| `POST` | `/api/music/guilds/:guildId/resume` | Resume playback |
| `POST` | `/api/music/guilds/:guildId/skip` | Skip current track |
| `POST` | `/api/music/guilds/:guildId/stop` | Stop and clear queue |
| `PATCH` | `/api/music/guilds/:guildId/volume` | Set volume (0–1000) |
| `PATCH` | `/api/music/guilds/:guildId/loop` | Set loop mode (none/track/queue) |
| `GET` | `/api/music/guilds/:guildId/now-playing` | Get current track |
| `GET` | `/api/music/guilds/:guildId/status` | Full player status |
| `DELETE` | `/api/music/guilds/:guildId/disconnect` | Disconnect and destroy player |

### Queue
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/music/guilds/:guildId/queue` | Get queue |
| `DELETE` | `/api/music/guilds/:guildId/queue` | Clear queue |
| `POST` | `/api/music/guilds/:guildId/shuffle` | Shuffle queue |

### Voice (Bot → API)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/music/guilds/:guildId/voice` | Relay Discord voice state to Lavalink |

---

## Example: discord.py Bot

```python
import aiohttp

MUSIC_API = "http://localhost:5000/api"
API_KEY = "your-api-key"

async def play(guild_id: str, channel_id: str, query: str, user_id: str):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{MUSIC_API}/music/guilds/{guild_id}/play",
            headers={"X-API-Key": API_KEY},
            json={"query": query, "channelId": channel_id, "requesterId": user_id},
        ) as resp:
            return await resp.json()
```

---

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Music API server (Node.js + Express)
│   │   └── src/
│   │       ├── config.ts         # Environment configuration
│   │       ├── app.ts            # Express app setup
│   │       ├── index.ts          # Entry point + Lavalink init
│   │       ├── lib/
│   │       │   ├── lavalink.ts   # Lavalink v4 REST + WebSocket client
│   │       │   ├── playerManager.ts  # Per-guild queue & state
│   │       │   ├── cache.ts      # In-memory search cache
│   │       │   └── errors.ts     # Custom error classes
│   │       ├── middlewares/
│   │       │   ├── auth.ts       # API key validation
│   │       │   ├── rateLimiter.ts
│   │       │   └── errorHandler.ts
│   │       └── routes/music/     # All music endpoints
│   └── music-api-docs/      # Documentation website
├── lib/
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   ├── api-zod/             # Generated Zod validation schemas
│   └── api-client-react/    # Generated React Query hooks
├── lavalink/
│   └── application.yml      # Lavalink configuration
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Development

```bash
# Install dependencies
pnpm install

# Start API server in dev mode
pnpm --filter @workspace/api-server run dev

# Run typecheck
pnpm run typecheck

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## License

MIT
