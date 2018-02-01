import { JsonController, Body, Post, Res, Session, UseBefore } from 'routing-controllers';
import { Repository } from 'typeorm';
import { Inject } from 'typedi';
import { Response, Express } from 'express';
import * as Boom from 'boom';
import { User } from '../entities/User';
import { IsLoggedMiddleware } from '../middlewares/IsLoggedMiddleware';
import { IsNotLoggedMiddleware } from '../middlewares/IsNotLoggedMiddleware';
import {AuthService} from '../services/AuthService';

@JsonController()
export class AuthController {
    @Inject('UserRepository')
    userRepository: Repository<User>;

    @Inject()
    authService: AuthService;

    @Post('/login')
    @UseBefore(IsNotLoggedMiddleware)
    async login(@Body() user: User, @Session() session: Express.Session, @Res() response: Response) {
        try {
            const loggedUser = await this.authService.login(user);
            session.user = loggedUser;
            return loggedUser;
        } catch (error) {
            switch (error.message) {
                case AuthService.INCORRECT_PASSWORD_ERROR:
                case AuthService.USER_NOT_FOUND_ERROR:
                    response.statusCode = 403;
                    return Boom.wrap(error, 403).output.payload;
                default:
                    throw error;
            }
        }
    }

    @Post('/register')
    @UseBefore(IsNotLoggedMiddleware)
    async register(@Body() user: User, @Session() session: Express.Session, @Res() response: Response) {
        try {
            const registeredUser = await this.authService.register(user);
            session.user = registeredUser;
            return registeredUser;
        } catch (error) {
            switch (error.message) {
                case AuthService.INVALID_INFO_ERROR:
                    response.statusCode = 400;
                    return Boom.wrap(error, 400).output.payload;
                case AuthService.USER_ALREADY_EXISTS_ERROR:
                    response.statusCode = 409;
                    return Boom.wrap(error, 409).output.payload;
                default:
                    throw error;
            }
        }
    }

    @Post('/logout')
    @UseBefore(IsLoggedMiddleware)
    logout(@Session() session: Express.Session, @Res() response: Response) {
        if (!session) {
            response.statusCode = 403;
            return Boom.forbidden().output.payload;
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
