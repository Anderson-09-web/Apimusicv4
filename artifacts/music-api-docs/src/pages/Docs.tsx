import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CodeBlock } from '@/components/CodeBlock';
import { EndpointCard } from '@/components/EndpointCard';
import { GenerateKey } from '@/components/GenerateKey';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileCode2, Terminal, Shield, Workflow, Plug, AlertCircle, Settings } from 'lucide-react';

export default function Docs() {
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'intro', label: 'Introduction', icon: Terminal },
    { id: 'quickstart', label: 'Quick Start', icon: Plug },
    { id: 'auth', label: 'Authentication', icon: Shield },
    { id: 'voice-flow', label: 'Voice Flow', icon: Workflow },
    { id: 'endpoints', label: 'Endpoints', icon: FileCode2 },
    { id: 'errors', label: 'Error Responses', icon: AlertCircle },
    { id: 'configuration', label: 'Configuration', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-border bg-card hidden lg:flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-black">M</span>
            </div>
            Music API
          </h1>
          <p className="text-xs text-muted-foreground mt-2 font-mono">v1.4.0 (Lavalink v4)</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                activeSection === item.id || (activeSection.startsWith(item.id) && item.id === 'endpoints')
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resources</p>
          </div>
          <button onClick={() => scrollTo('examples')} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
            Integration Examples
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-w-0 pb-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-16 lg:pt-24 space-y-32">
          
          {/* Hero Section */}
          <section id="intro" className="scroll-mt-32">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Production Ready
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
                Discord Music API
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                A highly reliable REST API that lets Discord music bots delegate all audio playback to a central server powered by Lavalink v4. 
                Built for scale, precision, and low latency.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                {[
                  { label: "Endpoints", value: "17" },
                  { label: "Engine", value: "Lavalink v4" },
                  { label: "Sources", value: "YT / Spotify / SC" },
                  { label: "Resilience", value: "Auto-reconnect" }
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-card/50">
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Quick Start */}
          <section id="quickstart" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-border">Quick Start</h2>
            <p className="text-muted-foreground mb-6">
              Get up and running in minutes. Install your client, set your token, and make your first play request.
            </p>
            <CodeBlock 
              language="bash"
              title="Terminal"
              code={`# 1. Install your preferred HTTP client
npm install axios

# 2. Set your API key in your environment
export MUSIC_API_KEY="sk_live_123456789"

# 3. Make a request to play a track
curl -X POST https://api.yourdomain.com/api/music/guilds/123456789/play \\
  -H "X-API-Key: $MUSIC_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Never Gonna Give You Up"}'`}
            />
          </section>

          {/* Authentication */}
          <section id="auth" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-border">Authentication</h2>
            <p className="text-muted-foreground mb-6">
              The API uses API keys to authenticate requests. Provide your API key in the <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">X-API-Key</code> header of every request.
            </p>
            <div className="mb-6">
              <GenerateKey />
            </div>
            <CodeBlock 
              language="js"
              title="Authentication Example"
              code={`const response = await fetch('https://api.yourdomain.com/api/healthz', {
  headers: {
    'X-API-Key': process.env.MUSIC_API_KEY
  }
});

const data = await response.json();
console.log(data.status); // "ok"`}
            />
          </section>

          {/* Voice Connection Flow */}
          <section id="voice-flow" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-border">Voice Connection Flow</h2>
            <p className="text-muted-foreground mb-6">
              Because Discord's voice connections require bot gateway events, your bot must relay voice state updates to the API. 
              Listen for <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">VOICE_STATE_UPDATE</code> and <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">VOICE_SERVER_UPDATE</code> events and forward them.
            </p>
            <CodeBlock 
              language="js"
              title="Relaying Voice Events (discord.js)"
              code={`client.on('raw', async (packet) => {
  // Only intercept voice related packets
  if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t)) return;
  
  // Forward the raw packet data directly to the Voice Relay endpoint
  await fetch(\`https://api.yourdomain.com/api/music/guilds/\${packet.d.guild_id}/voice\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.MUSIC_API_KEY
    },
    body: JSON.stringify(packet.d)
  });
});`}
            />
          </section>

          {/* Endpoints */}
          <section id="endpoints" className="scroll-mt-32">
            <h2 className="text-3xl font-bold text-white mb-8 pb-4 border-b border-border">API Endpoints</h2>

            {/* Health */}
            <div className="mb-16">
              <h3 className="text-xl font-semibold text-white mb-6">Health & Node Status</h3>
              <EndpointCard method="GET" path="/api/healthz" description="Check API health status" delay={0.1}>
                <CodeBlock language="json" code={`{ "status": "ok" }`} />
              </EndpointCard>
              <EndpointCard method="GET" path="/api/music/nodes/status" description="Get Lavalink node statistics" delay={0.2}>
                <CodeBlock language="json" code={`{
  "connected": true,
  "players": 42,
  "uptime": 1204859,
  "memory": { "free": 104857600, "used": 524288000 }
}`} />
              </EndpointCard>
            </div>

            {/* Search */}
            <div className="mb-16">
              <h3 className="text-xl font-semibold text-white mb-6">Search</h3>
              <EndpointCard method="GET" path="/api/music/search" description="Search for tracks across providers" delay={0.1}>
                <p className="text-sm text-muted-foreground mb-4 font-mono">Query Params: ?query=...&source=ytsearch</p>
                <CodeBlock language="json" code={`{
  "loadType": "search",
  "tracks": [
    {
      "encoded": "QAA...",
      "info": {
        "identifier": "fJ9rUzIMcZQ",
        "title": "Bohemian Rhapsody",
        "author": "Queen",
        "length": 354000,
        "isStream": false
      }
    }
  ],
  "query": "Bohemian Rhapsody",
  "source": "ytsearch",
  "cached": false
}`} />
              </EndpointCard>
            </div>

            {/* Player */}
            <div className="mb-16">
              <h3 className="text-xl font-semibold text-white mb-6">Player Control</h3>
              
              <EndpointCard method="POST" path="/api/music/guilds/:guildId/play" description="Play a track or queue it" delay={0.1}>
                <CodeBlock language="json" title="Request Body" code={`{ "query": "https://youtube.com/watch?v=..." }`} />
                <CodeBlock language="json" title="Response" code={`{
  "status": "playing",
  "track": { /* track info */ },
  "queueSize": 0
}`} />
              </EndpointCard>

              <EndpointCard method="POST" path="/api/music/guilds/:guildId/playlist" description="Load a full playlist" delay={0.2} />
              <EndpointCard method="POST" path="/api/music/guilds/:guildId/pause" description="Pause current playback" delay={0.3} />
              <EndpointCard method="POST" path="/api/music/guilds/:guildId/resume" description="Resume playback" delay={0.4} />
              
              <EndpointCard method="POST" path="/api/music/guilds/:guildId/skip" description="Skip to the next track" delay={0.5}>
                <CodeBlock language="json" title="Response" code={`{
  "success": true,
  "skippedTrack": "Previous Track Name",
  "nextTrack": "New Track Name",
  "queueSize": 5
}`} />
              </EndpointCard>

              <EndpointCard method="POST" path="/api/music/guilds/:guildId/stop" description="Stop playback and clear player" delay={0.6} />
              
              <EndpointCard method="PATCH" path="/api/music/guilds/:guildId/volume" description="Set player volume (0-1000)" delay={0.7}>
                 <CodeBlock language="json" title="Request Body" code={`{ "volume": 80 }`} />
              </EndpointCard>
              
              <EndpointCard method="PATCH" path="/api/music/guilds/:guildId/loop" description="Set loop mode" delay={0.8}>
                 <CodeBlock language="json" title="Request Body" code={`{ "mode": "none" | "track" | "queue" }`} />
              </EndpointCard>

              <EndpointCard method="GET" path="/api/music/guilds/:guildId/now-playing" description="Get current track and position" delay={0.9} />
              <EndpointCard method="DELETE" path="/api/music/guilds/:guildId/disconnect" description="Disconnect and destroy player" delay={1.0} />
            </div>

            {/* Queue */}
            <div className="mb-16">
              <h3 className="text-xl font-semibold text-white mb-6">Queue Management</h3>
              <EndpointCard method="GET" path="/api/music/guilds/:guildId/queue" description="Get the full queue" delay={0.1} />
              <EndpointCard method="POST" path="/api/music/guilds/:guildId/shuffle" description="Shuffle the current queue" delay={0.2} />
              <EndpointCard method="DELETE" path="/api/music/guilds/:guildId/queue" description="Clear the queue" delay={0.3} />
            </div>

          </section>

          {/* Errors */}
          <section id="errors" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-border">Error Responses</h2>
            <p className="text-muted-foreground mb-6">
              The API returns standard HTTP status codes and a consistent JSON error shape.
            </p>
            <CodeBlock 
              language="json"
              title="Error Shape"
              code={`{
  "error": "LAVALINK_ERROR",
  "code": "player_not_found",
  "details": "No active player found for guild 123456789"
}`}
            />
            
            <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-muted-foreground font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Status Code</th>
                    <th className="px-6 py-4 font-medium">Error String</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-gray-300">
                  <tr>
                    <td className="px-6 py-4 font-mono text-amber-400">401</td>
                    <td className="px-6 py-4 font-mono">UNAUTHORIZED</td>
                    <td className="px-6 py-4">Missing or invalid X-API-Key</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-amber-400">404</td>
                    <td className="px-6 py-4 font-mono">PLAYER_NOT_FOUND</td>
                    <td className="px-6 py-4">No active player for this guild ID</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-red-400">500</td>
                    <td className="px-6 py-4 font-mono">LAVALINK_ERROR</td>
                    <td className="px-6 py-4">Lavalink node disconnected or failed</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-amber-400">429</td>
                    <td className="px-6 py-4 font-mono">RATE_LIMIT_EXCEEDED</td>
                    <td className="px-6 py-4">Too many requests, slow down</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Integration Examples */}
          <section id="examples" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-border">Integration Examples</h2>
            <p className="text-muted-foreground mb-6">
              Complete command implementations for popular Discord libraries.
            </p>
            
            <Tabs defaultValue="js" className="w-full">
              <TabsList className="mb-4 bg-card border border-border">
                <TabsTrigger value="js">discord.js</TabsTrigger>
                <TabsTrigger value="py">discord.py</TabsTrigger>
              </TabsList>
              <TabsContent value="js">
                <CodeBlock 
                  language="js"
                  code={`const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption(opt => opt.name('query').setDescription('Song name or URL').setRequired(true)),
    
  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('query');
    
    try {
      const res = await axios.post(\`https://api.yourdomain.com/api/music/guilds/\${interaction.guildId}/play\`, {
        query
      }, { 
        headers: { 'X-API-Key': process.env.MUSIC_API_KEY } 
      });
      
      const title = res.data.track.info.title;
      await interaction.editReply(\`🎵 \${res.data.status === 'playing' ? 'Playing' : 'Queued'}: **\${title}**\`);
    } catch (err) {
      await interaction.editReply('Failed to play the track.');
    }
  }
};`}
                />
              </TabsContent>
              <TabsContent value="py">
                <CodeBlock 
                  language="python"
                  code={`import discord
from discord import app_commands
import aiohttp
import os

class MusicBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)

bot = MusicBot()

@bot.tree.command(name="play", description="Play a song")
async def play(interaction: discord.Interaction, query: str):
    await interaction.response.defer()
    
    url = f"https://api.yourdomain.com/api/music/guilds/{interaction.guild.id}/play"
    headers = {"X-API-Key": os.getenv("MUSIC_API_KEY")}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json={"query": query}, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                title = data["track"]["info"]["title"]
                status = "Playing" if data["status"] == "playing" else "Queued"
                await interaction.followup.send(f"🎵 {status}: **{title}**")
            else:
                await interaction.followup.send("Failed to play the track.")`}
                />
              </TabsContent>
            </Tabs>
          </section>

          {/* Configuration */}
          <section id="configuration" className="scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-border">Server Configuration</h2>
            <p className="text-muted-foreground mb-6">
              Configure these environment variables to set up the API server.
            </p>
            
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-muted-foreground font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Variable</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-gray-300">
                  <tr>
                    <td className="px-6 py-4 font-mono text-primary">PORT</td>
                    <td className="px-6 py-4">API server listening port</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">8080</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-primary">LAVALINK_URL</td>
                    <td className="px-6 py-4">WebSocket URL for Lavalink node</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">ws://localhost:2333</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-primary">LAVALINK_PASSWORD</td>
                    <td className="px-6 py-4">Password for Lavalink authentication</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">youshallnotpass</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-primary">API_KEY</td>
                    <td className="px-6 py-4">Secret key required for client requests</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">secret</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-primary">REDIS_URL</td>
                    <td className="px-6 py-4">Redis URL for queue state persistence</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">redis://localhost:6379</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <footer className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            Hecho por Blocker X
          </footer>

        </div>
      </main>
    </div>
  );
}
