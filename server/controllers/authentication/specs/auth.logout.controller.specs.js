const request = require('supertest');
const should = require('should');
const {app, postgre} = require('../../../server');

const User = require('../../../shared/database/models/user.model');

if (process.env.NODE_ENV === 'production') {
  //  logger.warn('Do NOT run tests on production environment.');
  process.exit(1);
}

//  using timeout because next.tick seems too fast.
setTimeout(() => {
  postgre.then((res) => {
    setTimeout(() => {
      run();
    }, 10000);
  });//.catch(() => {});
}, 1000);

const apiPath = '/api/v1/auth/';
const testUser = {
  email: 'testuser001@mail.com',
  password: 'Passw0rd',
};

let user;
let agent;
let credentials = {};

describe('Authentication logout Controller Unit Tests:', function () {

  /**
   * Before all tests:
   * create a new test user
   * set the newPassword to test
   * clean users collection
   * save the test user
   **/
  before(function (done) {
    User.destroy({where: {email: testUser.email}})
      .then(() => {
        return User.create(testUser)
          .then((newUser) => {
            return user = newUser;
          });
      })
      .finally(done);
  }); // End Before

  beforeEach(function (done) {
    agent = request.agent(app);
    credentials = {email: testUser.email, password: testUser.password};
    done();
  }); // End Before Each

  /**
   * After all tests:
   * clean users collection
   **/
  after(function (done) {
    user.destroy().finally(done);
  }); // End After


  describe(`Testing POST ${apiPath}logout`, function () {
    describe('Testing logout when user is not logged in', function () {
      it('Should redirect even if the user is not logged in', function (done) {
        agent
          .get(`${apiPath}logout`)
          .expect(200, done);
      }); // End It
    }); // End Describe

    describe('Testing logout when user is logged in', function () {
      it('Should sign out the user once is logged in', function (done) {
        agent
          .post(`${apiPath}login`)
          .set('Accept', 'application/json')
          .send(credentials)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            agent
              .get(`${apiPath}logout`)
              .expect(200, done);
          });
      }); // End It
    });

  });
}); // End Describe
