const logger = require('../../config/log4js')('workshop-get-container-ctrl');
const {WORKSHOP_STATUS, EVENT_STATUS} = require('../../shared/config/constants');
const {getWorkshopSchedule, getEventsCount, isWorkshopInFuture, isWorkshopDeleted} = require('../../shared/utils');
const Occurrence = require('../../shared/database/models/occurrence.model');


exports.getContainer = async function (req, res, next) {
  try {
    let {adminView} = req.query;
    const {workshop} = req;

    if (isWorkshopDeleted(workshop.status)) {
      return res.status(404).jsend.fail(new Error('Workshop is Deleted'), {error: 'workshopIsDeleted'});
    }

    if (!adminView && workshop.status !== WORKSHOP_STATUS.PUBLISHED.key) {
      return res.status(404).jsend.fail(new Error('Unable to fetch this workshop'));
    }

    const events = await workshop.getEvents({
      where: {status: EVENT_STATUS.PUBLISHED.key},
      attributes: ['id', 'duration', 'isLive', 'status'],
      include: {
        model: Occurrence,
        attributes: ['date']
      }
    });

    const {date, endDate, duration} = getWorkshopSchedule(events);
    return res.status(200).jsend.success({
      workshop: {
        ...workshop.filterFieldsFor({key: 'get', rootOnly: true}),
        date,
        endDate,
        duration,
        isInFuture: isWorkshopInFuture(events),
        eventsCount: getEventsCount(events),
        registrationsCount: workshop.registrationsCount
      },
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

