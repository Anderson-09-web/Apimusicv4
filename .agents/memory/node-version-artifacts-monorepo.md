---
name: Node runtime version for artifacts monorepo
description: Discord Music API pnpm workspace requires Node 24 (global WebSocket API), not the default nodejs-20 module. Also covers Docker Alpine vs glibc rollup issue.
---

The `artifacts/api-server` package uses the global `WebSocket` constructor without importing a polyfill. Global `WebSocket` is not available in Node 20, causing `ReferenceError: WebSocket is not defined` at runtime.

**Why:** `replit.md` documents the stack as "Node.js 24 + TypeScript", but the default `.replit` `modules` list had `nodejs-20`.

**How to apply:** If this project's api-server workflow throws `WebSocket is not defined`, install the `nodejs-24` module (`installProgrammingLanguage`) — don't try to polyfill or downgrade the code.

---

## Docker Alpine vs glibc rollup issue

**Problem:** `Cannot find module '@rollup/rollup-linux-x64-musl'` when building docs in Docker.

**Root cause:** The pnpm lockfile was generated on a glibc system (linux-x64-gnu). When Docker uses Alpine (musl libc), rollup tries to load the musl native binary which isn't in the lockfile.

**Fix:** In `Dockerfile`, change the build-stage base image from `node:24-alpine` to `node:24-slim` (debian/glibc). The production runner stage can stay on Alpine since it only runs the pre-compiled Node server (no rollup).

```dockerfile
FROM node:24-slim AS base  # build stages: debian/glibc → rollup finds gnu binary in lockfile
FROM node:24-alpine AS runner  # production: Alpine, small image, no rollup needed
```

---

## API Server Replit workflow port detection

The `WorkflowsRestart` tool consistently times out with "didn't open port 8080" even though the server starts correctly (verified with curl returning 200). This is a platform-side detection quirk for console workflows on port 8080. The server itself runs fine — start it via the Replit Run button instead of relying on WorkflowsRestart success.
