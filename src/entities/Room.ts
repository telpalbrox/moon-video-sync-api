import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from './User';
import { Video } from './Video';

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany((type) => User, (user) => user.rooms)
    @JoinTable()
    users: User[] = [];

    @OneToMany((type) => Video, (video) => video.room)
    videos: Video[] = [];

    @Column({ nullable: true })
    currentVideoId: number;

    @Column()
    playing: boolean;
}
