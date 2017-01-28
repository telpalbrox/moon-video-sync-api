import { SocketController, ServerEvent, SocketEvent } from './decorators';

interface JoinRoomParams {
    id?: number;
}

@SocketController()
export class RoomSocketController {
    @ServerEvent('connect')
    connectedSocket(socket: CustomSocket) {
        console.log(`connected: ${socket.id}`);
    }

    @SocketEvent('disconnect')
    disconnectedSocket(socket: CustomSocket) {
        delete socket.request.session.roomJoinedId;
        console.log(`disconnected: ${socket.id}`);
    }

    @SocketEvent('join room')
    joinRoom(socket: CustomSocket, joinOptions: JoinRoomParams) {
        // TODO check if the user has joined this room before
        socket.join(`room n${joinOptions.id}`, (err) => {
            if (err) {
                throw err;
            }
            socket.request.session.roomJoinedId = joinOptions.id;
        });
    }

    @SocketEvent('pause song')
    pauseSong(socket: CustomSocket) {
        if (!socket.request.session.roomJoinedId) {
            return;
        }
        socket.to(`room n${socket.request.session.roomJoinedId}`).emit('pause song');
    }
}
