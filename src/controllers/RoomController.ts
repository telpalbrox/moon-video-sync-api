import {
    JsonController, BodyParam, Res, Req, UseBefore, Post, Get, Param, Put, Delete
} from 'routing-controllers';
import { Inject } from 'typedi';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { IsLoggedMiddleware } from '../middlewares/IsLoggedMiddleware';
import { Room } from '../entities/Room';
import {Video} from '../entities/Video';

@JsonController()
export class RoomController {
    @Inject('RoomRepository')
    roomRepository: Repository<Room>;

    @Inject('VideoRepository')
    videoRepository: Repository<Video>;

    @Inject('io')
    io: SocketIO.Server;

    @Post('/rooms')
    @UseBefore(IsLoggedMiddleware)
    async createRoom(@Req() request: Request, @Res() response: Response, @BodyParam('name') name: string) {
        if (!name) {
            response.statusCode = 400;
            return { message: 'Please specify a name' };
        }

        const room = new Room();
        room.name = name;
        room.users.push(request.user);
        room.playing = false;
        return await this.roomRepository.persist(room);
    }

    @Get('/rooms')
    @UseBefore(IsLoggedMiddleware)
    async getRooms() {
        return await this.roomRepository.find();
    }

    @Get('/rooms/:id')
    @UseBefore(IsLoggedMiddleware)
    async getRoom(@Res() response: Response, @Param('id') id: string) {
        const room = await this.roomRepository.createQueryBuilder('room').where('room.id = :id', { id }).leftJoinAndSelect('room.users', 'users').leftJoinAndSelect('room.videos', 'videos').getOne();
        if (!room) {
            response.statusCode = 404;
            return { message: 'Room not found' };
        }
        return room;
    }

    @Post('/rooms/:id/videos')
    @UseBefore(IsLoggedMiddleware)
    async addVideo(@Res() response: Response, @Param('id') id: string, @BodyParam('youtubeId') youtubeId: string) {
        if (!youtubeId) {
            response.statusCode = 400;
            return {
                message: 'Invalid info'
            };
        }

        const room = await this.roomRepository.createQueryBuilder('room').where('room.id = :id', { id }).leftJoinAndSelect('room.users', 'users').leftJoinAndSelect('room.videos', 'videos').getOne();
        const alreadyAdded = !!room.videos.find((video) => youtubeId === video.youtubeId);
        if (alreadyAdded) {
            response.statusCode = 409;
            return { message: 'This video is already added' };
        }
        const video = new Video();
        video.youtubeId = youtubeId;
        video.title = 'not defined yet';
        const storedVideo = await this.videoRepository.persist(video);
        room.videos.push(storedVideo);
        if (!room.currentVideoId) {
            room.currentVideoId = storedVideo.id;
        }
        await this.roomRepository.persist(room);
        this.io.to(`room n${room.id}`).emit('video added', storedVideo);
        return storedVideo;
    }

    @Delete('/rooms/:roomId/videos/:videoId')
    @UseBefore(IsLoggedMiddleware)
    async deleteVideo(@Res() response: Response, @Param('roomId') roomId: string, @Param('videoId') videoId: string) {
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
        await this.roomRepository.persist(room);
        await this.videoRepository.remove(video);
        this.io.to(`room n${room.id}`).emit('video deleted', video);
        return room;
    }

    @Get('/rooms/:id/users')
    @UseBefore(IsLoggedMiddleware)
    async getRoomUsers(@Res() response: Response, @Param('id') id: string) {
        const room = await this.roomRepository.createQueryBuilder('room').where('room.id = :id', { id }).innerJoinAndSelect('room.users', 'users').getOne();
        if (!room) {
            response.statusCode = 404;
            return { message: 'Room not found' };
        }
        return room.users;
    }

    @Put('/rooms/:id/users')
    @UseBefore(IsLoggedMiddleware)
    async joinRoom(@Req() request: Request, @Res() response: Response, @Param('id') id: string) {
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
        await this.roomRepository.persist(room);
        return { message: 'ok' };
    }
}
