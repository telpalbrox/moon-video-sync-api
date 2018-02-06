import { Server } from 'http';
import { Express } from 'express';
import { Container } from 'typedi';
import { Repository } from 'typeorm';
import { expect } from 'chai';
import * as supertest from 'supertest';
import { startUpAPI } from '../../../src';
import { User } from '../../../src/entities/User';
import { SuperTest } from 'supertest';
import { createUsers, destroyUsers } from '../fixtures';

let app: Express, server: Server;

describe('AuthController integration tests', () => {

    before(async () => {
        const servers = await startUpAPI();
        app = servers.app;
        server = server = servers.server;
        await createUsers();
    });

    after((done) => {
        destroyUsers().then(() => {
            server.close(done);
        }).catch(done);
    });

    describe('Login tests', () => {
        it('Should not be able to login', (done) => {
            supertest(app)
                .post('/login')
                .send({ email: 'notfound', password: 'notdefined' })
                .expect(403)
                .end(done);
        });

        it('Should be able to login', async () => {
            const userRepository: Repository<User> = Container.get('UserRepository');
            const response = await supertest(app)
                .post('/login')
                .send({ email: 'test@test.com', password: 'gatitos' })
                .expect('set-cookie', /connect.sid/)
                .expect(200);
            const responseUser: User = response.body;
            expect(responseUser).to.have.keys(['id', 'email', 'firstName', 'lastName', 'rooms']);
            expect(responseUser.id).to.be.a('number');
            expect(responseUser.email).to.equal('test@test.com');
            expect(responseUser.firstName).to.equal('Test');
            expect(responseUser.lastName).to.equal('Testl');
            expect(responseUser.rooms).to.deep.equal([]);
        });
    });

    describe('Register tests', () => {
        it('Should register a new user', async () => {
            const userRepository: Repository<User> = Container.get('UserRepository');
            const response = await supertest(app)
                .post('/register')
                .send({
                    email: 'alberto@test.com',
                    firstName: 'Alberto',
                    lastName: 'Luna',
                    password: 'gatitos'
                })
                .expect(200);
            const responseUser: User = response.body;
            expect(responseUser).to.have.keys(['id', 'email', 'firstName', 'lastName', 'rooms']);
            expect(responseUser.id).to.be.a('number');
            expect(responseUser.email).to.equal('alberto@test.com');
            expect(responseUser.firstName).to.equal('Alberto');
            expect(responseUser.lastName).to.equal('Luna');
            expect(responseUser.rooms).to.deep.equal([]);
            const savedUser = await userRepository.findOneById(responseUser.id);
            expect(savedUser).to.not.equal(undefined);
        });

        it('Should not be able to register if there is information missing', async () => {
            await supertest(app)
                .post('/register')
                .send({
                    email: 'alberto@test.com',
                    lastName: 'Luna',
                    password: 'gatitos'
                })
                .expect(400);
        });

        it('Should not be able to register if an user with the same email is already registered', async () => {
            await supertest(app)
                .post('/register')
                .send({
                    email: 'test@test.com',
                    firstName: 'Alberto',
                    lastName: 'Luna',
                    password: 'gatitos'
                })
                .expect(409);
        });

        it('Should not be able to register if the user is already logged', async () => {
            const agent = supertest.agent(app);
            await agent
                .post('/login')
                .send({ email: 'test@test.com', password: 'gatitos' })
                .expect(200);

            await agent.post('/register')
                .send({
                    email: 'alberto@test.com',
                    firstName: 'Alberto',
                    lastName: 'Luna',
                    password: 'gatitos'
                })
                .expect(400, {
                    message: 'You are already logged'
                });
        });
    });

    describe('Logout tests', () => {
        it('Should not be able to logout an unlogged request', async () => {
            await supertest(app)
                .post('/logout')
                .expect(401, {
                    message: 'You are not logged'
                });
        });

        it('Should logout the user', async () => {
            const agent = supertest.agent(app);
            await agent
                .post('/login')
                .send({ email: 'test@test.com', password: 'gatitos' })
                .expect(200);

            await agent.post('/logout')
                .expect(200);
        });
    });
});
