const passport = require('passport');
const logger = require('../../../config/log4js')('auth-jwtLogin-ctrl');

function jwtLoginPromisified(socket, req, res = {}, next = () => {
}) {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', (err, user, info) => {
      if (err) {
        logger.error(err);
        return reject(err);
      }

      if (!user) {
        logger.error(info);
        const errorMsg = info.name === 'TokenExpiredError' ? info.name : 'Unauthorized';
        return reject(new Error(errorMsg));
      }
      socket.user = user;
      return resolve(user);
    })(req, res, next);
  });
}

exports.jwtLogin = async function jwtLogin(io, req, socket, user, {token}, cb) {
  socket.request.headers.authorization = token;
  //  console.log('socket.request.user', socket.request.user);
  try {
    await jwtLoginPromisified(socket, req, {}, () => {
    });
    cb({status: 'ok'});
  } catch (e) {
    cb({status: 'error', message: e.message});
  }
};