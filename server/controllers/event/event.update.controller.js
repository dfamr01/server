const logger = require('../../config/log4js')('event-update-ctrl');
const {EVENT_STATUS} = require('../../shared/config/constants');
const {hasTransactions} = require('../../shared/helpers');
const {canUpdateEvent} = require("../../shared/utils");

exports.update = async function (req, res, next) {
  try {
    let {event, body} = req;

    const isEdit = event.status !== EVENT_STATUS.STARTED.key;
    const {coverPhotoDetails, ...eventDetails} = body;

    if (isEdit && eventDetails.isLive && event.Occurrences.length < 1) {
      return res.status(400).jsend.fail(new Error('Validation Error'), {isLive: 'You cannot change event to live without having a date.'});
    }

    const newPrice = body.hasOwnProperty('price') ? +body.price : false;
    const newDuration = body.hasOwnProperty('duration') ? +body.duration : false;
    const newParticipantsLimit = body.hasOwnProperty('participantsLimit') ? +body.participantsLimit : false;
    const newCurrency = body.hasOwnProperty('currency') ? body.currency : false;

    if (isEdit && body.paymentType && (body.paymentType !== event.paymentType)) {
      return res.status(400).jsend.fail(new Error('You cannot change payment type'), {error: 'paymentTypeNoUpdate'});
    }

    const updateError = canUpdateEvent({
      price: event.price,
      newPrice: newPrice,
      currency: event.currency,
      newCurrency: newCurrency,
      participantsLimit: event.participantsLimit,
      newParticipantsLimit: newParticipantsLimit
    });

    if (updateError) {
      let options = {EventId: event.id};
      if (event.WorkshopId) {
        options = {WorkshopId: event.WorkshopId}; //checks for workshop transaction
      }
      const transactions = await hasTransactions(options);
      if (transactions) {
        return res.status(400).jsend.fail(new Error(`${updateError}, has there is active transaction`), {error: 'hasTransactionNoUpdate'});
      }
    }

    const updatedEvent = await event.filterUpdateFieldsFor({key: 'update', data: eventDetails});
    return res.status(200).jsend.success({
      event: updatedEvent.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

