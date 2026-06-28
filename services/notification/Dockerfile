FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --production

FROM node:22-bookworm-slim
WORKDIR /app

RUN addgroup --system appgroup \
  && adduser --system --ingroup appgroup appuser

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', r => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

CMD ["node", "src/server.js"]
