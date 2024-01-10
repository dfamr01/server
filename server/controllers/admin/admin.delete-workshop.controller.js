const logger = require('../../config/log4js')('admin-delete-workshop');
const {WORKSHOP_STATUS} = require('../../shared/config/constants');

exports.deleteWorkshop = async function (req, res, next) {
  try {
    const {workshop} = req;
    workshop.status = WORKSHOP_STATUS.DELETED.key;
    await workshop.save();
    // update all events, status to deleted.
    return res.status(200).jsend.success({success: true});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

