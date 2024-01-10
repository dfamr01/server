const request = require('supertest');
const should = require('should');
const {app, postgre} = require('../../../server');
const logger = require('../../../config/log4js')('test');


const {ACCESS_TOKEN_TYPES} = require('../../../shared/config/constants');

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

const apiPath = '/api/v1/auth/forgot-password';
const testUser = {
  email: 'testuser001@mail.com',
  password: 'Passw0rd',
  UserProfile: {firstName: 'firstName', lastName: 'firstName'},
};
let dbUser;
let credentials;
let agent;

describe('Authentication Forgot Password Controller Unit Tests:', function () {

  /**
   * Before all tests:
   * create a new test user local user
   **/
  before(function (done) {
    User.destroy({
      where: {email: testUser.email}
    })
      .then(() => {
        return User.create(testUser, {include: ['UserProfile']})
          .then((user) => {
            dbUser = user;
            done();
          });
      });
  }); // End Before

  /**
   * Before each test:
   * reset credentials
   * */
  beforeEach(function (done) {
    agent = request.agent(app);
    credentials = {email: testUser.email, password: testUser.password};
    done();
  }); // End Before Each

  /**
   * After all tests:
   * clean users collection
   *
   **/
  after(function (done) {
    dbUser.destroy()
      .finally(done);
  }); // End After

  describe(`Testing POST ${apiPath}`, function () {
    describe('Testing happy path', function () {
      it('Should create a reset token for the user and save it', function (done) {
        agent
          .post(apiPath)
          .set('Accept', 'application/json')
          .send({email: testUser.email})
          .expect('Content-Type', /json/)
          .expect(200, {
            status: 'success',
            statusCode: 200,
            data: {
              title: 'Password Link Sent!',
              message: 'Please check your email for the link to reset your password!',
            }
          })
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            // verify token is saved in db
            const type = ACCESS_TOKEN_TYPES.RESET_PASSWORD.key;
            dbUser.getAccessTokens({where: {type}})
              .then(([accessToken]) => {
                try {
                  should.exist(accessToken);
                  done();
                } catch (e) {
                  done(e);
                }
              }).catch(function (errorNess) {
              done(e)
            });
          });
      }); // End It

      it('Should send an error if the email does not exist in the db', function (done) {

        let expectedMessage = 'Something went wrong, try again.';
        agent
          .post(apiPath)
          .set('Accept', 'application/json')
          .send({email: 'incorrect@email.com'})
          .expect('Content-Type', /json/)
          .expect(422, {
            status: 'fail',
            statusCode: 422,
            data: null,
            message: expectedMessage,
          }, done);
      }); // End It

      it('Should send an error if the user signed up with social media', function (done) {

        let expectedMessage = 'User signed up with social media.';
        dbUser.provider = 'facebook';
        dbUser.save()
          .then(() => {
            agent
              .post(apiPath)
              .set('Accept', 'application/json')
              .send({email: testUser.email})
              .expect('Content-Type', /json/)
              .expect(422, {
                status: 'fail',
                statusCode: 422,
                data: null,
                message: expectedMessage,
              }, done);
          })
          .catch(done);
      }); // End It
    }); // End Describe
  });// End describe
}); // End Describe
