FROM node:15.4.0-buster

WORKDIR /app

COPY package.json /app/

RUN mkdir /config \
 && yarn

CMD ts-node app.js