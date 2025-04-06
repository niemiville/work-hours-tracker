FROM node:23.9.0-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with retry mechanism
RUN --mount=type=cache,target=/root/.npm \
    npm config set registry https://registry.npmjs.org/ && \
    npm install --no-fund --no-audit

# Copy source code
COPY . .

# Build the application
RUN npm run build

FROM nginx:alpine

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl

# Create directory for SSL certificates
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed certificate with minimal information
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt \
    -subj "/CN=localhost"

# Copy the build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"] 