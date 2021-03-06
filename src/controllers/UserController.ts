import { JsonController, Get, Res, Session, UseBefore } from 'routing-controllers';
import { Response, Express } from 'express';
import { Inject } from 'typedi';
import { Connection } from 'typeorm';
import { User } from '../entities/User';
import { IsLoggedMiddleware } from '../middlewares/IsLoggedMiddleware';

@JsonController()
@UseBefore(IsLoggedMiddleware)
export class UserController {
    @Inject()
    private connection: Connection;

    @Get('/users')
    async getUsers(@Res() response: Response, @Session() session: Express.Session) {
        if (!session.user) {
            response.statusCode = 401;
            return {
                message: 'You are not logged'
            };
        }
        return this.connection.getRepository(User).find();
    }
}
