FROM node:22-slim

# Install LibreOffice + required runtime deps
RUN apt-get update && \
    apt-get install -y \
      libreoffice \
      libreoffice-writer \
      fontconfig \
      fonts-dejavu \
      fonts-liberation \
      fonts-freefont-ttf \
      libxinerama1 \
      libxrandr2 \
      libxrender1 \
      libxt6 \
      libgtk-3-0 \
      libdbus-glib-1-2 \
      default-jre \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend deps (incl dev for tsc)
RUN cd backend && npm install --include=dev

# Copy backend source
COPY backend ./backend

# Build backend
RUN cd backend && npm run build

EXPOSE 3003

CMD ["node", "backend/dist/index.js"]
