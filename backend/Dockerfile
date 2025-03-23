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

FROM node:23.9.0-alpine

WORKDIR /app

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Install production dependencies with retry mechanism
RUN --mount=type=cache,target=/root/.npm \
    npm config set registry https://registry.npmjs.org/ && \
    npm install --omit=dev --no-fund --no-audit

EXPOSE 3001

CMD ["npm", "start"] 