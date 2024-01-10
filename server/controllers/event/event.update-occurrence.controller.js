const logger = require('../../config/log4js')('event-update-occurrence-ctrl');
const {
    getOccurrenceErrors,
    isDateInFuture,
    isEventPublished,
    isWorkshopPublished,
    dateToUtc
} = require('../../shared/utils');
const {sendEventReschedule} = require("../../shared/helpers/mailer.sendEmail");
const {updateEventScheduleEmails} = require("../../shared/helpers/mailer.help");

exports.updateOccurrence = async function (req, res, next) {
    try {
        const {event, user, body} = req;
        const {occurrenceId} = req.params;
        const {Occurrences} = event;
        let workshop = null;

        if (!Occurrences || !Occurrences.length) {
            return res.status(404).jsend.fail(new Error('Occurrences was not found'));
        }

        let occurrence = Occurrences.find((occurrence) => occurrence.id === Number(occurrenceId));
        if (occurrence) {
            if (!isDateInFuture(occurrence.date)) {
                return res.status(400).jsend.fail(new Error('Validation Error'), {occurrence: 'You cannot update past events'});
            }

            const errors = getOccurrenceErrors(event.duration, body, Occurrences);
            if (errors) {
                return res.status(400).jsend.fail(new Error(errors), errors);
            }

            if (event.WorkshopId) {
                workshop = await event.getWorkshop();
            }

            const newDate = dateToUtc(body.date);
            const currentDate = dateToUtc(occurrence.date);

            // if event or workshop is published - make sure that the new date is bigger then that occurrence's current date
            if ((!workshop && isEventPublished(event.status)) || (workshop && isWorkshopPublished(workshop.status))) {
                if (newDate.isBefore(currentDate)) {
                    return res.status(400).jsend.fail(new Error('You can only update event to the future, un-publish first then try again. '), {error: 'updateOnlyToFuture'});
                }
            }

            occurrence = await occurrence.filterUpdateFieldsFor({key: 'update', data: body});

            if (occurrence && (currentDate !== newDate)) {
                sendEventReschedule({
                    creator: user,
                    event,
                    OccurrenceId: occurrence.id,
                    date: newDate,
                    prevDate: currentDate,
                });
                updateEventScheduleEmails(
                        {
                            date: currentDate,
                            OccurrenceId: occurrence.id,
                            EventId: event.EventId,
                        });
            }

            return res.status(200).jsend.success({
                occurrence: occurrence.filterFieldsFor({key: 'get'}),
            });
        }
        return res.status(404).jsend.fail(new Error('Occurrence was not found'));
    } catch (err) {
        logger.warn(err.stack);
        return res.status(500).jsend.fail(err);
    }
};

