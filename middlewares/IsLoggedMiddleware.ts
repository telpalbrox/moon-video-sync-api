import { Middleware, MiddlewareInterface } from 'routing-controllers';
import { Request, Response } from 'express';

@Middleware()
export class IsLoggedMiddleware {
    use(request: Request, response: Response, next: Function) {
        if (!request.session.user) {
            return response.status(401).json({ message: 'You are not logged' });
        }
        next();
    }
}
