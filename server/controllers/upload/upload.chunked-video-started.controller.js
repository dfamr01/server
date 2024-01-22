const { ListPartsCommand } = require("@aws-sdk/client-s3");
const logger = require("../../config/log4js")("upload-chunked-video-started-ctrl");
const { isAdminOrOwner } = require("../../shared/permissions/middleware/upload");
const Event = require("../../shared/database/models/event.model");
const { createFileKey } = require("server/shared/utils");
const config = require("../../config/config");
const { getS3Client } = require("../../shared/config/aws");

exports.uploadChunkedVideoStarted = async function (req, res, next) {
    try {
        const { UploadId, EventId, fileName } = req.query;

        const event = await Event.findByPk(EventId);

        if (!event) {
            return res.status(404).jsend.fail(new Error("Event was not found"));
        }

        if (!(await isAdminOrOwner(req.user, event))) {
            return res.status(401).jsend.fail(new Error("You are unauthorised to perform this action"));
        }

        const s3 = getS3Client();

        const params = {
            Bucket: config.s3_bucket_name,
            Key: createFileKey(EventId, fileName),
            UploadId,
        };

        await s3.send(new ListPartsCommand(params));

        return res.status(200).send({ started: true });
    } catch (e) {
        logger.info("Error: ", e);
        return res.status(404).send({ started: false });
    }
};
