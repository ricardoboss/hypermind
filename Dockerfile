FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ linux-headers

COPY package*.json ./

# Install dependencies and rebuild native modules
RUN npm install --production && npm rebuild

COPY server.js ./

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
