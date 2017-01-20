import 'reflect-metadata';
import { useExpressServer, useContainer } from 'routing-controllers';
import { Application } from 'express';
import * as express from 'express';
import * as session from 'express-session';
import { Container } from 'typedi';

const app = express();

app.use(session({
    secret: 'randomsecretcat',
    resave: true,
    saveUninitialized: false,
}));

useContainer(Container);
useExpressServer(app, {
    controllers: [ __dirname + '/controllers/*.js' ],
    useClassTransformer: true
});

app.listen(3000, () => {
    console.log('Listening on 3000...');
});
