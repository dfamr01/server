const { Upload } = require("@aws-sdk/lib-storage");
const Busboy = require("busboy");
const logger = require("../../config/log4js")("upload-video-ctrl");

const { isAdminOrOwner } = require("../../shared/permissions/middleware/upload");
const Event = require("../../shared/database/models/event.model");
const { UPLOAD_STATUS } = require("../../shared/config/constants");
const { hasTransactions } = require("../../shared/helpers");
const { createFileKey } = require("shared/utils");
const config = require("../../config/config");
const { getS3Client } = require("../../shared/config/aws");
const cloudStorage = require("shared/utils/cloudStorage.utils");

exports.uploadVideo = async function (req, res, next) {
    try {
        const busboy = Busboy({ headers: req.headers });
        const body = {};

        busboy.on("field", function (name, val, info) {
            body[name] = val;
        });

        busboy.on("file", async function (name, file, info) {
            try {
                const s3 = getS3Client();

                const event = await Event.findByPk(body.EventId);

                if (!event) {
                    return res.status(404).jsend.fail(new Error("Event was not found"));
                }

                if (!(await isAdminOrOwner(req.user, event))) {
                    return res.status(401).jsend.fail(new Error("You are unauthorised to perform this action"));
                }

                let options = { EventId: event.id };
                if (event.WorkshopId) {
                    options = { WorkshopId: event.WorkshopId };
                }

                const transactions = await hasTransactions(options);
                if (transactions) {
                    return res.status(400).jsend.fail(new Error("Cannot change the video, Content has purchases."), {
                        error: "contentHasTransactions",
                    });
                }

                logger.info(`File`, body);
                let params = {
                    Bucket: config.s3_bucket_name,
                    Key: `${createFileKey(body.EventId, name)}`,
                    Body: file,
                };
                const uploadLib = new Upload({
                    client: s3,
                    leavePartsOnError: false, // optional manually handle dropped parts
                    params,
                });
                const uploadDetails = {
                    EventId: body.EventId,
                    size: body.size,
                    name: name,
                    status: UPLOAD_STATUS.UPLOADING.key,
                };
                let upload = await event.getUpload();
                logger.info("Found upload", upload);
                if (upload) {
                    // only update uploads that are not complete
                    if (upload.status !== UPLOAD_STATUS.SUCCESS.key) {
                        logger.info("Upload isnt successful, updating.");
                        await upload.filterUpdateFieldsFor({ key: "updateInner", data: uploadDetails });
                    }
                } else {
                    await event.createUpload(uploadDetails);
                }
                // const res = await cloudStorage.upload(params);
                await uploadLib.done();
                logger.info("File upload complete updating: ", name);
                uploadDetails.status = UPLOAD_STATUS.SUCCESS.key;

                logger.info("upload", upload);
                if (upload.status === UPLOAD_STATUS.SUCCESS.key) {
                    logger.info("Destroying upload");
                    await upload.destroy();

                    logger.info("Destroyed creating a new upload");
                    upload = await event.createUpload(uploadDetails);
                } else {
                    upload = await upload.filterUpdateFieldsFor({ key: "updateInner", data: uploadDetails });
                }

                event.isLive = false;
                await event.save();

                return res.status(200).jsend.success({
                    upload: upload.filterFieldsFor({ key: "get" }),
                });
            } catch (e) {
                logger.error("error", e);
            }
        });

        busboy.on("close", async function () {
            logger.info(`end`);
        });

        req.pipe(busboy);
    } catch (err) {
        return res.status(500).jsend.fail(err);
    }
};
