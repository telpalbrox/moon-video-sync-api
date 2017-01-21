import { JsonController, Body, Post, Res, Session } from 'routing-controllers';
import { Connection } from 'typeorm';
import { Inject } from 'typedi';
import { Response, Express } from 'express';
import { User } from '../entities/User';

@JsonController()
export class AuthController {
    @Inject()
    connection: Connection;

    @Post('/login')
    async login(@Body() user: User, @Session() session: Express.Session, @Res() response: Response) {
        if (session.user) {
            response.statusCode = 400;
            return {
                message: 'You are already logged'
            };
        }

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

        if (user.password !== storedUser.password) {
            response.statusCode = 400;
            return {
                message: 'Incorrect password'
            };
        }

        session.user = storedUser;
        return storedUser;
    }

    @Post('/register')
    async register(@Body() user: User, @Session() session: Express.Session, @Res() response: Response) {
        if (session.user) {
            response.statusCode = 400;
            return {
                message: 'You are already logged'
            };
        }

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
        return await userRepository.persist(user);
    }

    @Post('/logout')
    logout(@Session() session: Express.Session, @Res() response: Response) {
        if (!session.user) {
            response.statusCode = 401;
            return {
                message: 'You are not logged'
            };
        }

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
