const request = require('supertest');
const should = require('should');
const {app, postgre} = require('../../../server');

const logger = require('../../../config/log4js')('test');
//  const User = require('../../../shared/database/models/user.model');

let user;
let userDB;
let agent;
let token;

if (process.env.NODE_ENV === 'production') {
  logger.warn('Do NOT run tests on production environment.');
  process.exit(1);
}

describe('Authentication Role Authorization Controller Unit Tests:', function () {

  /**
   * Before all tests:
   * set user data
   * clean users collection
   * create a new test user local user
   * save the test user
   *
   before(function (done) {
    user = {
      name: 'Barry Allen',
      email: 'allen@starlabs.org',
      password: 'Th3Flash!',
      provider: 'local',
    };

    User.remove(function (err) {
      if (err) {
        return done(err);
      }

      userDB = new User(user);

      userDB.save(done);
    });
  }); // End Before

   /**
   * Before each test:
   * request for a new request agent
   * sign in the user
   *
   beforeEach(function (done) {
    agent = request.agent(app);
    agent
      .post('/api/auth/signin')
      .set('Accept', 'application/json')
      .send({ email: user.email, password: user.password })
      .expect(200)
      .end(function (err, res) {
        token = res.body.data.token;
        done(err);
      });
  }); // End Before Each

   /**
   * After each test:
   * remove the role of the user
   *
   afterEach(function (done) {
    userDB.update({ role: undefined }, done);
  }); // End After Each

   describe('Testing role USER on GET /api/test/only/user', function () {

    describe('Testing Success', function () {
      it('Should return status 200 of success', function (done) {
        userDB.update({ role: 'USER' }, function (err) {
          if (err) {
            return done(err);
          }

          agent
            .get('/api/test/only/user')
            .set('Authorization', token)
            .expect('Content-Type', /json/)
            .expect(200, done);
        });
      }); // End It
    }); // End Describe

    describe('Testing Unauthorized', function () {
      it('Should return status 401 of unauthorized with no role', function (done) {
        agent
          .get('/api/test/only/user')
          .set('Authorization', token)
          .expect('Content-Type', /json/)
          .expect(401, done);
      }); // End It

      it('Should return status 401 of unauthorized with different role', function (done) {
        userDB.update({ role: 'ADMIN' }, function (err) {
          if (err) {
            return done(err);
          }

          agent
            .get('/api/test/only/user')
            .set('Authorization', token)
            .expect('Content-Type', /json/)
            .expect(401, done);
        });
      }); // End It
    }); // End Describe
  }); // End Describe

   describe('Testing role ADMIN on GET /api/test/only/admin', function () {

    describe('Testing Success', function () {
      it('Should return status 200 of success', function (done) {
        userDB.update({ role: 'ADMIN' }, function (err) {
          if (err) {
            return done(err);
          }

          agent
            .get('/api/test/only/admin')
            .set('Authorization', token)
            .expect('Content-Type', /json/)
            .expect(200, done);
        });
      }); // End It
    }); // End Describe

    describe('Testing Unauthorized', function () {
      it('Should return status 401 of unauthorized with no role', function (done) {
        agent
          .get('/api/test/only/admin')
          .set('Authorization', token)
          .expect('Content-Type', /json/)
          .expect(401, done);
      }); // End It

      it('Should return status 401 of unauthorized with different role', function (done) {
        userDB.update({ role: 'USER' }, function (err) {
          if (err) {
            return done(err);
          }

          agent
            .get('/api/test/only/admin')
            .set('Authorization', token)
            .expect('Content-Type', /json/)
            .expect(401, done);
        });
      }); // End It
    }); // End Describe
  }); // End Describe
   */
}); // End Describe
