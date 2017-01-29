import {Inject} from 'typedi';
import { SocketController, ServerEvent, SocketEvent } from './decorators';
import {Repository} from 'typeorm';
import {Room} from '../entities/Room';

interface JoinRoomParams {
    id?: number;
}

@SocketController()
export class RoomSocketController {
    @Inject('RoomRepository')
    roomRepository: Repository<Room>;

    @Inject('io')
    io: SocketIO.Server;

    @ServerEvent('connect')
    connectedSocket(socket: CustomSocket) {
        console.log(`connected: ${socket.id}`);
    }

    @SocketEvent('disconnect')
    disconnectedSocket(socket: CustomSocket) {
        this.io.in(`room n${socket.request.session.roomJoinedId}`).clients(async (err, clients) => {
            if (!clients.length) {
                const room = await this.roomRepository.findOneById(socket.request.session.roomJoinedId);
                room.playing = false;
                await this.roomRepository.persist(room);
            }
            delete socket.request.session.roomJoinedId;
        });
        console.log(`disconnected: ${socket.id}`);
    }

    @SocketEvent('join room')
    joinRoom(socket: CustomSocket, joinOptions: JoinRoomParams) {
        // TODO check if the user has joined this room before
        this.io.in(`room n${joinOptions.id}`).clients(async (err, clients) => {
            if (!clients.length) {
                const room = await this.roomRepository.findOneById(joinOptions.id);
                room.playing = true;
                await this.roomRepository.persist(room);
            }
            socket.join(`room n${joinOptions.id}`, (err) => {
                if (err) {
                    throw err;
                }
                socket.request.session.roomJoinedId = joinOptions.id;
            });
        });
    }

    @SocketEvent('leave room')
    leaveRoom(socket: CustomSocket, joinOptions: JoinRoomParams) {
        socket.leave(`room n${joinOptions.id}`, () => {
            this.io.in(`room n${joinOptions.id}`).clients(async (err, clients) => {
                if (!clients.length) {
                    const room = await this.roomRepository.findOneById(joinOptions.id);
                    room.playing = false;
                    await this.roomRepository.persist(room);
                }
            });
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
