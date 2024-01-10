const logger = require('../../config/log4js')('workshop-delete-registration-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');

const {destroyWorkshopRegistrations} = require('../../shared/helpers/registration.help');

exports.deleteRegistration = async function (req, res, next) {
  try {
    const {user, workshop, workshopRegistration} = req;

    // todo: send refund in-case this is a paid workshop
    return res.status(200).jsend.success({
      res: await sequelize.transaction(async (t) => {
        const destroyDetails = {
          UserId: user.id,
          WorkshopId: workshop.id,
          t
        };
        return {
          events: await destroyWorkshopRegistrations(destroyDetails),
          workshop: await workshopRegistration.destroy({transaction: t})
        };
      })
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

