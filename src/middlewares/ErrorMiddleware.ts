import {Middleware, ExpressErrorMiddlewareInterface} from 'routing-controllers';
import {Response, Request} from 'express';
import * as Boom from 'boom';

@Middleware({ type: 'after' })
export class ErrorMiddleware implements ExpressErrorMiddlewareInterface {
    error(error: Error, request: Request, response: Response, next: (err?: any) => any) {
        console.log('Error:');
        console.error(error.stack);
        response.statusCode = 500;
        response.json(Boom.internal().output.payload);
    }
}