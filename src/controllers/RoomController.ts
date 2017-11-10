import {
    JsonController, BodyParam, Res, Req, UseBefore, Post, Get, Param, Put, Delete, Session
} from 'routing-controllers';
import { Inject } from 'typedi';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { IsLoggedMiddleware } from '../middlewares/IsLoggedMiddleware';
import { Room } from '../entities/Room';
import { Video } from '../entities/Video';
import { YoutubeService } from '../services/YoutubeService';
import { SocketService } from '../services/SocketService';

@JsonController()
export class RoomController {
    @Inject('RoomRepository')
    roomRepository: Repository<Room>;

    @Inject('VideoRepository')
    videoRepository: Repository<Video>;

    @Inject('io')
    io: SocketIO.Server;

    @Inject()
    youtubeService: YoutubeService;

    @Inject()
    socketService: SocketService;

    @Post('/rooms')
    @UseBefore(IsLoggedMiddleware)
    async createRoom( @Req() request: Request, @Res() response: Response, @BodyParam('name') name: string) {
        if (!name) {
            response.statusCode = 400;
            return { message: 'Please specify a name' };
        }

        const room = new Room();
        room.name = name;
        room.playing = false;
        return await this.roomRepository.save(room);
    }

    @Get('/rooms')
    @UseBefore(IsLoggedMiddleware)
    async getRooms() {
        return await this.roomRepository.find();
    }

    @Get('/rooms/:id')
    @UseBefore(IsLoggedMiddleware)
    async getRoom( @Res() response: Response, @Param('id') id: string) {
        const room = await this.roomRepository.findOneById(id);
        if (!room) {
            response.statusCode = 404;
            return { message: 'Room not found' };
        }
        return room;
    }

    @Delete('/rooms/:id')
    @UseBefore(IsLoggedMiddleware)
    async deleteRoom( @Res() response: Response, @Param('id') id: string) {
        const room = await this.roomRepository.findOneById(id);
        if (!room) {
            response.statusCode = 404;
            return { message: 'Room not found' };
        }
        await this.videoRepository.remove(room.videos);
        await this.roomRepository.remove(room);
        return { message: 'ok' };
    }

    @Post('/rooms/:id/videos')
    @UseBefore(IsLoggedMiddleware)
    async addVideo( @Res() response: Response, @Param('id') id: string, @BodyParam('youtubeId') youtubeId: string) {
        if (!youtubeId) {
            response.statusCode = 400;
            return {
                message: 'Invalid info'
            };
        }

        const title = await this.youtubeService.getVideoTitle(youtubeId);

        if (!title) {
            response.statusCode = 400;
            return { message: 'Invalid YouTube id' };
        }

        const room = await this.roomRepository.findOneById(id);
        const alreadyAdded = !!room.videos.find((video) => youtubeId === video.youtubeId);
        if (alreadyAdded) {
            response.statusCode = 409;
            return { message: 'This video is already added' };
        }
        const video = new Video();
        video.youtubeId = youtubeId;
        video.title = title;
        if (!room.videos.length) {
            video.startedPlayed = new Date().toISOString();
        }
        const storedVideo = await this.videoRepository.save(video);
        room.videos.push(storedVideo);
        if (!room.currentVideoId) {
            room.currentVideoId = storedVideo.id;
        }
        await this.roomRepository.save(room);
        this.io.to(`room n${room.id}`).emit('video added', storedVideo);
        return storedVideo;
    }

    @Delete('/rooms/:roomId/videos/:videoId')
    @UseBefore(IsLoggedMiddleware)
    async deleteVideo( @Res() response: Response, @Param('roomId') roomId: string, @Param('videoId') videoId: string) {
        if (!roomId || !videoId) {
            response.statusCode = 400;
            return {
                message: 'Invalid info'
            };
        }
        const room = await this.roomRepository.createQueryBuilder('room').where('room.id = :id', { id: roomId }).leftJoinAndSelect('room.users', 'users').leftJoinAndSelect('room.videos', 'videos').getOne();
        const video = await this.videoRepository.findOneById(videoId);

        if (!room || !video) {
            response.statusCode = 404;
            return {
                message: 'Resource not found'
            };
        }

        room.videos = room.videos.filter((video) => video.id !== +videoId);
        if (!room.videos.length) {
            room.currentVideoId = null;
        }
        this.io.to(`room n${room.id}`).emit('video deleted', video);
        await this.roomRepository.save(room);
        await this.videoRepository.remove(video);
        return room;
    }

    @Post('/rooms/:roomId/playlist')
    async importPlaylist( @Res() response: Response, @Param('roomId') roomId: string, @BodyParam('playlistId') playlistId: string) {
        if (!roomId || !playlistId) {
            response.statusCode = 400;
            return {
                message: 'Invalid info'
            };
        }
        const room = await this.roomRepository.findOneById(roomId);
        if (!room) {
            response.statusCode = 404;
            return {
                message: 'Resource not found'
            };
        }
        const videosInfo = await this.youtubeService.getVideoInfoFromPlaylist(playlistId);
        if (!videosInfo) {
            response.statusCode = 400;
            return {
                message: 'Invalid YouTube playlist id'
            };
        }
        const videos = videosInfo.map((videoInfo) => {
            const video = new Video();
            video.youtubeId = videoInfo.youtubeId;
            video.title = videoInfo.title;
            return video;
        });
        const storedVideos = await this.videoRepository.save(videos);
        room.videos = room.videos.concat(storedVideos);
        const storedRoom = await this.roomRepository.save(room);
        storedVideos.forEach((video) => this.io.to(`room n${storedRoom.id}`).emit('video added', video));
        return storedRoom;
    }

    @Get('/rooms/:id/users')
    @UseBefore(IsLoggedMiddleware)
    async getRoomUsers( @Res() response: Response, @Param('id') id: string) {
        const room = await this.roomRepository.createQueryBuilder('room').where('room.id = :id', { id }).innerJoinAndSelect('room.users', 'users').getOne();
        if (!room) {
            response.statusCode = 404;
            return { message: 'Room not found' };
        }
        return room.users;
    }

    @Put('/rooms/:id/users')
    @UseBefore(IsLoggedMiddleware)
    async joinRoom( @Req() request: Request, @Res() response: Response, @Param('id') id: string) {
        const room = await this.roomRepository.createQueryBuilder('room').where('room.id = :id', { id }).leftJoinAndSelect('room.users', 'users').getOne();
        if (!room) {
            response.statusCode = 404;
            return { message: 'Room not found' };
        }
        const alreadyJoined = !!room.users.find((user) => request.user.id === user.id);
        if (alreadyJoined) {
            response.statusCode = 409;
            return { message: 'You already joined this room' };
        }
        room.users.push(request.user);
        await this.roomRepository.save(room);
        return { message: 'ok' };
    }

    @Post('/socket/:id')
    async socket( @Req() request: Request, @Res() response: Response, @Param('id') id: string, @Session() session: Express.Session) {
        console.log('adsfasdf');
        const socket = this.io.sockets.connected[id];
        if (!socket) {
            return;
        }
        this.socketService.socketSessions[id] = session;
        Object.defineProperty(socket, 'teest', {
            value: {
                session: {
                    user: session.user
                }
            }
        });
        (socket as any).lool = 'asdf';
        return { message: 'ok' };
    }
}
