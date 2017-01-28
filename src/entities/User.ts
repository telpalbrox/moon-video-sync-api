import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import * as bcrypt from 'bcrypt';
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

    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    async comparePassword(password: string) {
        return await bcrypt.compare(password, this.password);
    }
}
