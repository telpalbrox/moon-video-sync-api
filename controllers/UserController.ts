import { JsonController, Get, Req } from 'routing-controllers';
import { Request } from 'express';
import { CustomSession } from '../interfaces';

@JsonController()
export class UserController {
    @Get('/users')
    getUsers(@Req() request: Request) {
        const session: CustomSession = request.session;
        console.log('session');
        console.log(session);
        return [
            { user: 'test1', password: 'test1' },
            { user: 'test2', password: 'test2' },
            { user: 'test3', password: 'test3' }
        ]
    }
}
