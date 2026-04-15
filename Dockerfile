# BriefStack - Railway Deployment
# Build context = prof-g/ root (one level above web/)

FROM node:22-alpine

# Python for image generation
RUN apk add --no-cache python3 py3-pip curl

WORKDIR /app

# Install web app deps
COPY web/package*.json ./web/
RUN cd web && npm install --production --ignore-scripts

# Install prof-g deps (for pdf-parse etc)
COPY package*.json ./
RUN npm install --production --ignore-scripts

# Copy all source
COPY . .

# Run from web dir
WORKDIR /app/web

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "--no-warnings", "server.js"]
