import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CodeBlock } from '@/components/CodeBlock';
import { EndpointCard } from '@/components/EndpointCard';
import { GenerateKey } from '@/components/GenerateKey';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  KeyRound,
  Shield,
  Workflow,
  FileCode2,
  AlertCircle,
  Gauge,
  Terminal,
  Plug,
} from 'lucide-react';

// Dynamic API base — works in both dev (localhost) and production (same-origin)
const API_BASE =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://your-api.onrender.com';

export default function Docs() {
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -80% 0px' },
    );
    document.querySelectorAll('section[id]').forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { id: 'intro',      label: 'Introduction',    icon: Terminal  },
    { id: 'apikey',     label: 'API Key',         icon: KeyRound  },
    { id: 'auth',       label: 'Authentication',  icon: Shield    },
    { id: 'voice-flow', label: 'Voice Flow',      icon: Workflow  },
    { id: 'endpoints',  label: 'Endpoints',       icon: FileCode2 },
    { id: 'rate-limits',label: 'Rate Limits',     icon: Gauge     },
    { id: 'errors',     label: 'Error Responses', icon: AlertCircle },
    { id: 'examples',  label: 'Examples',        icon: Plug      },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-border bg-card hidden lg:flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-black">M</span>
            </div>
            Music API
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">v1.4 · Lavalink v4</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                activeSection === item.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 lg:ml-64 min-w-0 pb-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-16 lg:pt-24 space-y-32">

          {/* ── Introduction ── */}
          <section id="intro" className="scroll-mt-32">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Production Ready
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
                Discord Music API
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                A production-grade REST API for Discord music bots, powered by Lavalink v4. 
                Your bot handles Discord events — this API handles everything else.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                {[
                  { label: 'Endpoints',   value: '19'              },
                  { label: 'Engine',      value: 'Lavalink v4'     },
                  { label: 'Sources',     value: 'YT · SC · Spotify' },
                  { label: 'Resilience',  value: 'Auto-reconnect'  },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-card/50">
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <CodeBlock
                  language="bash"
                  title="Quick start"
                  code={`curl -X POST ${API_BASE}/api/music/guilds/YOUR_GUILD_ID/play \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Never Gonna Give You Up"}'`}
                />
              </div>
            </motion.div>
          </section>

          {/* ── API Key ── */}
          <section id="apikey" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-2 pb-2 border-b border-border">API Key</h2>
            <p className="text-muted-foreground mb-6">
              Every request to a music endpoint requires an <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">X-API-Key</code> header.
              Generate your key below by entering the access password. Keys are valid for <strong className="text-white">7 days</strong> — generate a new one when yours expires.
            </p>

            <div className="rounded-xl border border-border bg-card p-6 mb-6">
              <h3 className="text-white font-semibold mb-2">Generate your API Key</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click the button, enter the access password, and your unique key will be generated instantly.
                Save it — it will not be shown again.
              </p>
              <GenerateKey />
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300/80">
              <strong className="text-amber-400">Important:</strong> Treat your API key like a password.
              Never commit it to source control. Store it in an environment variable (e.g.{' '}
              <code className="text-primary">MUSIC_API_KEY</code>).
            </div>
          </section>

          {/* ── Authentication ── */}
          <section id="auth" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-2 pb-2 border-b border-border">Authentication</h2>
            <p className="text-muted-foreground mb-6">
              Include your API key in the <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">X-API-Key</code> header of every request to a music endpoint.
              The health check (<code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">GET /api/healthz</code>) does not require authentication.
            </p>
            <CodeBlock
              language="js"
              title="Authentication example"
              code={`// Using fetch (browser or Node.js)
const response = await fetch('${API_BASE}/api/music/guilds/GUILD_ID/play', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.MUSIC_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: 'Never Gonna Give You Up' }),
});

const data = await response.json();
console.log(data.status); // "playing" or "queued"`}
            />
          </section>

          {/* ── Voice Connection Flow ── */}
          <section id="voice-flow" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-2 pb-2 border-b border-border">Voice Connection Flow</h2>
            <p className="text-muted-foreground mb-4">
              Lavalink requires Discord voice connection data to join a voice channel. Your bot must
              listen for <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">VOICE_STATE_UPDATE</code> and{' '}
              <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">VOICE_SERVER_UPDATE</code> gateway events and relay
              them to the API <strong className="text-white">before</strong> calling play.
            </p>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4 mb-6 text-sm text-muted-foreground">
              <span className="text-primary font-bold shrink-0 mt-0.5">Flow:</span>
              <span>Bot joins voice channel → Discord sends voice events → Bot POSTs to <code className="text-primary">/voice</code> → Bot calls <code className="text-primary">/play</code></span>
            </div>
            <CodeBlock
              language="js"
              title="Relay voice events (discord.js)"
              code={`client.on('raw', async (packet) => {
  if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t)) return;

  await fetch(\`${API_BASE}/api/music/guilds/\${packet.d.guild_id}/voice\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.MUSIC_API_KEY,
    },
    body: JSON.stringify(packet.d),
  });
});`}
            />
          </section>

          {/* ── Endpoints ── */}
          <section id="endpoints" className="scroll-mt-32">
            <h2 className="text-3xl font-bold text-white mb-8 pb-4 border-b border-border">API Endpoints</h2>

            {/* Health */}
            <div className="mb-14">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Health
              </h3>
              <EndpointCard method="GET" path="/api/healthz" description="Check if the API is running. No authentication required." delay={0.05}>
                <CodeBlock language="json" title="Response" code={`{ "status": "ok" }`} />
              </EndpointCard>
              <EndpointCard method="GET" path="/api/music/nodes/status" description="Get Lavalink node statistics (memory, CPU, active players)." delay={0.1}>
                <CodeBlock language="json" title="Response" code={`{
  "totalNodes": 1,
  "connectedNodes": 1,
  "totalPlayers": 3,
  "nodes": [
    {
      "name": "discord-music-api/1.0",
      "connected": true,
      "players": 3,
      "playingPlayers": 2,
      "uptime": 86400000,
      "memoryUsed": 134217728,
      "cpuLoad": 0.02,
      "ping": 4
    }
  ]
}`} />
              </EndpointCard>
            </div>

            {/* Key Management */}
            <div className="mb-14">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Key Management
              </h3>
              <EndpointCard method="POST" path="/api/keys/generate" description="Generate a new API key (valid 7 days). Requires the admin password. Rate-limited to 5 requests per 15 minutes." delay={0.05}>
                <CodeBlock language="json" title="Request body" code={`{ "password": "Blocker-X-Music" }`} />
                <CodeBlock language="json" title="Response 201" code={`{
  "key": "mk.eyJleHAiO...",
  "expiresAt": "2026-07-13T00:00:00.000Z",
  "expiresIn": "7 days"
}`} />
              </EndpointCard>
            </div>

            {/* Search */}
            <div className="mb-14">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Search
              </h3>
              <EndpointCard method="GET" path="/api/music/search" description="Search for tracks. Results are cached for 5 minutes to reduce Lavalink load." delay={0.05}>
                <p className="text-sm font-mono text-muted-foreground mb-3">
                  ?query=Bohemian Rhapsody&amp;source=ytsearch&amp;limit=10
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  <strong className="text-white">source</strong> values:{' '}
                  <code className="text-primary">ytsearch</code> (YouTube),{' '}
                  <code className="text-primary">scsearch</code> (SoundCloud),{' '}
                  <code className="text-primary">spsearch</code> (Spotify)
                </p>
                <CodeBlock language="json" title="Response" code={`{
  "loadType": "search",
  "tracks": [
    {
      "encoded": "QAAAjQIA...",
      "info": {
        "title": "Bohemian Rhapsody",
        "author": "Queen",
        "duration": 354000,
        "uri": "https://youtube.com/watch?v=fJ9rUzIMcZQ",
        "artworkUrl": "https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg",
        "sourceName": "youtube",
        "isStream": false,
        "isSeekable": true
      }
    }
  ],
  "query": "Bohemian Rhapsody",
  "source": "ytsearch",
  "cached": false
}`} />
              </EndpointCard>
            </div>

            {/* Player Control */}
            <div className="mb-14">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Player Control
              </h3>

              <EndpointCard method="POST" path="/api/music/guilds/:guildId/play" description="Play a track by URL or search query. If something is already playing, the track is queued." delay={0.05}>
                <CodeBlock language="json" title="Request body" code={`{
  "query": "https://youtu.be/dQw4w9WgXcQ",
  "channelId": "VOICE_CHANNEL_ID",
  "requesterId": "USER_ID",
  "source": "ytsearch",
  "addToQueue": true
}`} />
                <CodeBlock language="json" title="Response" code={`{
  "status": "playing",
  "track": { "info": { "title": "Never Gonna Give You Up", ... } },
  "position": null,
  "queueSize": 0
}`} />
              </EndpointCard>

              <EndpointCard method="POST" path="/api/music/guilds/:guildId/playlist" description="Load a full playlist URL and queue all tracks." delay={0.1}>
                <CodeBlock language="json" title="Request body" code={`{
  "url": "https://www.youtube.com/playlist?list=PLxxxxx",
  "channelId": "VOICE_CHANNEL_ID",
  "shuffle": false
}`} />
                <CodeBlock language="json" title="Response" code={`{
  "status": "playing",
  "playlistName": "My Playlist",
  "tracksLoaded": 24,
  "queueSize": 23
}`} />
              </EndpointCard>

              <EndpointCard method="POST" path="/api/music/guilds/:guildId/pause" description="Pause current playback." delay={0.15}>
                <CodeBlock language="json" title="Response" code={`{ "success": true, "message": "Playback paused", "guildId": "..." }`} />
              </EndpointCard>

              <EndpointCard method="POST" path="/api/music/guilds/:guildId/resume" description="Resume paused playback." delay={0.2}>
                <CodeBlock language="json" title="Response" code={`{ "success": true, "message": "Playback resumed", "guildId": "..." }`} />
              </EndpointCard>

              <EndpointCard method="POST" path="/api/music/guilds/:guildId/skip" description="Skip the current track and advance the queue." delay={0.25}>
                <CodeBlock language="json" title="Response" code={`{
  "success": true,
  "skippedTrack": { "info": { "title": "Track A", ... } },
  "nextTrack": { "info": { "title": "Track B", ... } },
  "queueSize": 5
}`} />
              </EndpointCard>

              <EndpointCard method="POST" path="/api/music/guilds/:guildId/stop" description="Stop playback and clear the queue." delay={0.3}>
                <CodeBlock language="json" title="Response" code={`{ "success": true, "message": "Playback stopped and queue cleared", "guildId": "..." }`} />
              </EndpointCard>

              <EndpointCard method="PATCH" path="/api/music/guilds/:guildId/volume" description="Set player volume. Accepts 0–1000 (100 = default)." delay={0.35}>
                <CodeBlock language="json" title="Request body" code={`{ "volume": 80 }`} />
              </EndpointCard>

              <EndpointCard method="PATCH" path="/api/music/guilds/:guildId/loop" description="Set loop mode." delay={0.4}>
                <CodeBlock language="json" title="Request body" code={`{ "mode": "none" }`} />
                <p className="text-xs text-muted-foreground mt-2">
                  <strong className="text-white">mode</strong> values:{' '}
                  <code className="text-primary">none</code>,{' '}
                  <code className="text-primary">track</code>,{' '}
                  <code className="text-primary">queue</code>
                </p>
              </EndpointCard>

              <EndpointCard method="GET" path="/api/music/guilds/:guildId/now-playing" description="Get the currently playing track and playback state." delay={0.45}>
                <CodeBlock language="json" title="Response" code={`{
  "track": { "info": { "title": "Bohemian Rhapsody", ... } },
  "position": 45000,
  "paused": false,
  "volume": 100,
  "loopMode": "none",
  "queueSize": 3
}`} />
              </EndpointCard>

              <EndpointCard method="GET" path="/api/music/guilds/:guildId/status" description="Get full player state including connection info and shuffle mode." delay={0.5}>
                <CodeBlock language="json" title="Response" code={`{
  "guildId": "...",
  "connected": true,
  "playing": true,
  "paused": false,
  "volume": 100,
  "loopMode": "none",
  "shuffleEnabled": false,
  "queueSize": 3,
  "currentTrack": { "info": { "title": "...", ... } },
  "position": 12000,
  "ping": 4
}`} />
              </EndpointCard>

              <EndpointCard method="DELETE" path="/api/music/guilds/:guildId/disconnect" description="Disconnect the player and destroy all state for this guild." delay={0.55}>
                <CodeBlock language="json" title="Response" code={`{ "success": true, "message": "Player disconnected and destroyed", "guildId": "..." }`} />
              </EndpointCard>
            </div>

            {/* Queue */}
            <div className="mb-14">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Queue Management
              </h3>
              <EndpointCard method="GET" path="/api/music/guilds/:guildId/queue" description="Get all queued tracks and the current track." delay={0.05}>
                <CodeBlock language="json" title="Response" code={`{
  "guildId": "...",
  "currentTrack": { "info": { "title": "Track A", ... } },
  "tracks": [ { "info": { "title": "Track B", ... } }, ... ],
  "total": 5
}`} />
              </EndpointCard>
              <EndpointCard method="POST" path="/api/music/guilds/:guildId/shuffle" description="Shuffle the queue in place (does not affect the current track)." delay={0.1} />
              <EndpointCard method="DELETE" path="/api/music/guilds/:guildId/queue" description="Clear all queued tracks (does not stop current playback)." delay={0.15}>
                <CodeBlock language="json" title="Response" code={`{ "success": true, "message": "Cleared 5 tracks from the queue", "guildId": "..." }`} />
              </EndpointCard>
            </div>

            {/* Voice Relay */}
            <div className="mb-14">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Voice Relay
              </h3>
              <EndpointCard method="POST" path="/api/music/guilds/:guildId/voice" description="Relay Discord gateway voice events so Lavalink can connect. Must be called before /play." delay={0.05}>
                <CodeBlock language="json" title="Request body" code={`{
  "sessionId": "DISCORD_SESSION_ID",
  "token": "VOICE_TOKEN",
  "endpoint": "us-east1.discord.media",
  "channelId": "VOICE_CHANNEL_ID"
}`} />
                <CodeBlock language="json" title="Response" code={`{
  "success": true,
  "message": "Voice state updated. Lavalink is now connected to the voice channel.",
  "guildId": "..."
}`} />
              </EndpointCard>
            </div>
          </section>

          {/* ── Rate Limits ── */}
          <section id="rate-limits" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-2 pb-2 border-b border-border">Rate Limits</h2>
            <p className="text-muted-foreground mb-6">
              All endpoints are rate-limited per IP address. The <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">X-RateLimit-*</code> headers
              in every response tell you your current usage.
            </p>

            <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-muted-foreground font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Endpoint</th>
                    <th className="px-6 py-4 font-medium">Limit</th>
                    <th className="px-6 py-4 font-medium">Window</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-gray-300">
                  <tr>
                    <td className="px-6 py-4 font-mono text-primary">All music endpoints</td>
                    <td className="px-6 py-4">100 requests</td>
                    <td className="px-6 py-4">per minute</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-primary">POST /api/keys/generate</td>
                    <td className="px-6 py-4">5 requests</td>
                    <td className="px-6 py-4">per 15 minutes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-muted-foreground">GET /api/healthz</td>
                    <td className="px-6 py-4 text-muted-foreground">Exempt</td>
                    <td className="px-6 py-4 text-muted-foreground">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CodeBlock
              language="json"
              title="HTTP 429 — Rate limit exceeded"
              code={`{
  "error": "Rate limit exceeded. Please slow down your requests.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": null
}`}
            />
          </section>

          {/* ── Error Responses ── */}
          <section id="errors" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-2 pb-2 border-b border-border">Error Responses</h2>
            <p className="text-muted-foreground mb-6">
              All errors follow a consistent JSON shape. The <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">code</code> field
              is stable — use it in your error handling logic.
            </p>
            <CodeBlock
              language="json"
              title="Error response shape"
              code={`{
  "error": "No active player for guild 123456789012345678",
  "code": "PLAYER_NOT_FOUND",
  "details": null
}`}
            />

            <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-muted-foreground font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">HTTP</th>
                    <th className="px-6 py-4 font-medium">code</th>
                    <th className="px-6 py-4 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-gray-300">
                  <tr>
                    <td className="px-6 py-4 font-mono text-green-400">201</td>
                    <td className="px-6 py-4 font-mono">—</td>
                    <td className="px-6 py-4">API key generated successfully</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-amber-400">400</td>
                    <td className="px-6 py-4 font-mono">BAD_REQUEST</td>
                    <td className="px-6 py-4">Missing or invalid request body / parameters</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-amber-400">401</td>
                    <td className="px-6 py-4 font-mono">UNAUTHORIZED</td>
                    <td className="px-6 py-4">Missing, invalid, or expired API key</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-amber-400">404</td>
                    <td className="px-6 py-4 font-mono">PLAYER_NOT_FOUND</td>
                    <td className="px-6 py-4">No active player for the given guild ID</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-amber-400">404</td>
                    <td className="px-6 py-4 font-mono">NOT_FOUND</td>
                    <td className="px-6 py-4">No tracks found for the query / endpoint doesn't exist</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-amber-400">429</td>
                    <td className="px-6 py-4 font-mono">RATE_LIMIT_EXCEEDED</td>
                    <td className="px-6 py-4">Too many requests from this IP</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-red-400">503</td>
                    <td className="px-6 py-4 font-mono">LAVALINK_ERROR</td>
                    <td className="px-6 py-4">Lavalink node is disconnected or unreachable</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-red-400">500</td>
                    <td className="px-6 py-4 font-mono">INTERNAL_ERROR</td>
                    <td className="px-6 py-4">Unexpected server error</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Integration Examples ── */}
          <section id="examples" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-2 pb-2 border-b border-border">Integration Examples</h2>
            <p className="text-muted-foreground mb-6">
              Full slash command implementations for popular Discord libraries.
            </p>

            <Tabs defaultValue="js" className="w-full">
              <TabsList className="mb-4 bg-card border border-border">
                <TabsTrigger value="js">discord.js</TabsTrigger>
                <TabsTrigger value="py">discord.py</TabsTrigger>
              </TabsList>

              <TabsContent value="js">
                <CodeBlock
                  language="js"
                  title="play command — discord.js"
                  code={`const { SlashCommandBuilder } = require('discord.js');

// Set MUSIC_API_KEY and MUSIC_API_URL in your .env
const API_URL = process.env.MUSIC_API_URL; // e.g. https://discord-music-api.onrender.com
const API_KEY = process.env.MUSIC_API_KEY;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption(opt =>
      opt.setName('query').setDescription('Song name or URL').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('query');

    try {
      const res = await fetch(\`\${API_URL}/api/music/guilds/\${interaction.guildId}/play\`, {
        method: 'POST',
        headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, channelId: interaction.member.voice.channelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const status = data.status === 'playing' ? '▶️ Playing' : '📋 Queued';
      await interaction.editReply(\`\${status}: **\${data.track.info.title}**\`);
    } catch (err) {
      await interaction.editReply(\`❌ \${err.message}\`);
    }
  },
};`}
                />
              </TabsContent>

              <TabsContent value="py">
                <CodeBlock
                  language="python"
                  title="play command — discord.py"
                  code={`import discord
from discord import app_commands
import aiohttp
import os

API_URL = os.getenv('MUSIC_API_URL')  # e.g. https://discord-music-api.onrender.com
API_KEY = os.getenv('MUSIC_API_KEY')

class MusicBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.all())
        self.tree = app_commands.CommandTree(self)

bot = MusicBot()

@bot.tree.command(name='play', description='Play a song')
async def play(interaction: discord.Interaction, query: str):
    await interaction.response.defer()

    channel_id = str(interaction.user.voice.channel.id) if interaction.user.voice else None
    headers = {'X-API-Key': API_KEY, 'Content-Type': 'application/json'}
    url = f'{API_URL}/api/music/guilds/{interaction.guild.id}/play'

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json={'query': query, 'channelId': channel_id}, headers=headers) as resp:
            data = await resp.json()
            if resp.status != 200:
                await interaction.followup.send(f"❌ {data.get('error', 'Unknown error')}")
                return
            status = '▶️ Playing' if data['status'] == 'playing' else '📋 Queued'
            title = data['track']['info']['title']
            await interaction.followup.send(f'{status}: **{title}**')`}
                />
              </TabsContent>
            </Tabs>
          </section>

          <footer className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            Discord Music API · Lavalink v4 · Built by Blocker X
          </footer>
        </div>
      </main>
    </div>
  );
}
