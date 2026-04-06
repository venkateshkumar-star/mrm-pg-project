# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project source
COPY . .

# Build Vite app
RUN npm run build


# ---------- Production Stage ----------
FROM nginx:stable-alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy built Vite output
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose web port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
