# ==========================================
#              Stage 1: Base
# ==========================================
FROM node:24-alpine AS base

WORKDIR /app

# openssl is required by Prisma on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# ==========================================
#           Stage 2: Development
# ==========================================
FROM base AS development

RUN npm install

RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate dev --name init && npm run dev"]

# ==========================================
#             Stage 3: Builder
# ==========================================
FROM base AS builder

# Install ALL deps (including devDeps for tsc)
RUN npm ci

COPY . .

RUN npm run build

# Strip devDependencies AFTER build; keeps node_modules lean
RUN npm prune --omit=dev && npm cache clean --force

# Regenerate Prisma client against the pruned modules
RUN npx prisma generate

# ==========================================
#       Stage 4: Production Runner
# ==========================================
FROM node:24-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

# Create non-root user BEFORE copying files so chown is correct
RUN addgroup -S app && adduser -S app -G app

# Copy artefacts from builder with correct ownership in one layer
COPY --chown=app:app --from=builder /app/package*.json ./
COPY --chown=app:app --from=builder /app/node_modules  ./node_modules
COPY --chown=app:app --from=builder /app/prisma        ./prisma
COPY --chown=app:app --from=builder /app/dist          ./dist

USER app

# ---------------------------------------------------------------------------
# PROCESS_TYPE is set at docker build time by the CD pipeline:
#   --build-arg PROCESS_TYPE=web    → runs migrations then starts the API
#   --build-arg PROCESS_TYPE=worker → starts the BullMQ worker process
#
# Heroku injects $PORT at runtime. server.ts already reads process.env.PORT,
# so we never hard-code a port here. EXPOSE is documentation-only on Heroku.
# ---------------------------------------------------------------------------
ARG PROCESS_TYPE=web

ENV PROCESS_TYPE=${PROCESS_TYPE}

# The shell form lets us evaluate $PROCESS_TYPE at container start-up.
# Migrations run only for the 'web' dyno, keeping the worker lightweight.
CMD if [ "$PROCESS_TYPE" = "worker" ]; then \
      node dist/workers/worker.server.js; \
    else \
      npx prisma migrate deploy && node dist/server.js; \
    fi
