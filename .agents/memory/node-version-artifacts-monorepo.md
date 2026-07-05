---
name: Node runtime version for artifacts monorepo
description: Discord Music API pnpm workspace requires Node 24, not the default nodejs-20 Replit module.
---

The `artifacts/api-server` package uses the global `WebSocket` constructor (via `shoukaku`/custom Lavalink client) without importing a polyfill. Global `WebSocket` is not available in Node 20, causing `ReferenceError: WebSocket is not defined` at runtime.

**Why:** `replit.md` documents the stack as "Node.js 24 + TypeScript", but the default `.replit` `modules` list still had `nodejs-20`. Only surfaced when actually starting the api-server workflow, not at install/build time.

**How to apply:** If this project's api-server workflow throws `WebSocket is not defined`, install the `nodejs-24` module (`installProgrammingLanguage`) — don't try to polyfill or downgrade the code.
