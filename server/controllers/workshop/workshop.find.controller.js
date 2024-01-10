const logger = require('../../config/log4js')('workshop-find-ctrl');
const Workshop = require('../../shared/database/models/workshop.model');

exports.find = async function (req, res, next, id) {
  try {
    const workshop = await Workshop.findOne({where: {id}, include: Workshop.includesForGet});

    if (!workshop) {
      return res.status(404).jsend.fail(new Error('Workshop does not exist'));

    }
    req.workshop = workshop;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

