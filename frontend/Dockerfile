# ============================================
# STAGE 1: Build do React
# ============================================
FROM node:18-alpine AS build

WORKDIR /app

ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# ============================================
# STAGE 2: Servir com Nginx
# ============================================
FROM nginx:alpine

RUN apk add --no-cache curl

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
