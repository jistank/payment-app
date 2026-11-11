# Build stage: install dependencies and build the static bundle.
FROM docker.io/library/node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Empty VITE_API_URL = relative /api calls, proxied by nginx.
ARG VITE_API_URL=""
RUN VITE_API_URL="$VITE_API_URL" npm run build

# Runtime stage: nginx serves the bundle and proxies /api to the backend.
FROM docker.io/library/nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
