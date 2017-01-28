import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from './User';

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany((type) => User, (user) => user.rooms)
    @JoinTable()
    users: User[] = [];
}
