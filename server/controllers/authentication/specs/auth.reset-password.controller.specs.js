const request = require('supertest');
const should = require('should');
const {app, postgre} = require('../../../server');

const logger = require('../../../config/log4js')('test');
const {ACCESS_TOKEN_TYPES} = require('../../../shared/config/constants');

const User = require('../../../shared/database/models/user.model');
const AccessTokens = require('../../../shared/database/models/accessToken.model');


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

const apiPath = '/api/v1/auth/';
const testUser = {
  email: 'testuser001@mail.com',
  password: 'Passw0rd',
  UserProfile: {firstName: 'firstName', lastName: 'firstName'},
};
let agent;
let user;
let newPassword;

describe('Authentication Reset Password Controller Unit Tests:', function () {

  /**
   * Before all tests:
   * create a new test user
   * set the newPassword to test
   * clean users collection
   * save the test user
   **/
  before(function (done) {
    newPassword = 'Sup3rStr0ngP4$$w0rd';
    User.destroy({where: {email: testUser.email}})
      .then(() => {
        return User.create(testUser, {include: ['UserProfile']})
          .then((newUser) => {
            return user = newUser;
          });
      })
      .finally(done);
  }); // End Before

  beforeEach(function (done) {
    agent = request.agent(app);
    done();
  }); // End Before Each

  /**
   * After all tests:
   * clean users collection
   **/
  after(function (done) {
    user.destroy().finally(done);
  }); // End After

  describe(`Testing POST ${apiPath}reset-password/:resetToken`, function () {
    describe('Testing happy path', function () {
      it('Should change the password of a user using a reset token', function (done) {

        // request for a reset token
        agent
          .post(`${apiPath}forgot-password`)
          .set('Accept', 'application/json')
          .send({email: testUser.email})
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            // retrieve token from the db
            User.findOne({
              where: {email: testUser.email},
              include: {
                model: AccessTokens,
                where: {
                  type: ACCESS_TOKEN_TYPES.RESET_PASSWORD.key
                }
              }
            })
              .then((user) => {
                let accessToken = {};
                try {
                  should.exist(user.AccessTokens);
                  (user.AccessTokens).should.be.an.Array();
                  accessToken = user.AccessTokens[0];
                  should.exist(accessToken);
                } catch (e) {
                  done(e);
                }
                // change password
                agent
                  .post(`${apiPath}reset-password/${accessToken.token}`)
                  .set('Accept', 'application/json')
                  .send({password: newPassword})
                  .expect('Content-Type', /json/)
                  .expect(200, done);

              })
              .catch(done);
          });
      }); // End It

      it('Should not be able to sign in with the old password', function (done) {
        // old password should not work
        agent
          .post(`${apiPath}login`)
          .set('Accept', 'application/json')
          .send({email: user.email, password: user.password})
          .expect('Content-Type', /json/)
          .expect(401, done);
      }); // End It

      it('Should be able to sign in with the new password', function (done) {
        // sign in with the new password should work
        agent
          .post(`${apiPath}login`)
          .set('Accept', 'application/json')
          .send({email: user.email, password: newPassword})
          .expect('Content-Type', /json/)
          .expect(200, done);
      });  // End It
    }); // End Describe


    describe('Testing Error Handling', function () {
      it('Should send an error if the password was used before. ', function (done) {

        let expectedMessage = 'You cannot use password you have used before!';
        agent
          .post(`${apiPath}forgot-password`)
          .set('Accept', 'application/json')
          .send({email: testUser.email})
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            // retrieve token from the db
            User.findOne({
              where: {email: testUser.email},
              include: {
                model: AccessTokens,
                where: {
                  type: ACCESS_TOKEN_TYPES.RESET_PASSWORD.key
                }
              }
            })
              .then((user) => {
                let accessToken = {};
                try {
                  should.exist(user.AccessTokens);
                  (user.AccessTokens).should.be.an.Array();
                  accessToken = user.AccessTokens[0];
                  should.exist(accessToken);
                } catch (e) {
                  done(e);
                }

                // change password to an old password
                agent
                  .post(`${apiPath}reset-password/${accessToken.token}`)
                  .set('Accept', 'application/json')
                  .send({password: testUser.password})
                  .expect('Content-Type', /json/)
                  .expect(401, {
                    status: 'fail',
                    statusCode: 401,
                    data: null,
                    message: expectedMessage,
                  }, done);

              })
              .catch(done);
          });
      }); // End It
    });
  }); // End Describe
}); // End Describe
