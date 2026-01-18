FROM node:22-slim

# Install LibreOffice
RUN apt-get update && \
    apt-get install -y libreoffice libreoffice-writer && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install dependencies (including dev, needed for tsc)
RUN cd backend && npm install --include=dev

# Copy backend source
COPY backend ./backend

# Build TypeScript
RUN cd backend && npm run build

# Expose port Render will assign
EXPOSE 3003

# Start backend
CMD ["node", "backend/dist/index.js"]
