# Stage 1: Dependencies
# .npmrc sets node-linker=hoisted → all packages installed flat in root node_modules
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable pnpm

# Copy workspace root files (including .npmrc for hoisted linker)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm

# With hoisted linker, all packages are in root node_modules (real dirs, not symlinks)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.npmrc ./

COPY . .

# Build @fpos/shared first so its dist/ files are available
RUN pnpm --filter @fpos/shared build

# Promote @fpos/shared to root node_modules as a real directory
# (workspace symlink in apps/api/node_modules is dangling across Docker COPY stages)
RUN rm -rf node_modules/@fpos 2>/dev/null || true && \
    mkdir -p node_modules/@fpos/shared && \
    cp packages/shared/package.json node_modules/@fpos/shared/ && \
    cp -r packages/shared/dist node_modules/@fpos/shared/ && \
    echo "=== @fpos/shared promoted ===" && \
    ls node_modules/@fpos/shared/dist/

# Generate Prisma client (goes to root node_modules/@prisma/client — real dir with hoisted)
RUN pnpm --filter @fpos/api exec prisma generate

# Build API — tsc finds @fpos/shared at root node_modules/@fpos/shared/dist/index.d.ts
RUN pnpm --filter @fpos/api build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fpos

# Copy API build artifacts
COPY --from=builder --chown=fpos:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=fpos:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=fpos:nodejs /app/config ./config

# Copy root node_modules — with hoisted linker these are all real directories:
#   @prisma/client (with generated query engine from prisma generate)
#   @fpos/shared (with dist files we promoted above)
#   fastify, zod, etc. (all production deps)
COPY --from=builder --chown=fpos:nodejs /app/node_modules ./node_modules

USER fpos

EXPOSE 3001

ENV NODE_ENV=production
ENV API_PORT=3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
