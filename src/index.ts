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
import { Video } from './entities/Video';
import { roomRepositoryFactory } from './services/RoomRepository';
import { YoutubeService } from './services/YoutubeService';
import { SocketService } from './services/SocketService';
import { ConnectionOptions } from 'typeorm/connection/ConnectionOptions';

const app = express();
const server = createServer(app);

let sessionStore;
let typeORMConfig: ConnectionOptions;

if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL || !process.env.REDIS_URL) {
        throw new Error('Please configure DATABASE_URL and REDIS_URL environment variables');
    }
    const dbConfig = parseDbUrl(process.env.DATABASE_URL);
    const RedisStore = require('connect-redis')(session);
    sessionStore = new RedisStore({
        url: process.env.REDIS_URL
    });
    typeORMConfig = {
        type: dbConfig.driver,
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        synchronize: true,
        migrationsRun: true,
        entities: [
            __dirname + '/entities/*.js'
        ]
    };
} else {
    const SQLiteStore = require('connect-sqlite3')(session);
    const databaseFileName = process.env.NODE_ENV === 'test' ? 'db.test.sqlite' : 'db.sqlite';
    sessionStore = new SQLiteStore({
        db: databaseFileName
    });
    typeORMConfig = {
        type: 'sqlite',
        database: `${databaseFileName}.db`,
        migrationsRun: true,
        synchronize: true,
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
    if (!socket.request.res) {
        return next();
    }
    sessionMiddleware(socket.request, socket.request.res, next);
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
    startUpAPI().then(() => console.log(`Server listening on: ${PORT}`)).catch((err) => console.error(err));
}

export async function startUpAPI() {
    const connection = await createConnection(typeORMConfig);
    console.log('Connected to the database');
    Container.provide([
        { id: 'io', value: io },
        { id: Connection, value: connection },
        { id: 'UserRepository', value: connection.getRepository(User) },
        { id: 'RoomRepository', value: roomRepositoryFactory(connection) },
        { id: 'VideoRepository', value: connection.getRepository(Video) },
        { id: YoutubeService, value: new YoutubeService() },
        { id: SocketService, value: new SocketService() }
    ]);

    useContainer(Container);

    useExpressServer(app, {
        controllers: [__dirname + '/controllers/*.js'],
        middlewares: [__dirname + '/middlewares/*.js'],
        classTransformer: true,
        defaultErrorHandler: false
    });
    require('./sockets/RoomSocketController');
    useIoServer(io);
    await startExpressServer();
    return app;
}

function startExpressServer() {
    return new Promise((resolve) => {
        server.listen(PORT, () => resolve());
    });
}
