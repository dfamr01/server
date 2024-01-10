const {destroyEventRegistration} = require("../../shared/helpers/registration.help");
const logger = require('../../config/log4js')('event-delete-registration-ctrl');

exports.deleteRegistration = async function (req, res, next) {
    try {
        const destroyRes = await destroyEventRegistration({eventRegistration: req.eventRegistration});
        return res.status(200).jsend.success({
            res: destroyRes
        });
    } catch (err) {
        logger.warn(err.stack);
        return res.status(500).jsend.fail(err);
    }
};

