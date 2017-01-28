import { JsonController, Body, Post, Res, Session, UseBefore } from 'routing-controllers';
import { Repository } from 'typeorm';
import { Inject } from 'typedi';
import { Response, Express } from 'express';
import { User } from '../entities/User';
import { IsLoggedMiddleware } from '../middlewares/IsLoggedMiddleware';
import { IsNotLoggedMiddleware } from '../middlewares/IsNotLoggedMiddleware';

@JsonController()
export class AuthController {
    @Inject('UserRepository')
    userRepository: Repository<User>;

    @Post('/login')
    @UseBefore(IsNotLoggedMiddleware)
    async login(@Body() user: User, @Session() session: Express.Session, @Res() response: Response) {
        if (!user.email || !user.password) {
            response.statusCode = 404;
            return {
                message: 'Invalid info'
            };
        }

        const storedUser = await this.userRepository.findOne({ email: user.email });
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

        const sameEmailUser = await this.userRepository.findOne({ email: user.email });
        if (sameEmailUser) {
            response.statusCode = 409;
            return {
                message: 'User already registered'
            };
        }
        await user.hashPassword();
        const storedUser = await this.userRepository.persist(user);
        session.user = storedUser;
        return await this.userRepository.persist(user);
    }

    @Post('/logout')
    @UseBefore(IsLoggedMiddleware)
    logout(@Session() session: Express.Session) {
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
