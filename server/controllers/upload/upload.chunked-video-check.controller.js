const logger = require("../../config/log4js")("upload-chunked-video-check-ctrl");

const { isAdminOrOwner } = require("../../shared/permissions/middleware/upload");
const Event = require("../../shared/database/models/event.model");
const { validateRequest, checkIfChunkExists } = require("./helpers/upload.video.utils");
const config = require("../../config/config");
const { getS3Client } = require("../../shared/config/aws");
const { completeMultipartUpload } = require("./helpers/upload.video.utils");
const { createFileKey } = require("server/shared/utils");

exports.uploadChunkedVideoCheck = async function (req, res, next) {
    try {
        const {
            flowChunkNumber,
            flowChunkSize,
            flowCurrentChunkSize,
            flowTotalSize,
            flowIdentifier,
            flowFilename,
            flowTotalChunks,
            EventId,
        } = req.query;

        const event = await Event.findByPk(EventId);

        if (!event) {
            return res.status(404).jsend.fail(new Error("Event was not found"));
        }

        if (!(await isAdminOrOwner(req.user, event))) {
            return res.status(401).jsend.fail(new Error("You are unauthorised to perform this action"));
        }

        const s3 = getS3Client();

        const validation = validateRequest(
            Number(flowTotalChunks),
            Number(flowChunkNumber),
            Number(flowCurrentChunkSize),
            Number(flowTotalSize),
            flowIdentifier,
            flowFilename
        );

        if (validation === "valid") {
            const params = {
                Bucket: config.s3_bucket_name,
                Key: createFileKey(EventId, flowFilename),
                UploadId: flowIdentifier,
            };

            const chunkExists = await checkIfChunkExists(
                s3,
                params,
                Number(flowChunkNumber),
                Number(flowCurrentChunkSize)
            );

            // const ddd = await getAllParts(s3, params)
            if (chunkExists && Number(flowChunkNumber) === Number(flowTotalChunks)) {
                logger.info("all part was uploaded last chunk need to complete", chunkExists);

                const uploadRes = await completeMultipartUpload({
                    s3,
                    params,
                    event,
                    EventId,
                    flowTotalSize,
                    flowFilename,
                });
                return res.status(200).jsend.success({
                    upload: uploadRes,
                });
            }
            logger.info("chunkExists", chunkExists);
            return res.status(chunkExists ? 200 : 400).send(chunkExists ? "found" : null);
        }

        return res.status(415).send(validation);
    } catch (e) {
        logger.info("Error: ", e);
        return res.status(415).send(new Error("Something went wrong."));
    }
};
