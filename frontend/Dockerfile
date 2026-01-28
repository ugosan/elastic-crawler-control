FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install

COPY . .

ARG REACT_APP_ES_API=/api
ENV REACT_APP_ES_API=${REACT_APP_ES_API}

RUN yarn build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 16700

CMD ["nginx", "-g", "daemon off;"]
