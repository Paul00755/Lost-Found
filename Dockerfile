FROM node:18-alpine

WORKDIR /app

# Copy only dependency files first (for caching)
COPY package.json package-lock.json ./

RUN npm ci

# Copy rest of the source
COPY . .

# Build the React app
RUN npm run build

