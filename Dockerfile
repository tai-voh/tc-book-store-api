FROM node:16.6.0-alpine as builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY src src
RUN  npm ci && npm run build

FROM node:16.6.0-alpine
WORKDIR /app
COPY ["package*.json", ".env", "./"]
RUN npm install --production
COPY --from=builder /app/dist/ dist/
EXPOSE 3000
CMD [ "node", "dist/app.js" ]