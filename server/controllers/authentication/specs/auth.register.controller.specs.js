const request = require('supertest');
const should = require('should');
const {app, postgre} = require('../../../server');

const {generateRandomToken} = require('../../../shared/utils');
const {USER_STATUS} = require('../../../shared/config/constants');

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

const apiPath = '/api/v1/auth/register';
const testUser = {
  firstName: 'John Doe',
  lastName: 'John Doe',
  email: 'testuser001@mail.com',
  password: 'Passw0rd',
  timezone: 'America/Los_Angeles',
};
let user;
let agent;

describe('Authentication register Controller Unit Tests:', function () {

  /**
   * Before all tests:
   * clean users collection.
   */
  before(function (done) {
    User.destroy({
      where: {email: testUser.email}
    }).finally(done);
  }); // End Before

  /**
   * Before each test:
   * request for a new request agent
   * reset user's name, email and password properties.
   */
  beforeEach(function (done) {
    agent = request.agent(app);
    user = {...testUser};
    done();
  }); // End Before Each

  /**
   * After each test:
   * clean users collection
   */
  afterEach(function (done) {
    User.destroy({
      where: {email: testUser.email}
    }).finally(done);
  }); // End After Each

  describe(`Testing POST ${apiPath}`, function () {

    it('Should be able to register a new user', function (done) {

      let accessToken = {
        token: generateRandomToken(),
        expireIn: 2419200,
        updatedAt: 'something',
        createdAt: 'something else'
      };
      agent
        .post(apiPath)
        .set('Accept', 'application/json')
        .send(user)
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

    describe('Testing Error Handling', function () {

      describe('Testing firstName Validation', function () {
        it('Should send an error if the firstName is not provided', function (done) {

          let expectedMessage = 'firstName is required.';
          user.firstName = null;
          agent
            .post(apiPath)
            .set('Accept', 'application/json')
            .send(user)
            .expect('Content-Type', /json/)
            .expect(422, {
              status: 'fail',
              statusCode: 422,
              data: null,
              message: expectedMessage,
            }, done);
        }); // End It
      }); // End Describe

      describe('Testing lastName Validation', function () {
        it('Should send an error if the lastName is not provided', function (done) {

          let expectedMessage = 'lastName is required.';
          user.lastName = null;
          agent
            .post(apiPath)
            .set('Accept', 'application/json')
            .send(user)
            .expect('Content-Type', /json/)
            .expect(422, {
              status: 'fail',
              statusCode: 422,
              data: null,
              message: expectedMessage,
            }, done);
        }); // End It
      }); // End Describe


      describe('Testing Email Validation', function () {
        it('Should send an error if the email is invalid', function (done) {

          let expectedMessage = 'Please enter a valid email address.';
          user.email = 'no_email.com';
          agent
            .post(apiPath)
            .set('Accept', 'application/json')
            .send(user)
            .expect('Content-Type', /json/)
            .expect(422, {
              status: 'fail',
              statusCode: 422,
              data: null,
              message: expectedMessage,
            }, done);
        }); // End It

        it('Should send an error if the email is not provided', function (done) {

          let expectedMessage = 'Email is required.';
          user.email = null;
          agent
            .post(apiPath)
            .set('Accept', 'application/json')
            .send(user)
            .expect('Content-Type', /json/)
            .expect(422, {
              status: 'fail',
              statusCode: 422,
              data: null,
              message: expectedMessage,
            }, done);
        }); // End It

        it('Should send an error if the email is duplicated', function (done) {

          let expectedMessage = 'That email already exists. Please type in another email and try again.';
          // Register first user
          agent
            .post(apiPath)
            .set('Accept', 'application/json')
            .send(user)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }

              // register second user with the same email
              request(app)
                .post(apiPath)
                .set('Accept', 'application/json')
                .send(user)
                .expect('Content-Type', /json/)
                .expect(409, {
                  status: 'fail',
                  statusCode: 409,
                  data: null,
                  message: expectedMessage,
                }, done);
            });

        }); // End It
      }); // End Describe

      describe('Testing Password Validation', function () {
        it('Should send an error if the password is not provided', function (done) {

          let expectedMessage = 'Password is required.';
          user.password = null;
          agent
            .post(apiPath)
            .set('Accept', 'application/json')
            .send(user)
            .expect('Content-Type', /json/)
            .expect(422, {
              status: 'fail',
              statusCode: 422,
              data: null,
              message: expectedMessage,
            }, done);
        }); // End It
      }); // End Describe
    }); // End Describe
  }); // End Describe
}); // End Describe
