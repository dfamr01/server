const logger = require('../../config/log4js')('workshop-delete-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');
const Occurrence = require('../../shared/database/models/occurrence.model');
const {WORKSHOP_STATUS, EVENT_STATUS} = require('../../shared/config/constants');
const {isWorkshopDeleted} = require('../../shared/utils');
const {refundWorkshop} = require('../../shared/helpers/workshop.help');

exports.workshopDelete = async function (req, res, next) {
  try {
    const {workshop, user} = req;
    if (isWorkshopDeleted(workshop.status)) {
      return res.status(404).jsend.fail(new Error('You cannot delete workshop thats already been deleted'), {error: 'workshopDeleted'});
    }
    await sequelize.transaction(async (t) => {
      const options = {transaction: t};
      const events = await workshop.getEvents({
        where: {status: EVENT_STATUS.PUBLISHED.key},
        attributes: ['id', 'isLive', 'paymentType'],
        include: {
          model: Occurrence,
          attributes: ['id', 'date'],
        },
        ...options
      });
      
      const canDelete = await refundWorkshop({workshop, events, creator: user, t});
      if (canDelete) {
        await workshop.destroy(options);
      } else {
        logger.info('Marking workshop as delete as there either no live events or all events are in past.');
        workshop.status = WORKSHOP_STATUS.DELETED.key;
        await workshop.save(options);
      }
    });

    return res.status(200).jsend.success({res: true});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

