import { User } from './entities/User';

declare global {
    namespace Express {
        export interface Request {
            test: string;
        }

        export interface Session {
            user?: User;
        }
    }
}
