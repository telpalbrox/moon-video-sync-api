import { Container } from 'typedi';
import { expect } from 'chai';
import { User } from '../../../src/entities/User';
import {AuthService} from '../../../src/services/AuthService';

describe('AuthController tests', () => {

    beforeEach(() => {
        Container.remove('UserRepository');
        Container.remove(AuthService);
    });

    describe('AuthController.prototype.login test', () => {
        it('Should return a user', async () => {
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
            const authService = Container.get(AuthService);
            const loggedUser = await authService.login(logUser as any) as User;
            expect(loggedUser.lastName).to.equal('Testlast');
        });

        it('Should throw an error if the user email is not set', async () => {
            const logUser = {
                password: 'gatitos',
            };
            Container.set('UserRepository', {});
            const authService = Container.get(AuthService);
            try {
                await authService.login(logUser as any);
            } catch (error) {
                return expect(error.message).to.equal(AuthService.USER_NOT_FOUND_ERROR);
            }
            expect.fail('Is not throwing an exception', 'USER_NOT_FOUND_ERROR exception is thrown');
        });

        it('Should throw an error if the user password is not set', async () => {
            const logUser = {
                email: 'test@test.com'
            };
            Container.set('UserRepository', {});
            const authService = Container.get(AuthService);
            try {
                await authService.login(logUser as any);
            } catch (error) {
                return expect(error.message).to.equal(AuthService.INCORRECT_PASSWORD_ERROR);
            }
            expect.fail('Is not throwing an exception', 'INCORRECT_PASSWORD_ERROR exception is thrown');
        });

        it('Should throw an error if the user is not in the database', async () => {
            const logUser = {
                email: 'test@test.com',
                password: 'gatitos'
            };
            const fakeUserRepository = {
                findOne() {
                    return new Promise((resolve) => {
                        resolve(null);
                    });
                }
            };
            Container.set('UserRepository', fakeUserRepository);
            const authService = Container.get(AuthService);
            try {
                await authService.login(logUser as any);
            } catch (error) {
                return expect(error.message).to.equal(AuthService.USER_NOT_FOUND_ERROR);
            }
            expect.fail('Is not throwing an exception', 'USER_NOT_FOUND_ERROR exception is thrown');
        });

        it('Should throw an error if the user password is not correct', async () => {
            const logUser = {
                email: 'test@test.com',
                password: 'gatitos',
                comparePassword() {
                    return false;
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
            const authService = Container.get(AuthService);
            try {
                await authService.login(logUser as any);
            } catch (error) {
                return expect(error.message).to.equal(AuthService.INCORRECT_PASSWORD_ERROR);
            }
            expect.fail('Is not throwing an exception', 'INCORRECT_PASSWORD_ERROR exception is thrown');
        });
    });

    describe('AuthController.prototype.register test', () => {
        it('Should throw an error if the user doesn\'t send all the registration parameters', async () => {
            const registerUser = {};
            Container.set('UserRepository', {});
            const authService = Container.get(AuthService);
            try {
                await authService.register(registerUser as any);
            } catch (error) {
                return expect(error.message).to.equal(AuthService.INVALID_INFO_ERROR);
            }
            expect.fail('Is not throwing an exception', 'INCORRECT_PASSWORD_ERROR exception is thrown');
        });

        it('Should throw an error if the user already exists', async () => {
            const registerUser = {
                firstName: 'Test',
                lastName: 'Userlast',
                password: 'gatitos',
                email: 'test@test.com'
            };

            const fakeUserRepository = {
                findOne(conditions: { email: string }) {
                    expect(conditions.email).to.equal('test@test.com');
                    return {};
                }
            };

            Container.set('UserRepository', fakeUserRepository);
            const authService = Container.get(AuthService);
            try {
                await authService.register(registerUser as any);
            } catch (error) {
                return expect(error.message).to.equal(AuthService.USER_ALREADY_EXISTS_ERROR);
            }
            expect.fail('Is not throwing an exception', 'USER_ALREADY_EXISTS_ERROR exception is thrown');
        });

        it('Should return an user', async () => {
            const registerUser = {
                firstName: 'Test',
                lastName: 'Userlast',
                password: 'gatitos',
                email: 'test@test.com',
                hashPassword() { }
            };

            const fakeUserRepository = {
                findOne() {
                    return null;
                },
                save(user: User) {
                    expect(user).to.include.keys('firstName', 'lastName', 'email', 'password');
                    return registerUser;
                }
            };

            Container.set('UserRepository', fakeUserRepository);
            const authService = Container.get(AuthService);
            const user = await authService.register(registerUser as any);
            expect(user.email).to.equal('test@test.com');
        });
    });
});
