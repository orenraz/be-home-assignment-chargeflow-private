# Use the official Bun image
FROM oven/bun:1.3.9

# Set the working directory
WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package.json bun.lockb ./

# Install dependencies explicitly
RUN bun install --production && ls node_modules/dotenv

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 3001

# Start the application
CMD ["bun", "run", "dev"]
