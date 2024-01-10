const {pick} = require('lodash');
const logger = require('../../config/log4js')('event-start-ctrl');
const User = require('../../shared/database/models/user.model');
const Event = require('../../shared/database/models/event.model');
const EventSetting = require('../../shared/database/models/eventSetting.model');
const Workshop = require('../../shared/database/models/workshop.model');
const {MISSING_PARAMS, NOT_FOUND} = require('../../shared/config/errors');
const {UNLIMITED_SIZE} = require("../../shared/config/constants");

exports.start = async function (req, res, next) {
  try {
    logger.info('Creating a new event and event settings');
    const {user, body} = req;

    if (!body.channelId) {
      return res.status(400).jsend.fail(new Error('Channel ID is missing'), {error: MISSING_PARAMS});
    }

    let UserId = user.id;
    if (user.id !== body.channelId) {
      const userChannel = await User.findByPk(body.channelId);
      UserId = userChannel.dataValues.id;
    }

    const newEvent = {
      UserId,
      creatorId: user.id,
      ...pick(body, Event.getAllowedFieldsByKey('create')),
      EventSetting: {
        ...pick(body.EventSetting || {}, EventSetting.getAllowedFieldsByKey('create'))
      }
    };

    if (body.workshopId) {
      newEvent.WorkshopId = body.workshopId;
      const workshop = await Workshop.findByPk(body.workshopId);

      if (!workshop) {
        return res.status(404).jsend.fail(new Error('Workshop does not exist'), {error: NOT_FOUND});
      }

      newEvent.paymentType = workshop.paymentType;
    }
    const event = await Event.create(newEvent, {include: ['EventSetting']});
    logger.info('New event: ', event);

    const eventFiltered = event.filterFieldsFor({key: 'getEager'});
    eventFiltered.participantsLimit = UNLIMITED_SIZE;  //this is instead of changing the db default value as in the future we will want to do premium
    eventFiltered.duration = 40;  //this is instead of changing the db default value as in the future we will want to do premium
    eventFiltered.streamDuration = 40;  //this is instead of changing the db default value as in the future we will want to do premium
    return res.status(200).jsend.success({
      event: eventFiltered,
      // event: event.filterFieldsFor({key: 'getEager'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

