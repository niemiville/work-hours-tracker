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

# Copy the build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 