const logger = require('../../config/log4js')('workshop-get-all-registration-ctrl');
const WorkshopRegistration = require('../../shared/database/models/workshopRegistration.model');

exports.getAllRegistration = async function (req, res, next) {
  try {
    const {user} = req;
    let {ids} = req.query;

    const query = {
      where: {
        UserId: user.id
      }
    };

    if (ids && ids.length) {
      query.where.WorkshopId = ids;
    }

    return res.status(200).jsend.success({
      registrations: await WorkshopRegistration.findAll(query),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }

};

