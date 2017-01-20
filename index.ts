import 'reflect-metadata';
import { useExpressServer } from 'routing-controllers';
import { Application } from 'express';
import * as express from 'express';
import * as session from 'express-session';

const app = express();

app.use(session({
    secret: 'randomsecretcat',
    resave: true,
    saveUninitialized: false,
}));

useExpressServer(app, {
    controllers: [ __dirname + '/controllers/*.js' ],
    useClassTransformer: true
});

app.listen(3000, () => {
    console.log('Listening on 3000...');
});
