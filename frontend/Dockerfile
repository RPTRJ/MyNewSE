# ==============================================================================
# Frontend Dockerfile - Next.js Application
# ==============================================================================

FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ==============================================================================
# Builder
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# API URL for backend requests
ARG NEXT_PUBLIC_API_URL=http://sutportfolio.online/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# ===== FIX: เพิ่ม WebSocket URL =====
# WebSocket URL สำหรับ real-time notifications
# ใช้ wss:// สำหรับ production (HTTPS), ws:// สำหรับ development (HTTP)
ARG NEXT_PUBLIC_WS_URL=wss://sutportfolio.online/api/ws
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

RUN npm run build

# ==============================================================================
# Production Image
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]