import {Inject} from 'typedi';

@Inject()
export class SocketService {
    public socketSessions: Object = {};
}
