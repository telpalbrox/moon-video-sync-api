# Moon Video Sync API

[![Build Status](https://travis-ci.org/telpalbrox/moon-video-sync-api.svg?branch=master)](https://travis-ci.org/telpalbrox/moon-video-sync-api)

Small API for sync youtube videos built with Node and typescript

## Environment variables

`NODE_ENV`: if this variable is set to `production` sessions will be stored in redis and it will use the database options from the env variable `DATABASE_URL`.

`ALLOWED_ORIGINS`: a list containing all the urls separed by , where the front is hosted. This variable is needed in order to
allow CORS. If is not set default value is `http://localhost:4200`.

`GOOGLE_KEY`: This variable has to store a valid google key, it is used for get youtube video information.

`REDIS_URL`: Redis server URL. Redis will be used if `NODE_ENV` is `production` to store sessions. Example: `redis://user:password@localhost:6979`

`DATABASE_URL`: Database server URL. It will be used if `NODE_ENV` is `production`. Example: `postgres://user:password@localhost:5432/db`

`COOKIE_SECRET`: Secret for encrypted cookies

`PORT`: Port that the API will use.
