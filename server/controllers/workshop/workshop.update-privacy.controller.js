const logger = require('../../config/log4js')('workshop-update-privacy-ctrl');
const UserFollowing = require('../../shared/database/models/userFollowing.model');
const User = require('../../shared/database/models/user.model');
const {enqueueMail} = require('../../shared/helpers/mailer.help');
const {isWorkshopPublished, getUserDetails, getMailSignature, isPaid} = require('../../shared/utils');
const {EVENT_STATUS, USER_STRIPE_ACCOUNT_STATUS} = require('../../shared/config/constants');
const {CONNECT_TO_STRIPE, FINISH_STRIPE_ACCOUNT} = require('../../shared/config/errors');

exports.updatePrivacy = async function (req, res, next) {
  try {
    const {workshop, user, body} = req;
    const {isPrivate} = body;

    if (isPaid(workshop.paymentType)) {
      if (!user.stripeAccountId) {
        return res.status(401).jsend.fail(new Error('Please connect to stripe first'), {error: CONNECT_TO_STRIPE});
      }

      if (user.stripeAccountStatus !== USER_STRIPE_ACCOUNT_STATUS.VERIFIED.key) {
        return res.status(401).jsend.fail(new Error('Please finish verify your Stripe account'), {error: FINISH_STRIPE_ACCOUNT});
      }
    }

    workshop.isPrivate = !!isPrivate;
    const updatedWorkshop = await workshop.save();

    if (!updatedWorkshop.isPrivate && isWorkshopPublished(updatedWorkshop.status)) {
      await sequelize.transaction(async (t) => {
        const options = {transaction: t};

        const events = await workshop.countEvents({
          where: {status: EVENT_STATUS.PUBLISHED.key},
          ...options
        });

        const channelUser = await User.findOne({where: {id: workshop.UserId}, include: User.includesForChannel});
        if (!channelUser) {
          logger.info('queue email Followed Channel activity cannot find user ' + workshop.UserId);
        }

        const userFollowings = await UserFollowing.findAll({where: {toUserId: workshop.UserId}, ...options});
        const followersCount = userFollowings.length;

        const userFollowingsPromises = userFollowings.map(async ({UserId}) => {
          const toUser = await User.findByPk(UserId, {include: User.includesForChannel, ...options});
          const method = 'getFollowedChannelActivityParams';
          return {
            signature: getMailSignature({
              email: toUser.email,
              method,
              workshopId: workshop.id,
              workshopEventCount: events.length
            }),
            method,
            rawParams: {
              type: 'workshop',
              to: toUser.email,
              channel: getUserDetails(channelUser.UserProfile, followersCount),
              isAdmin: false,
              workshopId: workshop.id,
              occurrences: occurrences,
              price: workshop.price,
              title: workshop.title,
              coverPhotoInspect: workshop.coverPhotoInspect,
              summary: workshop.summary,
              duration: duration,
              currency: workshop.currency,
              paymentType: workshop.paymentType,
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

    return res.status(200).jsend.success({isPrivate: updatedWorkshop.isPrivate});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

