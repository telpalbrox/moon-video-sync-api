import { JsonController, Body, Post, Req } from 'routing-controllers';
import { Request } from 'express';
import { User, CustomSession } from '../interfaces';

@JsonController()
export class AuthController {
    @Post('/login')
    login(@Req() request: Request, @Body() user: User) {
        console.log('login');
        console.log(user);
        request.session.user = user;
        return {
            test: 'ok'
        };
    }
}
