# Multi-stage Dockerfile for Render Deployment
# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN npm --prefix backend install --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend assets into the container
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose Render standard port
EXPOSE 10000

# Start Express server (serves API on /api and React frontend on /*)
CMD ["node", "backend/src/server.js"]
