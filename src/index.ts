import 'reflect-metadata';
import { useExpressServer, useContainer } from 'routing-controllers';
import * as express from 'express';
import * as session from 'express-session';
import { Container } from 'typedi';
import { createConnection, Connection } from 'typeorm';
import * as cors from 'cors';
import * as socketIO from 'socket.io';
import { createServer } from 'http';
import * as parseDbUrl from 'parse-database-url';
import { User } from './entities/User';
import { useIoServer } from './sockets';
import {Video} from './entities/Video';
import {roomRepositoryFactory} from './services/RoomRepository';

const app = express();
const server = createServer(app);

let sessionStore;
let typeORMConfig;

if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL || process.env.REDIS_URL) {
        throw new Error('Please configure DATABASE_URL and REDIS_URL environment variables');
    }
    const dbConfig = parseDbUrl(process.env.DATABASE_URL);
    const RedisStore = require('connect-redis')(session);
    sessionStore = new RedisStore({
        url: process.env.REDIS_URL
    });
    typeORMConfig = {
        driver: {
            type: dbConfig.driver,
            host: dbConfig.host,
            port: dbConfig.port,
            username: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database
        },
        autoSchemaSync: true,
        entities: [
            __dirname + '/entities/*.js'
        ]
    };
} else {
    const SQLiteStore = require('connect-sqlite3')(session);
    const databaseFileName = process.env.NODE_ENV === 'TEST' ? 'db.test.sqlite' : 'db.sqlite';
    sessionStore = new SQLiteStore({
        db: databaseFileName
    });
    typeORMConfig = {
        driver: {
            type: 'sqlite',
            storage: `${databaseFileName}.db`
        },
        autoSchemaSync: true,
        entities: [
            __dirname + '/entities/*.js'
        ]
    };
}

const sessionMiddleware = session({
    store: sessionStore,
    secret: process.env.COOKIE_SECRET || 'randomsecretcat',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 100 // one week
    }
});

const origin = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:4200'];

app.use(cors({
    credentials: true,
    origin
}));
app.use(sessionMiddleware);

const io = socketIO(server);
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
});

useContainer(Container);

if (process.env.NODE_ENV !== 'TEST') {
    startUpAPI().then(() => console.log(`Server listening on: ${process.env.PORT || 3000}`));
}

export async function startUpAPI() {
    const connection = await createConnection(typeORMConfig);
    console.log('Connected to the database');
    Container.provide([
        { name: 'io', value: io },
        { type: Connection, value: connection },
        { name: 'UserRepository', value: connection.getRepository(User) },
        { name: 'RoomRepository', value: roomRepositoryFactory(connection) },
        { name: 'VideoRepository', value: connection.getRepository(Video) }
    ]);
    useExpressServer(app, {
        controllers: [ __dirname + '/controllers/*.js' ],
        middlewares: [ __dirname + '/middlewares/*.js' ],
        useClassTransformer: true
    });
    require('./sockets/RoomSocketController');
    useIoServer(io);
    await startExpressServer();
    return app;
}

function startExpressServer() {
    return new Promise((resolve) => {
        server.listen(process.env.PORT || 3000, () => resolve());
    });
}
