FROM node:15.4.0-buster

WORKDIR /app

COPY package.json yarn.lock /app/

RUN mkdir /config \
 && yarn

CMD yarn ts-node src/app.ts