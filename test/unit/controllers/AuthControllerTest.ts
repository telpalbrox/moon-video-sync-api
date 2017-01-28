import { Container } from 'typedi';
import { expect } from 'chai';
import * as httpMocks from 'node-mocks-http';
import { AuthController } from '../../../src/controllers/AuthController';
import { User } from '../../../src/entities/User';

describe('AuthController tests', () => {
    it('login should work', async () => {
        const logUser = {
            email: 'test@test.com',
            password: 'gatitos',
            comparePassword() {
                return true;
            }
        };
        const fakeUserRepository = {
            findOne(conditions: { email: string }) {
                expect(Object.keys(conditions)).deep.equal(['email']);
                expect(conditions.email).to.equal('test@test.com');
                return Object.assign({}, logUser, { firstName: 'Test', lastName: 'Testlast' });
            }
        };
        Container.set('UserRepository', fakeUserRepository);
        const authController = Container.get(AuthController);
        const session = {};
        const response = httpMocks.createResponse();
        const loggedUser = await authController.login(logUser as any, session as any, response) as User;
        expect(loggedUser.lastName).to.equal('Testlast');
    })
});
