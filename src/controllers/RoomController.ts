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
import { RoomService } from '../services/RoomService';
const Boom = require('boom');

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

    @Inject()
    roomService: RoomService;

    @Post('/rooms')
    @UseBefore(IsLoggedMiddleware)
    createRoom(@Req() request: Request, @Res() response: Response, @BodyParam('name') name: string) {
        try {
            return this.roomService.createRoom(name);
        } catch (error) {
            switch (error.message) {
                case RoomService.INVALID_INFO_ERROR:
                    response.statusCode = 400;
                    return Boom.wrap(error, 400).output.payload;
                case RoomService.ALREADY_EXISTS_ERROR:
                    response.statusCode = 409;
                    return Boom.wrap(error, 409).output.payload;
                default:
                    throw error;
        }
    }
    }

    @Get('/rooms')
    @UseBefore(IsLoggedMiddleware)
    getRooms() {
        return this.roomService.getRooms();
    }

    @Get('/rooms/:id')
    @UseBefore(IsLoggedMiddleware)
    getRoom( @Res() response: Response, @Param('id') id: string) {
        try {
            return this.roomService.getRoom(id);
        } catch (error) {
            switch (error.message) {
                case RoomService.NOT_FOUND_ERROR:
                    response.statusCode = 404;
                    return Boom.wrap(error, 404).output.payload;
                default:
                    throw error;
        }
    }
    }

    @Delete('/rooms/:id')
    @UseBefore(IsLoggedMiddleware)
    deleteRoom( @Res() response: Response, @Param('id') id: string) {
        try {
            this.roomService.removeRoom(id);
            return { message: 'ok' };
        } catch (error) {
            switch (error.message) {
                case RoomService.NOT_FOUND_ERROR:
                    response.statusCode = 404;
                    return Boom.wrap(error, 404).output.payload;
                default:
                    throw error;
        }
        }
    }

    @Post('/rooms/:id/videos')
    @UseBefore(IsLoggedMiddleware)
    addVideo( @Res() response: Response, @Param('id') id: string, @BodyParam('youtubeId') youtubeId: string) {
        try {
            return this.roomService.addVideo(id, youtubeId);
        } catch (error) {
            switch (error.message) {
                case RoomService.INVALID_YOUTUBE_ID_ERROR:
                    response.statusCode = 400;
                    return Boom.wrap(error, 400).output.payload;
                case RoomService.NOT_FOUND_ERROR:
                    response.statusCode = 404;
                    return Boom.wrap(error, 404).output.payload;
                case RoomService.VIDEO_ALREADY_ADDED_ERROR:
                    response.statusCode = 409;
                    return Boom.wrap(error, 409).output.payload;
                default:
                    throw error;
            }
        }
    }

    @Delete('/rooms/:roomId/videos/:videoId')
    @UseBefore(IsLoggedMiddleware)
    removeVideo( @Res() response: Response, @Param('roomId') roomId: string, @Param('videoId') videoId: string) {
        try {
            return this.roomService.removeVideo(roomId, videoId);
        } catch (error) {
            switch (error.message) {
                case RoomService.NOT_FOUND_ERROR:
                case RoomService.VIDEO_NOT_FOUND_ERROR:
                    response.statusCode = 404;
                    return Boom.wrap(error, 404).output.payload;
                default:
                    throw error;
            }
        }
    }

    @Post('/rooms/:roomId/playlist')
    async importPlaylist( @Res() response: Response, @Param('roomId') roomId: string, @BodyParam('playlistId') playlistId: string) {
        try {
            return this.roomService.importPlaylist(roomId, playlistId);
        } catch (error) {
            switch (error.message) {
                case RoomService.PLAYLIST_INVALID_INFO_ERROR:
                    response.statusCode = 400;
                    return Boom.wrap(error, 400).output.payload;
                case RoomService.NOT_FOUND_ERROR:
                    response.statusCode = 404;
                    return Boom.wrap(error, 404).output.payload;
                default:
                    throw error;
            }
        }
    }

    @Get('/rooms/:id/users')
    @UseBefore(IsLoggedMiddleware)
    async getRoomUsers( @Res() response: Response, @Param('id') id: string) {
        try {
            return this.roomService.getRoomUsers(id);
        } catch (error) {
            switch (error.message) {
                case RoomService.NOT_FOUND_ERROR:
                    response.statusCode = 404;
                    return Boom.wrap(error, 404).output.payload;
                default:
                    throw error;
            }
        }
    }

    @Put('/rooms/:id/users')
    @UseBefore(IsLoggedMiddleware)
    async joinRoom( @Req() request: Request, @Res() response: Response, @Param('id') id: string) {
        try {
            this.roomService.joinRoom(id, request.user);
            return { message: 'ok' };
        } catch (error) {
            switch (error.message) {
                case RoomService.NOT_FOUND_ERROR:
                    response.statusCode = 404;
                    return Boom.wrap(error, 404).output.payload;
                case RoomService.USER_ALREADY_JOINED_ERROR:
                    response.statusCode = 409;
                    return Boom.wrap(error, 409).output.payload;
                default:
                    throw error;
            }
        }
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
