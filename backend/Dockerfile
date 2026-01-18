FROM node:22-slim

RUN apt-get update && \
    apt-get install -y \
      libreoffice-core-nogui \
      libreoffice-common \
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


WORKDIR /app

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

COPY backend ./backend
RUN npm run build

EXPOSE 3003
CMD ["npm", "start"]