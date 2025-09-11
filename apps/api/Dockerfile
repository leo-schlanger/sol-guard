FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY apps/api ./apps/api
COPY packages/types ./packages/types

# Build the application
WORKDIR /app/apps/api
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
