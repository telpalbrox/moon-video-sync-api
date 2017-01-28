import { User } from './src/entities/User';

declare global {
    namespace Express {
        export interface Request {
            user?: User;
        }

        export interface Session {
            user?: User;
            roomJoinedId?: number;
        }
    }

    interface CustomSocket extends SocketIO.Socket {
        request: {
            session: Express.Session
        };
    }
}
