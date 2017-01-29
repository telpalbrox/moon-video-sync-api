import {Inject} from 'typedi';
import { SocketController, ServerEvent, SocketEvent } from './decorators';
import {Repository} from 'typeorm';
import {Room} from '../entities/Room';
import {Video} from '../entities/Video';

interface JoinRoomParams {
    id?: number;
}

@SocketController()
export class RoomSocketController {
    @Inject('RoomRepository')
    roomRepository: Repository<Room>;

    @Inject('VideoRepository')
    videoRepository: Repository<Video>;

    @Inject('io')
    io: SocketIO.Server;

    @ServerEvent('connect')
    connectedSocket(socket: CustomSocket) {
        console.log(`connected: ${socket.id}`);
    }

    @SocketEvent('disconnect')
    disconnectedSocket(socket: CustomSocket) {
        console.log(`disconnected: ${socket.id}`);

        if (!socket.request.session.roomJoinedId) {
            return console.error('Not specified room id in session!');
        }

        this.io.in(`room n${socket.request.session.roomJoinedId}`).clients(async (err, clients) => {
            if (!clients.length) {
                const room = await this.roomRepository.findOneById(socket.request.session.roomJoinedId);
                room.playing = false;
                await this.roomRepository.persist(room);
                const video = await this.videoRepository.findOneById(room.currentVideoId);
                video.startedPlayed = null;
                await this.videoRepository.persist(video);
            }
            delete socket.request.session.roomJoinedId;
        });
    }

    @SocketEvent('join room')
    joinRoom(socket: CustomSocket, joinOptions: JoinRoomParams) {
        // TODO check if the user has joined this room before
        this.io.in(`room n${joinOptions.id}`).clients(async (err, clients) => {
            if (!joinOptions.id) {
                throw new Error('Not specified room id!');
            }
            if (!clients.length) {
                const room = await this.roomRepository.findOneById(joinOptions.id);
                room.playing = true;
                await this.roomRepository.persist(room);
                const video = await this.videoRepository.findOneById(room.currentVideoId);
                video.startedPlayed = new Date().toISOString();
                await this.videoRepository.persist(video);
            }
            socket.join(`room n${joinOptions.id}`, (err) => {
                if (err) {
                    throw err;
                }
                socket.request.session.roomJoinedId = joinOptions.id;
            });
        });
    }

    @SocketEvent('change video')
    async nextVideo(socket: CustomSocket, data: { id: number, emit: boolean }) {
        if (!socket.request.session.roomJoinedId) {
            throw new Error('Not specified room id in session!');
        }
        const room = await this.roomRepository.findOneById(socket.request.session.roomJoinedId);
        const video = await this.videoRepository.findOneById(data.id);
        if (room.currentVideoId === video.id) {
            return;
        }
        room.currentVideoId = video.id;
        video.startedPlayed = new Date().toISOString();
        await this.roomRepository.persist(room);
        await this.videoRepository.persist(video);
        if (data.emit) {
            this.io.to(`room n${socket.request.session.roomJoinedId}`).emit('video changed', video);
        }
    }

    @SocketEvent('pause song')
    pauseSong(socket: CustomSocket) {
        if (!socket.request.session.roomJoinedId) {
            return;
        }
        socket.to(`room n${socket.request.session.roomJoinedId}`).emit('pause song');
    }
}
