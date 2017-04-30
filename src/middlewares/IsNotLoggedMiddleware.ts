import { Request, Response } from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers/driver/express/ExpressMiddlewareInterface';

export class IsNotLoggedMiddleware implements ExpressMiddlewareInterface {
    use(request: Request, response: Response, next: Function) {
        if (request.session.user) {
            return response.status(400).json({ message: 'You are already logged' });
        }
        next();
    }
}
