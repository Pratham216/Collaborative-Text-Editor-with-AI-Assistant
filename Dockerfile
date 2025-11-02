# Multi-stage build for production

# Stage 1: Build React app
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Build server
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production
COPY server/ .

# Stage 3: Production
FROM node:18-alpine
WORKDIR /app

# Copy server files
COPY --from=server-build /app/server ./server

# Copy built React app to server public directory
COPY --from=client-build /app/client/build ./server/public

# Install PM2 for process management
RUN npm install -g pm2

WORKDIR /app/server

EXPOSE 5000

CMD ["pm2-runtime", "start", "server.js", "--name", "collaborative-editor"]

