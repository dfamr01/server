const logger = require('../../config/log4js')('admin-find-payout');
const Payout = require('../../shared/database/models/payout.model');

exports.findPayout = async function (req, res, next, id) {
  try {
    const payout = await Payout.findOne({where: {id}});

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

