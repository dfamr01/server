const request = require('supertest');
const should = require('should');
const {app, postgre} = require('../../../server');

const logger = require('../../../config/log4js')('test');
const {generateRandomToken} = require('../../../shared/utils');

const User = require('../../../shared/database/models/user.model');

if (process.env.NODE_ENV === 'production') {
  logger.warn('Don\'t run tests on production environment.');
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
const apiPath = '/api/v1/';
const testUser = {
  email: 'testuser001@mail.com',
  password: 'Passw0rd',
  UserSetting: {},
  UserProfile: {firstName: 'a', lastName: 'b'},
  AccessTokens: [],
  AccessControls: []
};
let dbUser;
let agent;
let accessToken;

describe('Authentication Require Login Controller Unit Tests:', function () {

  /**
   * Before all tests:
   * set user data
   * clean users collection
   * create a new test user local user
   * save the test user
   **/
  before(function (done) {
    User.destroy({
      where: {email: testUser.email}
    })
      .then(() => {
        const user = User.create(testUser, {include: ['UserSetting', 'UserProfile', 'AccessTokens', 'AccessControls']})
          .then((user) => {
            dbUser = user;
            done();
          });
      });
  }); // End Before

  /**
   * Before each test:
   * request for a new request agent
   * sign in the user
   **/
  beforeEach(function (done) {
    agent = request.agent(app);
    agent
      .post(`${apiPath}auth/login`)
      .set('Accept', 'application/json')
      .send({email: testUser.email, password: testUser.password})
      .expect(200)
      .end(function (err, res) {
        accessToken = res.body.data.accessToken;
        done(err);
      });
  }); // End Before Each

  /**
   * After all tests:
   * clean users collection
   **/
  after(function (done) {
    dbUser.destroy().finally(done);
  }); // End After

  describe(`Testing Require Login with endpoint GET ${apiPath}user/eager`, function () {
    describe('Testing Success With Valid Token', function () {
      it('Should retrieve the profile of the user with status success', function (done) {

        agent
          .get(`${apiPath}user/eager`)
          .set('Authorization', accessToken.token)
          .expect('Content-Type', /json/)
          .expect(200, done);
      }); // End It
    }); // End Describe

    describe('Testing Unauthorized With No Token Provided', function () {
      it('Should return status 401 of unauthorized', function (done) {

        agent
          .get(`${apiPath}user/eager`)
          .expect('Content-Type', /json/)
          .expect(401, {
            status: 'fail',
            statusCode: 401,
            data: {error: 'Error'},
            message: 'Unauthorized'
          }, done);
      }); // End It
    }); // End Describe

    describe('Testing Unauthorized With Invalid Token', function () {
      it('Should return status 401 of unauthorized', function (done) {

        agent
          .get(`${apiPath}user/eager`)
          .expect('Content-Type', /json/)
          .set('Authorization', `JWT ${generateRandomToken()}`)
          .expect(401, {
            status: 'fail',
            statusCode: 401,
            data: {error: 'JsonWebTokenError'},
            message: 'Unauthorized'
          }, done);
      }); // End It
    }); // End Describe
  }); // End Describe
}); // End Describe
