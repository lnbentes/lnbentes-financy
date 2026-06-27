# Stage 1: Build the React frontend
FROM node:20-alpine AS build-stage
WORKDIR /app

# Copy package files and install dependencies
COPY front-react/package*.json ./
RUN npm ci

# Copy React project files and build
COPY front-react/ ./
RUN npm run build

# Stage 2: Serve React frontend using Nginx
FROM nginx:1.25-alpine

# Copy Nginx server configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build files from build-stage to Nginx public folder
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
