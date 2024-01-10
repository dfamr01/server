const logger = require('../../config/log4js')('event-update-privacy-ctrl');

const {enqueueMail} = require('../../shared/helpers/mailer.help');
const UserFollowing = require('../../shared/database/models/userFollowing.model');
const User = require('../../shared/database/models/user.model');
const {isEventPublished, getUserDetails, getMailSignature, isPaid} = require('../../shared/utils');
const {USER_STRIPE_ACCOUNT_STATUS} = require('../../shared/config/constants');
const {CONNECT_TO_STRIPE, FINISH_STRIPE_ACCOUNT} = require('../../shared/config/errors');


exports.updatePrivacy = async function (req, res, next) {
  try {
    const {event, user, body} = req;
    const {isPrivate} = body;

    if (isPaid(event.paymentType)) {
      if (!user.stripeAccountId) {
        return res.status(401).jsend.fail(new Error('Please connect to stripe first'), {error: CONNECT_TO_STRIPE});
      }

      if (user.stripeAccountStatus !== USER_STRIPE_ACCOUNT_STATUS.VERIFIED.key) {
        return res.status(401).jsend.fail(new Error('Please finish verify your Stripe account'), {error: FINISH_STRIPE_ACCOUNT});
      }
    }

    event.isPrivate = !!isPrivate;
    const updatedEvent = await event.save();
    const channelUser = await User.findOne({where: {id: event.UserId}, include: User.includesForChannel});

    if (!channelUser) {
      logger.info('Sent email Followed Channel activity cannot find user ' + event.UserId);
    }

    if (!updatedEvent.isPrivate && isEventPublished(updatedEvent.status) && !updatedEvent.WorkshopId) {
      const userFollowings = await UserFollowing.findAll({where: {toUserId: event.UserId}});
      const followersCount = userFollowings.length;

      await sequelize.transaction(async (t) => {
        const options = {transaction: t};
        const userFollowingsPromises = userFollowings.map(async ({UserId}) => {
          const toUser = await User.findByPk(UserId, {include: User.includesForChannel, ...options});
          const method = 'getFollowedChannelActivityParams';
          return {
            signature: getMailSignature({
              email: toUser.email,
              method,
              eventId: event.id,
              eventOccurrencesDate: event.Occurrences.map(({date}) => date)
            }),
            method,
            rawParams: {
              type: 'event',
              to: toUser.email,
              isAdmin: false,
              eventId: event.id,
              occurrences: event.Occurrences,
              isLive: event.isLive,
              price: event.price,
              title: event.title,
              coverPhotoInspect: event.coverPhotoInspect,
              summary: event.summary,
              duration: event.duration,
              channel: getUserDetails(channelUser.UserProfile, followersCount),
              userTimeZone: toUser.UserSetting.timezone,
              userCurrency: toUser.UserSetting.currency,
            }
          };
        });

        const params = await Promise.all(userFollowingsPromises);
        enqueueMail({params, transaction: t})
          .then(() => {
            logger.info('queue FollowedChannelActivityMailParams');
          });
      });
    }

    //todo: on private
    // clear all tickets
    /// refund and destroy tickets;
    //  await Ticket.destroy({where:{ EventId: event.id}, transaction: t});

    return res.status(200).jsend.success({isPrivate: updatedEvent.isPrivate});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

