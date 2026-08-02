FROM node:22-alpine

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
# vite.config.ts binds host 0.0.0.0:3000 and reads GEMINI_API_KEY from the environment
CMD ["npm", "run", "dev"]
