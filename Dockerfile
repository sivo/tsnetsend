FROM node:15.4.0-buster as dev

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH NODE_ENV=development

COPY package.json yarn.lock /app/

RUN mkdir /config \
 && yarn

WORKDIR /app/tsnetsend
COPY . /app/tsnetsend/

CMD ts-node src/app.ts
