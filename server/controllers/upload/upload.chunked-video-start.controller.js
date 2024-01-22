const { CreateMultipartUploadCommand } = require("@aws-sdk/client-s3");
const logger = require("../../config/log4js")("upload-chunked-video-start-ctrl");

const { isAdminOrOwner } = require("../../shared/permissions/middleware/upload");
const Event = require("../../shared/database/models/event.model");
const { hasTransactions } = require("../../shared/helpers");
const { UPLOAD_STATUS } = require("../../shared/config/constants");
const config = require("../../config/config");
const { getS3Client } = require("../../shared/config/aws");
const { UploadMultiPart } = require("../../shared/database/models");
const { createFileKey } = require("server/shared/utils");

exports.uploadChunkedVideoStart = async function (req, res, next) {
    const { EventId, fileName, fileSize } = req.body;

    try {
        logger.info("fileName: ", fileName);

        const event = await Event.findByPk(EventId);

        if (!event) {
            return res.status(404).jsend.fail(new Error("Event was not found"));
        }

        if (!(await isAdminOrOwner(req.user, event))) {
            return res.status(401).jsend.fail(new Error("You are unauthorised to perform this action"));
        }

        let options = { EventId };
        if (event.WorkshopId) {
            options = { WorkshopId: event.WorkshopId };
        }

        const transactions = await hasTransactions(options);
        if (transactions) {
            return res
                .status(400)
                .jsend.fail(new Error("Cannot change the video, Content has purchases."), {
                    error: "contentHasTransactions",
                });
        }

        const newUpload = {
            EventId,
            size: fileSize,
            name: fileName,
            status: UPLOAD_STATUS.UPLOADING.key,
        };
        let upload = await event.getUpload();
        logger.info("upload", upload);
        if (upload) {
            // only update uploads that are not complete
            if (upload.status !== UPLOAD_STATUS.SUCCESS.key) {
                logger.info("Upload found updating");
                upload = await upload.filterUpdateFieldsFor({ key: "updateInner", data: newUpload });
            }
        } else {
            upload = await event.createUpload(newUpload);
        }

        const s3 = getS3Client();

        let params = {
            Bucket: config.s3_bucket_name,
            Key: createFileKey(EventId, fileName),
        };

        // starting new upload remove all past parts of the uploads
        await UploadMultiPart.destroy({
            where: {
                EventId,
            },
        });
        const { UploadId } = await s3.send(new CreateMultipartUploadCommand(params));

        logger.info(`fileName ${fileName}, UploadId: `, UploadId);
        return res.status(200).jsend.success({ UploadId, upload });
    } catch (e) {
        logger.info(`fileName ${fileName}, Error: `, e);
        return res.status(500).jsend.error(new Error("Something went wrong."));
    }
};
