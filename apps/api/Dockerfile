# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY . .

RUN pnpm --filter @fpos/shared build

# Replace workspace symlink with a real directory so TypeScript can resolve
# @fpos/shared during tsc. Docker COPY --from doesn't follow symlinks that
# point outside the copied source directory, leaving a dangling symlink.
RUN rm -rf apps/api/node_modules/@fpos/shared && \
    mkdir -p apps/api/node_modules/@fpos/shared && \
    cp packages/shared/package.json apps/api/node_modules/@fpos/shared/ && \
    cp -r packages/shared/dist apps/api/node_modules/@fpos/shared/

RUN pnpm --filter @fpos/api exec prisma generate
RUN pnpm --filter @fpos/api build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fpos

# Copy built artifacts
COPY --from=builder --chown=fpos:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=fpos:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=fpos:nodejs /app/config ./config

# Copy node_modules with Prisma generated client
COPY --from=builder --chown=fpos:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=fpos:nodejs /app/packages/shared/dist ./node_modules/@fpos/shared/dist
COPY --from=builder --chown=fpos:nodejs /app/packages/shared/package.json ./node_modules/@fpos/shared/package.json

# Copy Prisma engine binaries (critical for production)
COPY --from=builder --chown=fpos:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=fpos:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER fpos

EXPOSE 3001

ENV NODE_ENV=production
ENV API_PORT=3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
