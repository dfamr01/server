const {pick} = require('lodash');
const logger = require('../../config/log4js')('event-post-ctrl');
const Event = require('../../shared/database/models/event.model');
const EventSetting = require('../../shared/database/models/eventSetting.model');
const {createLobbyRoom} = require("../../websocket/chat/chatUtils/chatHelpers");

exports.post = async function (req, res, next) {
  //   todo allow creation of events by different users.
  try {
    const {user} = req;
    logger.info('Creating a new event and event settings');
    const newEvent = {
      UserId: user.id,
      ...pick(req.body, Event.getAllowedFieldsByKey('create')),
      EventSetting: {
        ...pick(req.body.EventSetting || {}, EventSetting.getAllowedFieldsByKey('create'))
      }
    };

    const event = await Event.create(newEvent, {include: ['EventSetting']});
    logger.info('New event: ', event);

    createLobbyRoom(user.id, event.id);

    return res.status(200).jsend.success({
      event: event.filterFieldsFor({key: 'getEager'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

