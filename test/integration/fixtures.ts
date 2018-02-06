import { Container } from 'typedi';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/User';

export async function createUsers() {
    const userRepository: Repository<User> = Container.get('UserRepository');
    const user = new User();
    user.firstName = 'Test';
    user.lastName = 'Testl';
    user.email = 'test@test.com';
    user.password = 'gatitos';
    await user.hashPassword();
    await userRepository.save(user);
}

export async function destroyUsers() {
    const userRepository: Repository<User> = Container.get('UserRepository');
    await userRepository.clear();
}
