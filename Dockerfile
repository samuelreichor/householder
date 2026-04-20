FROM node:22-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DB_PATH=/data/householder.sqlite

RUN mkdir -p /data

COPY --from=builder /app/.output ./.output

# Run as root so we can write to Coolify's persistent volume at /data
# (named volumes mount as root:root and mask any chown done at build time).
# Acceptable for a self-hosted single-tenant app; revisit if threat model changes.
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
