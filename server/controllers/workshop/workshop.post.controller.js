const {pick} = require('lodash');
const logger = require('../../config/log4js')('workshop-post-ctrl');
const Workshop = require('../../shared/database/models/workshop.model');
const WorkshopSetting = require('../../shared/database/models/workshopSetting.model');

exports.post = async function (req, res, next) {
  //   todo allow creation of workshops by different users.
  try {
    const {user} = req;
    logger.info('Creating a new workshop and workshop settings');
    const newWorkshop = {
      UserId: user.id,
      ...pick(req.body, Workshop.getAllowedFieldsByKey('create')),
      WorkshopSetting: {
        ...pick(req.body.WorkshopSetting || {}, WorkshopSetting.getAllowedFieldsByKey('create'))
      }
    };
    const workshop = await Workshop.create(newWorkshop, {include: ['WorkshopSetting']});
    logger.info('New workshop: ', workshop);

    return res.status(200).jsend.success({
      workshop: workshop.filterFieldsFor({key: 'getEager'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

