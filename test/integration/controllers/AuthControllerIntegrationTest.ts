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
            .expect(200);
        const responseUser: User = response.body;
        expect(responseUser).to.have.keys(['id', 'email', 'firstName', 'lastName', 'rooms']);
        expect(responseUser.email).to.equal('test@test.com');
        expect(responseUser.firstName).to.equal('Test');
        expect(responseUser.lastName).to.equal('Testl');
        expect(responseUser.rooms).to.deep.equal([]);
    });
});
