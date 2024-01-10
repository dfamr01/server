const logger = require('../../config/log4js')('event-complete-ctrl');
const {validateEventDetails, parseErrors, isPaid} = require('../../shared/utils');
const {USER_STRIPE_ACCOUNT_STATUS} = require('../../shared/config/constants');
const {CONNECT_TO_STRIPE, FINISH_STRIPE_ACCOUNT, MISSING_PARAMS} = require('../../shared/config/errors');
const {EVENT_STATUS} = require('../../shared/config/constants');
const {hasMinimumPriceError} = require("../../shared/utils/event.utils");

exports.complete = async function (req, res, next) {
    try {
        const {event, user} = req;

        if (isPaid(event.paymentType)) {
            if (!user.stripeAccountId) {
                return res.status(401).jsend.fail(new Error('Please connect to stripe first'), {error: CONNECT_TO_STRIPE});
            }

            if (user.stripeAccountStatus !== USER_STRIPE_ACCOUNT_STATUS.VERIFIED.key) {
                return res.status(401).jsend.fail(new Error('Please finish verify your Stripe account'), {error: FINISH_STRIPE_ACCOUNT});
            }
        }

        const errors = validateEventDetails(event, user.id, user.AccessControls, event.Occurrences);
        if (Object.keys(errors).length) {
            return res.status(400).jsend.fail(new Error(parseErrors(errors, 'please fix the above issues\n')), errors);
        }

        if (event.isLive && event.Occurrences.length < 1) {
            return res.status(400).jsend.fail(new Error('Live events must have at least one date in the future.'), {error: MISSING_PARAMS});
        }

        const userSettings = await user.getUserSetting();

        const minimumPriceError = hasMinimumPriceError(event.price, event.paymentType, userSettings.currency)
        if (minimumPriceError) {
            return res.status(400).jsend.fail(new Error(minimumPriceError), {error: MISSING_PARAMS});
        }

        if (event.status === EVENT_STATUS.STARTED.key) {
            event.status = EVENT_STATUS.COMPLETED.key;
        }

        event.currency = userSettings.currency;
        const updatedEvent = await event.save();

        //update users who are registered to the occ on reschedule
        // if (event.isLive && event.Occurrences) {
        //   event.Occurrences.forEach(({id, date, _previousDataValues}) => {
        //     if (_previousDataValues.date && date !== _previousDataValues.date) {
        //       const emailOccurrences = [{id: id, date: date, isReschedule: true, prevDate: _previousDataValues.date}];
        //       //todo: fetch all the users who are registered to this occurrence
        //
        //       // transporter.sendEventRescheduleMail(
        //       //   {
        //       //     toUser: {email: toUser.email, fullName: toUser.UserProfile.fullName},
        //       //     channel: getUserDetails(channelUser.UserProfile, followersCount),
        //       //     eventId: event.id,
        //       //     occurrences: emailOccurrences,
        //       //     isLive: event.isLive,
        //       //     price: event.price,
        //       //     title: event.title,
        //       //     coverPhotoInspect: event.coverPhotoInspect,
        //       //     summary: event.summary,
        //       //     duration: event.duration,
        //       //     currency: event.currency,
        //       //     paymentType: event.paymentType,
        //       //     userTimeZone: toUser.UserSetting.timezone,
        //       //     userCurrency: toUser.UserSetting.currency,
        //       //   }
        //       // )
        //     }
        //   })
        //
        // }
        // createLobbyRoom(user.id, event.id);

        return res.status(200).jsend.success({
            event: updatedEvent.filterFieldsFor({key: 'get'}),
        });
    } catch (err) {
        logger.warn(err.stack);
        return res.status(500).jsend.fail(err);
    }
};

