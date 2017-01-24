import { SocketController, ServerEvent, SocketEvent } from './decorators';

@SocketController()
export class RoomSocketController {
    @ServerEvent('connect')
    connectedSocket(socket: SocketIO.Socket) {
        console.log(`connected: ${socket.id}`);
    }

    @SocketEvent('disconnect')
    disconnectedSocket(socket: SocketIO.Socket) {
        console.log(`disconnected: ${socket.id}`);
    }
}
