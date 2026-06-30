FROM node:20-alpine AS build

# Cache-bust: bump on demand to force Railway to rebuild from scratch
# when the layer cache is producing failed builds. The value isn't read
# anywhere — its only purpose is to change the layer hash.
ARG CACHEBUST=2026-06-30-1920

WORKDIR /app
# Alpine + npm occasionally needs a kick on slow Railway builders.
# fetch-retries / network-timeout keep `npm ci` from giving up on the
# first 5xx from registry.npmjs.org during the heavy install of Privy
# + ethers + three. Without these, a single transient blip used to fail
# the entire build in ~15s.
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 600000
COPY package*.json .npmrc ./
RUN npm ci --prefer-offline --no-audit --no-fund \
 && npm install @rollup/rollup-linux-x64-musl --no-save --no-audit --no-fund
COPY . .

# Vite needs these at build time for client bundle
ARG VITE_PRIVY_APP_ID
ARG VITE_PRIVY_CLIENT_ID
ARG VITE_TREASURY_ADDRESS
ARG VITE_OG_CHAIN_ID
ARG VITE_OG_RPC_URL
ENV VITE_PRIVY_APP_ID=$VITE_PRIVY_APP_ID
ENV VITE_PRIVY_CLIENT_ID=$VITE_PRIVY_CLIENT_ID
ENV VITE_TREASURY_ADDRESS=$VITE_TREASURY_ADDRESS
ENV VITE_OG_CHAIN_ID=$VITE_OG_CHAIN_ID
ENV VITE_OG_RPC_URL=$VITE_OG_RPC_URL

RUN npm run build

FROM node:20-alpine

WORKDIR /app
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 600000
COPY package*.json .npmrc ./
RUN npm ci --omit=dev --prefer-offline --no-audit --no-fund
COPY --from=build /app/dist ./dist
COPY src ./src
COPY docs ./docs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/server/index.js"]
