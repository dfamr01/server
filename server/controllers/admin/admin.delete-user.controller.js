const logger = require('../../config/log4js')('admin-delete-user');
const {USER_STATUS} = require('../../shared/config/constants');

exports.deleteUser = async function (req, res, next) {
  try {
    const {foundUser} = req;
    foundUser.status = USER_STATUS.DELETED.key;
    await foundUser.save();
    // update all events, workshops, payout status to deleted.
    return res.status(200).jsend.success({success: true});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

