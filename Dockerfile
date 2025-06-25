# Build stage
FROM --platform=linux/amd64 node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM --platform=linux/amd64 node:20-slim

WORKDIR /app
RUN npm install -g serve

# Copy built files from build stage
COPY --from=build /app/dist ./dist

EXPOSE 8080
ENV PORT=8080

# Start the server on the correct port
CMD ["serve", "-s", "dist", "-l", "8080"]