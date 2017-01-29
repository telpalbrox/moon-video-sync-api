import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from 'typeorm';
import {Room} from './Room';

@Entity()
export class Video {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    youtubeId: string;

    @Column()
    title: string;

    @ManyToOne((type) => Room, (room) => room.videos)
    room: Room;

    @Column({ nullable: true })
    currentPosition: number;

    @Column({ nullable: true })
    startedPlayed: string;
}
