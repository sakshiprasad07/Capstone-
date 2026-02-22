# Use official Node image for building
FROM node:18 AS builder

WORKDIR /app

# Copy frontend files
COPY . .

# If you have any build step, run it here
# RUN npm install && npm run build

# Use Nginx to serve static files
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy frontend files to nginx
COPY --from=builder /app /usr/share/nginx/html

EXPOSE 3000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
