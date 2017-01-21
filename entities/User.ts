import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

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

    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}
