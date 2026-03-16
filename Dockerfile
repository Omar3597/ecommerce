# ---------- STAGE 1: Builder ----------
FROM node:24-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/ 
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && npx tsx src/server.ts"]