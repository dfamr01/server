const {pick} = require('lodash');
const logger = require('../../config/log4js')('workshop-start-ctrl');
const User = require('../../shared/database/models/user.model');
const Workshop = require('../../shared/database/models/workshop.model');
const WorkshopSetting = require('../../shared/database/models/workshopSetting.model');
const {MISSING_PARAMS} = require('../../shared/config/errors');
const {UNLIMITED_SIZE} = require("../../shared/config/constants");

exports.start = async function (req, res, next) {
  try {
    logger.info('Creating a new workshop and workshop settings');
    const {user, body} = req;

    if (!body.channelId) {
      return res.status(400).jsend.fail(new Error('Channel ID is missing'), {error: MISSING_PARAMS});
    }

    let UserId = user.id;
    if (user.id !== body.channelId) {
      const userChannel = await User.findByPk(body.channelId);
      UserId = userChannel.dataValues.id;
    }

    const newWorkshop = {
      UserId,
      creatorId: user.id,
      ...pick(body, Workshop.getAllowedFieldsByKey('create')),
      WorkshopSetting: {
        ...pick(body.WorkshopSetting || {}, WorkshopSetting.getAllowedFieldsByKey('create'))
      }
    };

    const workshop = await Workshop.create(newWorkshop, {include: ['WorkshopSetting']});
    logger.info('New workshop: ', workshop);

    const filteredWorkshop = workshop.filterFieldsFor({key: 'getEager'});
    filteredWorkshop.participantsLimit = UNLIMITED_SIZE; //this is instead of changing the db default value as in the future we will want to do premium

    return res.status(200).jsend.success({
      workshop: filteredWorkshop,
      // workshop: workshop.filterFieldsFor({key: 'getEager'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

