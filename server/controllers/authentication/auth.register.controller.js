const logger = require("../../config/log4js")("auth-register-ctrl");
const sequelize = require("../../config/postgre/sequelizeConnection");
const User = require("../../shared/database/models/user.model");

const { enqueueMail } = require("../../shared/helpers/mailer.help");
const { ACCESS_TOKEN_TYPES, PERMISSIONS } = require("../../shared/config/constants");
const { emailVerificationToken } = require("../../config/config");
const { generateRandomToken, getUserFullName, getMailSignature } = require("../../shared/utils");
const { createChannelRoom } = require("../../websocket/chat/chatUtils/chatHelpers");

exports.register = async function (req, res, next) {
    if (req.user) {
        return res.redirect("/");
    }

    try {
        const { password, firstName, lastName, timezone } = req.body;
        let { email } = req.body;

        email = (email && email.toLowerCase()) || null;
        const token = generateRandomToken();
        const accessToken = {
            token,
            type: ACCESS_TOKEN_TYPES.EMAIL_VERIFICATION.key,
            expireIn: emailVerificationToken.expireIn,
        };

        const newAccessControl = {
            permission: PERMISSIONS.subscription.MEMBERSHIP_FREE,
        };

        const newUser = {
            email,
            password,
            UserSetting: { timezone },
            UserProfile: { firstName, lastName },
            AccessTokens: [accessToken],
            AccessControls: [newAccessControl],
        };
        let user;
        await sequelize.transaction(async (t) => {
            const option = { transaction: t };
            user = await User.create(newUser, {
                include: ["UserSetting", "UserProfile", "AccessTokens", "AccessControls"],
                transaction: t,
            });
            const accessControl = user.AccessControls[0];
            accessControl.toUserId = user.id;
            await accessControl.save(option);

            const method = "getEmailVerificationParams";
            const params = {
                signature: getMailSignature({
                    email,
                    method,
                }),
                method,
                rawParams: {
                    to: email,
                    fullName: getUserFullName(user.UserProfile),
                    token,
                },
            };
            enqueueMail({ params, transaction: t }).then(() => {
                logger.info("queue EmailVerificationParams");
            });
            return req.login(user, next);
        });
        createChannelRoom(user.id);
    } catch (err) {
        const errors = err.errors;
        let statusCode = 500;
        if (errors && errors.length) {
            switch (errors[0].type) {
                case "unique violation":
                    statusCode = 409;
                    err.message = errors[0].message;
                    break;
                case "notNull Violation":
                case "Validation error":
                    statusCode = 422;
                    err.message = errors[0].message;
                    break;
                default:
                    break;
            }
        }

        logger.warn(err.stack);
        return res.status(statusCode).jsend.fail(err);
    }
};
