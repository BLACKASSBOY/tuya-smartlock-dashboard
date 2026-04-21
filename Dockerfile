FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

# Build without accessing environment variables
RUN pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./dist/public

EXPOSE 3000

CMD ["node", "dist/index.js"]
