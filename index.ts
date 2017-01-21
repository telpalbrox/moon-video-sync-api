import 'reflect-metadata';
import { useExpressServer, useContainer } from 'routing-controllers';
import { Application } from 'express';
import * as express from 'express';
import * as session from 'express-session';
import { Container } from 'typedi';
import { createConnection, Connection } from 'typeorm';
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();

app.use(session({
    store: new SQLiteStore({
        db: 'db.sqlite'
    }),
    secret: 'randomsecretcat',
    resave: true,
    saveUninitialized: false,
}));

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
}).then((connection) => {
    console.log('Connected to the database');
    Container.provide([
        { type: Connection, value: connection }
    ]);
    useExpressServer(app, {
        controllers: [ __dirname + '/controllers/*.js' ],
        useClassTransformer: true
    });
    app.listen(3000, () => console.log('Listening on 3000...'));
}).catch((error) => {
    console.error('Can\'t connect to the database');
    console.error(error);
});
