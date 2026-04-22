FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
ARG VITE_APP_ID
ARG VITE_APP_LOGO
ARG VITE_APP_TITLE
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_FRONTEND_FORGE_API_URL
ENV VITE_APP_ID=$VITE_APP_ID
ENV VITE_APP_LOGO=$VITE_APP_LOGO
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL
ENV VITE_FRONTEND_FORGE_API_URL=$VITE_FRONTEND_FORGE_API_URL
RUN pnpm run build
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./dist/public
EXPOSE 3000
CMD ["node", "dist/index.js"]
