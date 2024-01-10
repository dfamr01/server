const logger = require('../../config/log4js')('event-find-ctrl');
const Payout = require('../../shared/database/models/payout.model');

exports.find = async function (req, res, next, id) {
  try {
    const options = {
      where: {
        id,
        UserId: req.user.id
      }
    };
    const payout = await Payout.findOne(options);

    if (!payout) {
      return res.status(404).jsend.fail(new Error('Payout does not exist'));

    }
    req.payout = payout;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

