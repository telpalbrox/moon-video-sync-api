import { Service, Inject } from 'typedi';
import { Connection } from 'typeorm';
import { User } from '../entities/User';

@Service()
export class UserRepository {
    @Inject()
    private connection: Connection;

    async getAll(): Promise<User[]> {
        const userRepository = this.connection.getRepository(User);
        return await userRepository.find();
    }

    async create(firstName: string, lastName: string): Promise<User> {
        const user = new User();
        user.firstName = firstName;
        user.lastName = lastName;
        return await this.connection.entityManager.persist(user);
    }
}
