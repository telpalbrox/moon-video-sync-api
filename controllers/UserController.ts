import { JsonController, Get, Req, Res, Session } from 'routing-controllers';
import { Request, Response, Express } from 'express';
import { Inject } from 'typedi';
import { CustomSession } from '../interfaces';
import { UserRepository } from '../services/UserRepository';

@JsonController()
export class UserController {
    @Inject()
    private userRepository: UserRepository

    @Get('/users')
    getUsers(@Req() request: Request, @Res() response: Response, @Session() session: Express.Session) {
        if (!session.user || !session.user.password || !session.user.user) {
            return response.status(401).json({ code: 401 });
        }
        return this.userRepository.getAll();
    }
}
