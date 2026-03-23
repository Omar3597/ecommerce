# ==========================================
#              Stage 1: Base 
# ==========================================
FROM node:24-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# ==========================================
#           Stage 2: Development
# ==========================================
FROM base AS development

RUN npm install

RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate dev --name init && npm run dev"]

# ==========================================
#             Stage 3: Builder
# ==========================================
FROM base AS builder

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --omit=dev && npm cache clean --force

RUN npx prisma generate

# ==========================================
#       Stage 4: Production Runner 
# ==========================================
FROM node:24-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

RUN addgroup -S app && adduser -S app -G app

COPY --chown=app:app --from=builder /app/package*.json ./
COPY --chown=app:app --from=builder /app/node_modules ./node_modules
COPY --chown=app:app --from=builder /app/prisma ./prisma
COPY --chown=app:app --from=builder /app/dist ./dist


RUN chown -R app:app /app

USER app

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]


