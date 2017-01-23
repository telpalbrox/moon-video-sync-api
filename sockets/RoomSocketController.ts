import { SocketController, ServerOn } from './decorators';

@SocketController()
export class RoomSocketController {
    @ServerOn('connect')
    connectedSocket(socket: SocketIO.Socket) {
        console.log(`connected: ${socket.id}`);
    }
}
