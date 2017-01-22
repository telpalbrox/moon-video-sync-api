import { JsonController, Body, Post, Res, Session, UseBefore } from 'routing-controllers';
import { Connection } from 'typeorm';
import { Inject } from 'typedi';
import { Response, Express } from 'express';
import { User } from '../entities/User';
import { IsLoggedMiddleware } from '../middlewares/IsLoggedMiddleware';
import { IsNotLoggedMiddleware } from '../middlewares/IsNotLoggedMiddleware';

@JsonController()
export class AuthController {
    @Inject()
    connection: Connection;

    @Post('/login')
    @UseBefore(IsNotLoggedMiddleware)
    async login(@Body() user: User, @Session() session: Express.Session, @Res() response: Response) {
        if (!user.email || !user.password) {
            return response.status(404).json({
                message: 'Invalid info'
            });
        }

        const userRepository = this.connection.getRepository(User);
        const storedUser = await userRepository.findOne({ email: user.email });
        if (!storedUser) {
            response.statusCode = 404;
            return {
                message: 'User not found'
            };
        }

        const correctPassword = await storedUser.comparePassword(user.password);
        if (!correctPassword) {
            response.statusCode = 400;
            return {
                message: 'Incorrect password'
            };
        }

        session.user = storedUser;
        return storedUser;
    }

    @Post('/register')
    @UseBefore(IsNotLoggedMiddleware)
    async register(@Body() user: User, @Session() session: Express.Session, @Res() response: Response) {
        if (!user.email || !user.firstName || !user.lastName || !user.password) {
            response.statusCode = 400;
            return {
                message: 'Invalid info'
            };
        }
        const userRepository = this.connection.getRepository(User);
        const sameEmailUser = await userRepository.findOne({ email: user.email });
        if (sameEmailUser) {
            response.statusCode = 409;
            return {
                message: 'User already registered'
            };
        }
        await user.hashPassword();
        const storedUser = await userRepository.persist(user);
        session.user = storedUser;
        return await userRepository.persist(user);
    }

    @Post('/logout')
    @UseBefore(IsLoggedMiddleware)
    logout(@Session() session: Express.Session, @Res() response: Response) {
        return new Promise((resolve, reject) => {
            session.destroy((err) => {
                if (err) {
                    return reject(err);
                }
                resolve({
                    message: 'ok'
                });
            });
        });
    }
}
