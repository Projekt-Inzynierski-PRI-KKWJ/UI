FROM node:latest AS builder
WORKDIR /app

COPY package.json .

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM nginx:latest
ARG NGINX_CONF
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/pri /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
