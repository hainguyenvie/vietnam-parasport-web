# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client and build the NestJS application
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install ONLY production dependencies to keep the image small
RUN npm ci --only=production

# Generate Prisma client (required for production environment)
RUN npx prisma generate

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Ensure uploads directory exists (assuming it's managed via volumes in prod, but safe to create)
RUN mkdir -p uploads

# Expose the application port
EXPOSE 3001

# Command to run the application
CMD ["node", "dist/main"]
