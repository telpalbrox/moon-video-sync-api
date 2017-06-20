FROM node:8

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

RUN npm run build

ARG MOON_VIDEO_SYNC_PORT=3000
EXPOSE $MOON_VIDEO_SYNC_PORT
CMD ["npm", "start"]