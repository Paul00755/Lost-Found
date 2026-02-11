FROM node:18-alpine

# ----------------------------
# Set root working directory
# ----------------------------
WORKDIR /app

# ----------------------------
# Copy entire project
# ----------------------------
COPY . .

# ----------------------------
# Install backend dependencies
# ----------------------------
WORKDIR /app/backend
RUN npm install --production

# ----------------------------
# Install frontend dependencies
# ----------------------------
WORKDIR /app
RUN npm ci

# ----------------------------
# Build React frontend
# ----------------------------
RUN npm run build

# ----------------------------
# Expose backend port (Express)
# ----------------------------
EXPOSE 3001

# ----------------------------
# Start full-stack server
# ----------------------------
CMD ["node", "backend/server.js"]
