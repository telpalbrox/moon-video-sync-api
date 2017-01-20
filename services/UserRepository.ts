import { Service } from 'typedi';

@Service()
export class UserRepository {
    getAll() {
        return [
            { user: 'test1', password: 'test1' },
            { user: 'test2', password: 'test2' },
            { user: 'test3', password: 'test3' }
        ];
    }
}
