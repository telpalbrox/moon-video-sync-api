import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Room } from './Room';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Exclude({ toPlainOnly: true })
    @Column()
    password: string;

    @ManyToMany((type) => Room, (room) => room.users)
    rooms: Room[] = [];

    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}
