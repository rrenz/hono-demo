# hono-app/Dockerfile

# Use a lightweight Node.js image as the base
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install pnpm globally
# Using a separate layer for pnpm installation to leverage Docker's layer caching
FROM base AS pnpm_installer
RUN npm install -g pnpm@9.4.0

# Copy package.json and pnpm-lock.yaml for dependency installation
FROM pnpm_installer AS dependencies
COPY package.json ./
# If you have a pnpm-lock.yaml, uncomment the next line:
# COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod && pnpm install --prod

# Build the application
FROM pnpm_installer AS build
COPY package.json ./
# If you have a pnpm-lock.yaml, uncomment the next line:
# COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY src ./src
RUN pnpm install && pnpm run build

# Final stage: production image
FROM node:20-alpine AS production
WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "start"]
