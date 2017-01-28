import {Connection} from 'typeorm';
import {Room} from '../entities/Room';

export function roomRepositoryFactory(connection: Connection) {
    return Object.assign(connection.getRepository(Room), {
        findOneById(id: number) {
            return this.createQueryBuilder('room').where('room.id = :id', { id }).leftJoinAndSelect('room.users', 'users').leftJoinAndSelect('room.videos', 'videos').getOne();
        }
    });
}
