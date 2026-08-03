# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim@sha256:235600a8101ab264e117b1768e925532262668dc9b581ef1dd7d96ced463b8e7 AS dependencies

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts && \
    npm cache clean --force

FROM dependencies AS builder

ARG NEXT_PUBLIC_API_BASE
ENV NODE_ENV=production \
    NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

COPY . .
RUN npm run validate:api-base && npm run build

FROM node:24-bookworm-slim@sha256:235600a8101ab264e117b1768e925532262668dc9b581ef1dd7d96ced463b8e7 AS runtime

ARG RELEASE_REVISION=unknown
ARG NEXT_PUBLIC_API_BASE
LABEL org.opencontainers.image.revision="${RELEASE_REVISION}" \
      io.sanduai.frontend.api-base="${NEXT_PUBLIC_API_BASE}"

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=4 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/login').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "server.js"]
