FROM node:22-slim

# LibreOffice deps (keep what you already have)
RUN apt-get update && \
    apt-get install -y \
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

# 👇 THIS IS THE KEY CHANGE
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend ./

RUN npm run build

EXPOSE 3003
CMD ["npm", "start"]
