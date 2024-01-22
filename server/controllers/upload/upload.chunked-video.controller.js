const Busboy = require("busboy");
const { Stream } = require("stream");
const logger = require("../../config/log4js")("upload-chunked-video-ctrl");
const { isAdminOrOwner } = require("../../shared/permissions/middleware/upload");
const Event = require("../../shared/database/models/event.model");
const { validateRequest, getAllParts } = require("./helpers/upload.video.utils");
const { UPLOAD_MULTIPART_STATUS } = require("../../shared/config/constants");
const config = require("../../config/config");
const { getS3Client } = require("../../shared/config/aws");
const { getPromise } = require("../../shared/utils/general.utils");
const { UploadMultiPart } = require("../../shared/database/models");
const { canUploadToS3, uploadToAws } = require("./helpers/upload.chunked-video.controller.helper");
const { completeMultipartUpload } = require("./helpers/upload.video.utils");
const { createFileKey } = require("server/shared/utils");

exports.uploadChunkedVideo = async function (req, res, next) {
    const s3 = getS3Client();
    const passThrough = new Stream.PassThrough();
    const chunks = [];
    const busboy = Busboy({ headers: req.headers });
    const body = {};
    const [fileStreamDonePromise, resolve, reject] = getPromise();
    busboy.on("field", function (name, val, info) {
        body[name] = val;
    });

    passThrough.on("data", (data) => {
        chunks.push(data);
    });
    busboy.on("data", (data) => {});

    busboy.on("end", function (name, file, info) {});
    busboy.on("finish", function (name, file, info) {
        resolve();
    });

    busboy.on("file", async function (name, file, info) {
        let {
            flowChunkNumber,
            flowCurrentChunkSize,
            flowTotalSize,
            flowIdentifier,
            flowFilename,
            flowTotalChunks,
            EventId,
        } = body;

        flowChunkNumber = Number(flowChunkNumber);
        flowCurrentChunkSize = Number(flowCurrentChunkSize);
        flowTotalSize = Number(flowTotalSize);
        flowTotalChunks = Number(flowTotalChunks);

        const event = await Event.findByPk(body.EventId);

        if (!event) {
            return res.status(404).jsend.fail(new Error("Event was not found"));
        }

        if (!(await isAdminOrOwner(req.user, event))) {
            return res.status(401).jsend.fail(new Error("You are unauthorised to perform this action"));
        }

        // no need here has we have it in the start controller

        // let options = {EventId};
        // if (event.WorkshopId) {
        //   options = {WorkshopId: event.WorkshopId};
        // }

        // const transactions = await hasTransactions(options);
        // if (transactions) {
        //   return res.status(400).jsend.fail(new Error('Cannot change the video, Content has purchases.'), {error: 'contentHasTransactions'});
        // }

        logger.info("body: ", body);
        const validation = validateRequest(
            flowTotalChunks,
            flowChunkNumber,
            flowCurrentChunkSize,
            flowTotalSize,
            flowIdentifier,
            flowFilename
        );

        if (validation !== "valid") {
            logger.info("validation: ", validation);
            return res.status(415).send(validation);
        }

        try {
            const params = {
                Bucket: config.s3_bucket_name,
                Key: createFileKey(EventId, flowFilename),
                UploadId: flowIdentifier,
            };

            const queryBuilder = {
                where: {
                    EventId,
                    flowFilename,
                    flowChunkNumber,
                    flowIdentifier,
                    status: UPLOAD_MULTIPART_STATUS.SUCCESS.key,
                },
            };

            const partExist = await UploadMultiPart.findOne(queryBuilder);
            logger.info(`is exist in db`, partExist);

            if (!partExist) {
                const dbPart = await UploadMultiPart.create({
                    EventId,
                    flowFilename,
                    flowIdentifier,
                    flowChunkNumber,
                    size: flowCurrentChunkSize,
                });
                file.pipe(passThrough);

                await fileStreamDonePromise;

                const chunkBuff = Buffer.concat(chunks);

                dbPart.data = chunkBuff;
                dbPart.status = UPLOAD_MULTIPART_STATUS.SUCCESS.key;

                await dbPart.save();
                logger.info(
                    `added to db: flowChunkNumber, flowTotalChunks`,
                    Number(flowChunkNumber),
                    Number(flowTotalChunks)
                );
            }

            let canUpload = canUploadToS3(flowChunkNumber, flowCurrentChunkSize, flowTotalChunks);

            if (canUpload) {
                logger.info(`canUpload flowChunkNumber `, flowChunkNumber);
                const parts = (await getAllParts(s3, params)) || [];
                let partNumber = 1;
                if (parts.length) {
                    const Part = parts[parts.length - 1];
                    const { PartNumber } = Part;
                    partNumber = Number(PartNumber) + 1;
                }

                await uploadToAws({
                    s3,
                    params,
                    EventId,
                    flowFilename,
                    flowChunkNumber,
                    PartNumber: partNumber,
                    lastPart: flowChunkNumber === flowTotalChunks,
                });
            }

            // all the parts were successfully uploaded
            if (flowChunkNumber === flowTotalChunks) {
                const uploadRes = await completeMultipartUpload({
                    s3,
                    params,
                    event,
                    EventId,
                    flowTotalSize,
                    flowFilename,
                });

                // delete all parts of all the video there were uploaded that were uploaded to the event
                // assume that each event has only one video.
                // no need to wait
                UploadMultiPart.destroy({
                    where: {
                        EventId,
                    },
                });

                busboy.end();
                return res.status(200).jsend.success({
                    upload: uploadRes,
                });
            }
            return res.status(200).send("fileDone");
        } catch (e) {
            logger.info("Error: ", e);
            // res.status(300).send(new Error('Something went wrong try again'));
            res.status(500).send(new Error("Something went wrong try again"));
        }
    });
    req.pipe(busboy);
};
