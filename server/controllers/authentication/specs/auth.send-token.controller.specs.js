const request = require('supertest');
const should = require('should');
const {app, postgre} = require('../../../server');

const {generateRandomToken} = require('../../../shared/utils');
const {USER_STATUS, ACCESS_TOKEN_TYPES} = require('../../../shared/config/constants');

const User = require('../../../shared/database/models/user.model');
const AccessTokens = require('../../../shared/database/models/accessToken.model');

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
  firstName: 'John Doe',
  lastName: 'John Doe',
  email: 'testuser001@mail.com',
  password: 'Passw0rd',
  timezone: 'America/Los_Angeles',
};
let user;
let agent;
let newPassword;

describe('Authentication send-token Controller Unit Tests:', function () {

  /**
   * Before all tests:
   * clean users collection.
   */
  before(function (done) {
    newPassword = 'Sup3rStr0ngP4$$w0rd';
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
    done();
  }); // End Before Each

  /**
   * After all tests:
   * clean users collection
   **/
  after(function (done) {
    User.destroy({
      where: {email: testUser.email}
    }).finally(done);
  }); // End After

  describe(`Testing POST ${apiPath}register`, function () {

    it('Should send a token after register a new user', function (done) {
      let accessToken = {
        token: generateRandomToken(),
        expireIn: 2419200,
        updatedAt: 'something',
        createdAt: 'something else'
      };
      agent
        .post(`${apiPath}register`)
        .set('Accept', 'application/json')
        .send(testUser)
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

    it('Should send a token after login', function (done) {
      let accessToken = {
        token: generateRandomToken(),
        expireIn: 2419200,
        updatedAt: 'something',
        createdAt: 'something else'
      };
      agent
        .post(`${apiPath}login`)
        .set('Accept', 'application/json')
        .send({email: testUser.email, password: testUser.password})
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

    it('Should send a token after reset password', function (done) {
      let fixedAccessToken = {
        token: generateRandomToken(),
        expireIn: 2419200,
        updatedAt: 'something',
        createdAt: 'something else'

      };
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
                .expect(function (res) {
                  res.body.data.accessToken = fixedAccessToken;
                })
                .expect(200, {
                  status: 'success',
                  statusCode: 200,
                  data: {
                    accessToken: fixedAccessToken,
                  },
                }, done);

            })
            .catch(done);
        });
    }); // End It
  }); // End Describe
}); // End Describe
