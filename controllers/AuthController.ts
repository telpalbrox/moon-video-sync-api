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
            return response.status(400).json({
                message: 'You are already logged'
            });
        }

        if (!user.email || !user.password) {
            return response.status(404).json({
                message: 'Invalid info'
            });
        }

        const userRepository = this.connection.getRepository(User);
        const storedUser = await userRepository.findOne({ email: user.email });
        if (!storedUser) {
            return response.status(404).json({
                message: 'User not found'
            });
        }

        if (user.password !== storedUser.password) {
            return response.status(400).json({
                message: 'Incorrect password'
            });
        }

        session.user = storedUser;
        return storedUser;
    }

    @Post('/register')
    async register(@Body() user: User, @Session() session: Express.Session, @Res() response: Response) {
        if (session.user) {
            return response.status(400).json({
                message: 'You are already logged'
            });
        }

        if (!user.email || !user.firstName || !user.lastName || !user.password) {
            return response.status(400).json({
                message: 'Invalid info'
            });
        }
        const userRepository = this.connection.getRepository(User);
        const sameEmailUser = await userRepository.findOne({ email: user.email });
        if (sameEmailUser) {
            return response.status(409).json({
                message: 'User already registered'
            });
        }
        return await userRepository.persist(user);
    }

    @Post('/logout')
    logout(@Session() session: Express.Session, @Res() response: Response) {
        if (!session.user) {
            return response.status(400).json({
                message: 'You are not logged'
            });
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
