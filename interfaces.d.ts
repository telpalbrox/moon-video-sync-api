import { User } from './entities/User';

declare global {
    namespace Express {
        export interface Request {
            user?: User;
        }

        export interface Session {
            user?: User;
        }
    }

    interface CustomSocket extends SocketIO.Socket {
        request: {
            session: Express.Session
        };
    }
}
