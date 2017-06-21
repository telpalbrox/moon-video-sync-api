import {Inject, Service} from 'typedi';
import {Repository} from 'typeorm';
import {User} from '../entities/User';

@Service()
export class AuthService {
    public static USER_NOT_FOUND_ERROR = 'USER_NOT_FOUND';
    public static INCORRECT_PASSWORD_ERROR = 'INCORRECT_PASSWORD';
    public static INVALID_INFO_ERROR = 'INVALID_INFO';
    public static USER_ALREADY_EXISTS_ERROR = 'USER_ALREADY_EXISTS';

    @Inject('UserRepository')
    userRepository: Repository<User>;

    async login(user: User): Promise<User> {
        if (!user.email) {
            throw new Error(AuthService.USER_NOT_FOUND_ERROR);
        }
        if (!user.password) {
            throw new Error(AuthService.INCORRECT_PASSWORD_ERROR);
        }

        try {
            const storedUser = await this.userRepository.findOne({ email: user.email });
            if (!storedUser) {
                throw new Error(AuthService.USER_NOT_FOUND_ERROR);
            }

            if (!await storedUser.comparePassword(user.password)) {
                throw new Error(AuthService.INCORRECT_PASSWORD_ERROR);
            }

            return storedUser;
        } catch (error) {
            throw error;
        }
    }

    async register(user: User): Promise<User> {
        if (!user.email || !user.firstName || !user.lastName || !user.password) {
            throw new Error(AuthService.INVALID_INFO_ERROR);
        }

        try {
            const sameEmailUser = await this.userRepository.findOne({ email: user.email });
            if (sameEmailUser) {
                throw new Error(AuthService.USER_ALREADY_EXISTS_ERROR);
            }
            await user.hashPassword();
            return await this.userRepository.persist(user);
        } catch (error) {
            throw error;
        }
    }
}
