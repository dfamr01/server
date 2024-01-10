const logger = require('../../config/log4js')('workshop-post-registration-ctrl');
const {createWorkshopRegistration} = require('../../shared/helpers/registration.help');

exports.postRegistration = async function (req, res, next) {
  try {
    const {user, workshop} = req;
    const registration = await createWorkshopRegistration({UserId: user.id, workshop}).catch((error) => {
      return res.status(409).jsend.fail(error);
    });
    return res.status(200).jsend.success({
      registration: registration,
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

