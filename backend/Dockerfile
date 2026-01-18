FROM node:22-slim

RUN apt-get update && \
    apt-get install -y \
      libreoffice-core \
      libreoffice-writer \
      libreoffice-common \
      libreoffice-core-nogui \
      fontconfig \
      fonts-dejavu \
      fonts-liberation \
      libxinerama1 \
      libxrandr2 \
      libxrender1 \
      libxt6 \
      libgtk-3-0 \
      libdbus-glib-1-2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Important: writable HOME for LibreOffice
ENV HOME=/tmp

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --include=dev

COPY backend ./backend
RUN cd backend && npm run build

EXPOSE 3003
CMD ["node", "backend/dist/index.js"]
