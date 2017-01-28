import { Middleware } from 'routing-controllers';
import { Request, Response } from 'express';

@Middleware()
export class IsNotLoggedMiddleware {
    use(request: Request, response: Response, next: Function) {
        if (request.session.user) {
            return response.status(400).json({ message: 'You are already logged' });
        }
        next();
    }
}
