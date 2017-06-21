import * as supertest from 'supertest';
import { startUpAPI } from '../../../src';

let app;

describe('AuthController integration tests', () => {

    before(async () => {
        app = await startUpAPI();
    });

    it('Should not be able to login', (done) => {
        supertest(app)
            .post('/login')
            .send({ email: 'notfound', passwor: 'notdefined' })
            .expect(403)
            .end(done);
    });
});
