FROM node:22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Copy root configurations
COPY package.json package-lock.json turbo.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies
RUN npm ci

# Generate prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the api
WORKDIR /app
RUN npx turbo run build --filter=@nexacrm/api

# Production image
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl
ENV NODE_ENV production

# Copy from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["npm", "run", "start"]
