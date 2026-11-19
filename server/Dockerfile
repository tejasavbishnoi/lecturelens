# LectureLens API: production image
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

# Install dependencies first so Docker can cache this layer
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the rest of the server code
COPY . .

# Run as the built-in non-root user
USER node

EXPOSE 5001

# Docker marks the container unhealthy if /api/health stops answering
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT}/api/health" || exit 1

CMD ["node", "index.js"]
