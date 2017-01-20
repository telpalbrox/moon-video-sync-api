export interface User {
    user?: string;
    password?: string;
}

export interface CustomSession {
    user?: User;
}

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
