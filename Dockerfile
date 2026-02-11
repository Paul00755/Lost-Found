FROM node:18-alpine

WORKDIR /app

# Backend
COPY backend ./backend
WORKDIR /app/backend
RUN npm install

# Frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Expose ONLY backend port
EXPOSE 3001

CMD ["node", "backend/server.js"]
