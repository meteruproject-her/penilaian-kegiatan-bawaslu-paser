# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies) for the build process
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Run the build script (compiles client React app and server.ts to dist/)
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files to install production dependencies
COPY package*.json ./

# Install only production-needed dependencies to reduce image size
RUN npm ci --omit=dev

# Copy the compiled production output (the client code and compiled server.cjs)
COPY --from=builder /app/dist ./dist

# Expose the port that the application runs on
EXPOSE 3000

# Start the Express server
CMD ["node", "dist/server.cjs"]
