# Start from the official Puppeteer Docker image which includes Chromium
FROM ghcr.io/puppeteer/puppeteer:23.11.1

# The base image already has Chromium installed and Puppeteer configured to use it.
# You likely don't need to explicitly set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD or
# PUPPETEER_EXECUTABLE_PATH unless you're trying to use a different Chrome binary.
# If you are encountering issues, you can keep them, but try without them first.
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
#     PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

ENV MONGO_URI=mongodb://localhost:27017/crime-reporter

# Set the working directory for your application
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy the rest of your application code
COPY . .

# Run your build script (if any, for TypeScript, etc.)
RUN npm run build

# Command to run your Express API
# Ensure 'dist/src/index.js' is the correct path after your build step
CMD [ "node", "dist/src/index.js" ]

# Note: The Puppeteer base image is usually configured to run as a non-root user by default,
# which is good for security. If you added 'USER root' earlier, ensure you switch back
# to a non-root user if you prefer, or the default user of the base image.
# For example, if the base image uses 'pptruser':
# USER pptruser