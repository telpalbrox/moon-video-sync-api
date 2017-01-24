import { SocketController, ServerEvent, SocketEvent } from './decorators';

@SocketController()
export class RoomSocketController {
    @ServerEvent('connect')
    connectedSocket(socket: CustomSocket) {
        console.log(`connected: ${socket.id}`);
    }

    @SocketEvent('disconnect')
    disconnectedSocket(socket: CustomSocket) {
        console.log(`disconnected: ${socket.id}`);
    }
}
