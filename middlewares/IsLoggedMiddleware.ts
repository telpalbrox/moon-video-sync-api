import { Middleware, MiddlewareInterface } from 'routing-controllers';
import { Repository } from 'typeorm';
import { Inject } from 'typedi';
import { Request, Response } from 'express';
import { User } from '../entities/User';

@Middleware()
export class IsLoggedMiddleware {
    @Inject('UserRepository')
    userRepository: Repository<User>;

    async use(request: Request, response: Response, next: Function) {
        if (!request.session.user) {
            return response.status(401).json({ message: 'You are not logged' });
        }
        request.user = await this.userRepository.findOne({ email: request.session.user.email });
        next();
    }
}
