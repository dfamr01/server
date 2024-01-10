const request = require('supertest');
const should = require('should');
const {app, postgre} = require('../../../server');


const {generateRandomToken} = require('../../../shared/utils');
const {USER_STATUS, ACCESS_TOKEN_TYPES} = require('../../../shared/config/constants');

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

describe('Authentication login Controller Unit Tests:', function () {

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


  describe(`Testing POST ${apiPath}login`, function () {
    describe('Testing happy path', function () {
      it('Should be able to login an existing user', function (done) {
        let accessToken = {
          token: generateRandomToken(),
          expireIn: 2419200,
          updatedAt: 'something',
          createdAt: 'something else'
        };

        agent
          .post(`${apiPath}login`)
          .set('Accept', 'application/json')
          .send(credentials)
          .expect('Content-Type', /json/)
          .expect(function (res) {
            res.body.data.accessToken = accessToken;
          })
          .expect(200, {
            status: 'success',
            statusCode: 200,
            data: {
              accessToken,
            },
          }, done);
      }); // End It
    }); // End Describe

    describe('Testing Error Handling', function () {
      it('Should send an error if the email is not registered', function (done) {
        let expectedMessage = 'Invalid email/password. Please try again.';
        credentials.email = 'maabs@maans.com';
        agent
          .post(`${apiPath}login`)
          .set('Accept', 'application/json')
          .send(credentials)
          .expect('Content-Type', /json/)
          .expect(401, {
            status: 'fail',
            statusCode: 401,
            data: null,
            message: expectedMessage,
          }, done);
      }); // End It

      it('Should send an error if the password is incorrect', function (done) {
        let expectedMessage = 'Invalid email/password. Please try again.';
        credentials.password = 'asdasdasd';
        agent
          .post(`${apiPath}login`)
          .set('Accept', 'application/json')
          .send(credentials)
          .expect('Content-Type', /json/)
          .expect(401, {
            status: 'fail',
            statusCode: 401,
            data: null,
            message: expectedMessage,
          }, done);
      }); // End It

      it('Should send an error if user provider is not local', function (done) {
        user.provider = 'facebook';
        let expectedMessage = `Not local user trying to login. Provider ->${user.provider}`;
        user.save().then(() => {
          agent
            .post(`${apiPath}login`)
            .set('Accept', 'application/json')
            .send(credentials)
            .expect('Content-Type', /json/)
            .expect(401, {
              status: 'fail',
              statusCode: 401,
              data: null,
              message: expectedMessage,
            }, done);
        }).catch();
      }); // End It

    }); // End Describe
  });
}); // End Describe
