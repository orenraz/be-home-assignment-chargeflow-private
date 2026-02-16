# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Install TypeScript globally
RUN npm install -g typescript

# Copy the rest of the application, excluding node_modules and unnecessary files
COPY src ./src
COPY tsconfig.json ./

# Compile TypeScript to JavaScript
RUN tsc

# Start the application
CMD ["node", "dist/index.js"]
