# --- BUILD STAGE ---
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies separately for caching
COPY package*.json ./
RUN npm install

# Copy source and build the Vite project
COPY . .
ARG VITE_GOOGLE_MAPS_KEY
ENV VITE_GOOGLE_MAPS_KEY=$VITE_GOOGLE_MAPS_KEY
RUN npm run build

# --- PRODUCTION STAGE ---
FROM node:20-slim
WORKDIR /app

# Copy built assets and the custom server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm install --production

# Expose the dashboard port
EXPOSE 8080

# Environment defaults
ENV PORT=8080
ENV NODE_ENV=production

# Start the dashboard via our custom node server
CMD ["node", "server.js"]
