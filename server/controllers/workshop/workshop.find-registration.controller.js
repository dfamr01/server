const logger = require('../../config/log4js')('workshop-find-registration-ctrl');
const WorkshopRegistration = require('../../shared/database/models/workshopRegistration.model');

exports.findRegistration = async function (req, res, next, id) {
  try {
    const workshopRegistration = await WorkshopRegistration.findByPk(id);

    if (!workshopRegistration) {
      return res.status(404).jsend.fail(new Error('Workshop registration does not exist'));
    }

    req.workshopRegistration = workshopRegistration;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

