FROM node:22-alpine AS build

WORKDIR /app

COPY ./package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM caddy:2-alpine

COPY --from=build /app/dist/frontend /app/dist/frontend
COPY frontend/Caddyfile /etc/caddy/Caddyfile


EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]