# Use official Node image
FROM node:18

# Create app directory inside container
WORKDIR /app

# Copy package.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]