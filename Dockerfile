# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

WORKDIR /app

# Install Backend dependencies
COPY Backend/package*.json ./Backend/
RUN cd Backend && npm ci --omit=dev

# Copy source code
COPY Backend/ ./Backend/
COPY Frontend/ ./Frontend/

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "Backend/server.js"]
