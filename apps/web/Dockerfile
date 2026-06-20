FROM node:22-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package.json package-lock.json turbo.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps/web ./apps/web
COPY apps/api/package.json ./apps/api/package.json

# Install dependencies
RUN npm ci

# Build the web application
WORKDIR /app
# We will use relative path or proxy for API so VITE_API_URL is just /api
ENV VITE_API_URL=/api
RUN npx turbo run build --filter=@nexacrm/web

# Production Nginx image
FROM nginx:alpine

# Copy Nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
