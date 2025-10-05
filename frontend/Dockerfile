# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy package.json and lock files first
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies using bun
RUN bun install

# Copy the rest of the project files
COPY . .

# Default command will run tests.
# The project currently has no test script, but this sets it up for when tests are added.
CMD ["bun", "test"]
