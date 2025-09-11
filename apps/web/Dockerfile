FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ui/package*.json ./packages/ui/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/web ./apps/web
COPY packages/ui ./packages/ui
COPY packages/types ./packages/types

# Build the application
WORKDIR /app/apps/web
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "preview"]
