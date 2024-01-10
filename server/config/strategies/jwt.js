const passport = require('passport');
const passportJwt = require('passport-jwt');
const logger = require('../log4js')('strategies.jwt');

const config = require('../config');
const User = require('../../shared/database/models/user.model');

const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: config.secret,
};

module.exports = function () {
  passport.use(new JwtStrategy(jwtOptions, (payload, done) => {
    User.findByPk(payload.id, {include: User.includesForAuth}).then((user) => {
      if (!user) {
        const message = new Error(`User: ${payload.id} not found!`);
        logger.error(message);
        return done(null, false, message);
      }

      return done(null, user);
    })
      .catch(done);
  }));
};
