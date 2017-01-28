console.log('-----App started-----');

import 'reflect-metadata';
import { useExpressServer, useContainer } from 'routing-controllers';
import * as express from 'express';
import * as session from 'express-session';
import { Container } from 'typedi';
import { createConnection, Connection } from 'typeorm';
import * as cors from 'cors';
import * as socketIO from 'socket.io';
import { createServer } from 'http';
const SQLiteStore = require('connect-sqlite3')(session);

import { User } from './entities/User';
import { Room } from './entities/Room';
import { useIoServer } from './sockets';

const app = express();
const server = createServer(app);

const sessionMiddleware = session({
    store: new SQLiteStore({
        db: 'db.sqlite'
    }),
    secret: 'randomsecretcat',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 100 // one week
    }
});

app.use(cors({
    credentials: true,
    origin: ['http://localhost:4200']
}));
app.use(sessionMiddleware);

require('./sockets/RoomSocketController');

const io = socketIO(server);
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
});

useIoServer(io);

useContainer(Container);

createConnection({
    driver: {
        type: 'sqlite',
        storage: 'db.sqlite.db'
    },
    autoSchemaSync: true,
    entities: [
        __dirname + '/entities/*.js'
    ]
}).then(async (connection) => {
    console.log('Connected to the database');
    Container.provide([
        { name: 'io', value: io },
        { type: Connection, value: connection },
        { name: 'UserRepository', value: connection.getRepository(User) },
        { name: 'RoomRepository', value: connection.getRepository(Room) }
    ]);
    useExpressServer(app, {
        controllers: [ __dirname + '/controllers/*.js' ],
        middlewares: [ __dirname + '/middlewares/*.js' ],
        useClassTransformer: true
    });
    server.listen(process.env.PORT || 3000, () => console.log('Listening on 3000...'));
}).catch((error) => {
    console.error('Can\'t connect to the database');
    console.error(error);
});
