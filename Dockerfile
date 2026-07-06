FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# ─── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc* ./
COPY tsconfig.base.json tsconfig.json ./
COPY lib/api-spec/package.json lib/api-spec/
COPY lib/api-zod/package.json lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/db/package.json lib/db/
COPY scripts/package.json scripts/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/music-api-docs/package.json artifacts/music-api-docs/
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/
RUN pnpm install --frozen-lockfile

# ─── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
# Build docs first (served as static files by the API server)
RUN BASE_PATH=/ pnpm --filter @workspace/music-api-docs run build
# Build API server
RUN pnpm --filter @workspace/api-server run build

# ─── Production image ──────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Path where the API server looks for static documentation files
ENV STATIC_DIR=/app/docs

# API server build output
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Docs build output (served as static files in production)
COPY --from=builder /app/artifacts/music-api-docs/dist/public ./docs

EXPOSE 5000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
