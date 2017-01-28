import { JsonController, BodyParam, Res, Req, UseBefore, Post, Get, Param, Put } from 'routing-controllers';
import { Inject } from 'typedi';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { IsLoggedMiddleware } from '../middlewares/IsLoggedMiddleware';
import { Room } from '../entities/Room';

@JsonController()
export class RoomController {
    @Inject('RoomRepository')
    roomRepository: Repository<Room>;

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

        return await this.roomRepository.persist(room);
    }

    @Get('/rooms')
    @UseBefore(IsLoggedMiddleware)
    async getRooms() {
        return await this.roomRepository.find();
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
