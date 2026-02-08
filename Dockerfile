FROM node:18-alpine

WORKDIR /app

# ======================
# Backend setup
# ======================
COPY backend ./backend
WORKDIR /app/backend
RUN npm install

# ======================
# Frontend setup
# ======================
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm install -g serve

# ======================
# Expose ports
# ======================
EXPOSE 2001 3001

# ======================
# Start both servers
# ======================
CMD sh -c "node backend/server.js & serve -s build -l 2001"
