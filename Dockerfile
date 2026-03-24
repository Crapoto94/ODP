FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci

# Build the mobile app
FROM node:20-bookworm-slim AS mobile-builder
WORKDIR /app
COPY mobile/package.json mobile/package-lock.json ./
RUN npm ci
COPY mobile/ ./
RUN npm run build

# Rebuild the source code only when needed
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install serve to run the mobile app
RUN npm install -g serve

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

COPY --from=mobile-builder /app/dist /app/mobile-dist
COPY start.sh ./
RUN chmod +x start.sh
RUN chown -R nextjs:nodejs /app/mobile-dist start.sh

USER nextjs

EXPOSE 3000
EXPOSE 5000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["./start.sh"]
