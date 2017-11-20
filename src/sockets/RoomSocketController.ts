import { Inject } from 'typedi';
import { SocketController, ServerEvent, SocketEvent } from './decorators';
import { Repository } from 'typeorm';
import { Room } from '../entities/Room';
import { Video } from '../entities/Video';
import { User } from '../entities/User';
import { SocketService } from '../services/SocketService';
import { RoomService } from '../services/RoomService';

interface JoinRoomParams {
    id?: number;
}

@SocketController()
export class RoomSocketController {
    @Inject('RoomRepository')
    roomRepository: Repository<Room>;

    @Inject('VideoRepository')
    videoRepository: Repository<Video>;

    @Inject('UserRepository')
    userRepository: Repository<User>;

    @Inject('io')
    io: SocketIO.Server;

    @Inject()
    socketService: SocketService;

    @Inject()
    roomService: RoomService;

    @ServerEvent('connect')
    connectedSocket(socket: CustomSocket) {
        console.log(`connected: ${socket.id}`);
    }

    @SocketEvent('disconnect')
    async disconnectedSocket(socket: CustomSocket) {
        console.log(`disconnected: ${socket.id}`);

        if (!socket.request.session) {
            socket.request.session = this.socketService.socketSessions[socket.id];
        }

        if (!socket.request.session.roomJoinedId) {
            return console.error('Not specified room id in session!');
        }

        try {
            await this.roomService.leaveRoom(socket.request.session.roomJoinedId, socket.request.session.user.id);
        } catch (error) {
            console.error('Error disconecting socket');
            console.error(error);
        } finally {
            const user = socket.request.session.user;
            delete user.password;
            delete user.email;
            this.io.to(`room n${socket.request.session.roomJoinedId}`).emit('user leave', user);
            delete socket.request.session.roomJoinedId;
        }
    }

    @SocketEvent('join room')
    joinRoom(socket: CustomSocket, joinOptions: JoinRoomParams) {
        if (!socket.request.session) {
            socket.request.session = this.socketService.socketSessions[socket.id];
        }
        if (!socket.request.session.user) {
            return console.log('Not logged user tried to join a room via socket');
        }
        if (!joinOptions.id) {
            throw new Error('Not specified room id!');
        }

        this.io.in(`room n${joinOptions.id}`).clients(async (err, clients) => {
            if (!clients.length) {
                const room = await this.roomRepository.findOneById(joinOptions.id);
                room.playing = true;
                await this.roomRepository.save(room);
                const video = await this.videoRepository.findOneById(room.currentVideoId);
                if (video) {
                    video.startedPlayed = new Date().toISOString();
                    await this.videoRepository.save(video);
                }
            }
            socket.join(`room n${joinOptions.id}`, async (err) => {
                if (err) {
                    throw err;
                }
                const room = await this.roomRepository.findOneById(joinOptions.id);
                const user = await this.userRepository.findOneById(socket.request.session.user.id);
                room.users.push(user);
                this.roomRepository.save(room);
                socket.request.session.roomJoinedId = joinOptions.id;
                delete user.password;
                delete user.email;
                this.io.to(`room n${joinOptions.id}`).emit('user join', user);
            });
        });
    }

    @SocketEvent('change video')
    async nextVideo(socket: CustomSocket, data: { id: number, emit: boolean }) {
        if (!socket.request.session) {
            socket.request.session = this.socketService.socketSessions[socket.id];
        }
        if (!socket.request.session.roomJoinedId) {
            throw new Error('Not specified room id in session!');
        }
        try {
            const video = await this.roomService.changeVideo(socket.request.session.roomJoinedId, data.id);
            if (video && data.emit) {
                this.io.to(`room n${socket.request.session.roomJoinedId}`).emit('video changed', video);
            }
        } catch (error) {
            console.error('Error changing video');
            console.error(error);
        }
    }

    @SocketEvent('send message')
    async sendMessage(socket: CustomSocket, data: { message: string }) {
        if (!socket.request.session) {
            socket.request.session = this.socketService.socketSessions[socket.id];
        }

        if (!socket.request.session.roomJoinedId) {
            throw new Error('Not specified room id in session!');
        }
        const user = await this.userRepository.findOneById(socket.request.session.user.id);
        this.io.to(`room n${socket.request.session.roomJoinedId}`).emit('new message', {
            message: data.message,
            sentBy: `${user.firstName} ${user.lastName}`,
            date: new Date().toISOString()
        });
    }

    @SocketEvent('pause song')
    pauseSong(socket: CustomSocket) {
        if (!socket.request.session) {
            socket.request.session = this.socketService.socketSessions[socket.id];
        }

        if (!socket.request.session.roomJoinedId) {
            return;
        }
        socket.to(`room n${socket.request.session.roomJoinedId}`).emit('pause song');
    }
}
