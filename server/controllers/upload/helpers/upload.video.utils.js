const _ = require("lodash");
const { ListPartsCommand, CompleteMultipartUploadCommand } = require("@aws-sdk/client-s3");
const logger = require("../../../config/log4js")("upload.video.utils");
const { sortByProp } = require("../../../shared/utils/array.utils");
const { UPLOAD_STATUS, AMAZON_MIN_S3_CHUNK_SIZE } = require("../../../shared/config/constants");

exports.validateRequest = (numberOfChunks, chunkNumber, chunkSize, totalSize, identifier, filename, fileSize) => {
    // Check if the request is sane
    if (chunkNumber === 0 || chunkSize === 0 || totalSize === 0 || identifier.length === 0 || filename.length === 0) {
        return "non_resumable_request";
    }

    if (chunkNumber > numberOfChunks) {
        return "invalid_resumable_request1";
    }

    if (typeof fileSize !== "undefined") {
        if (chunkNumber < numberOfChunks && fileSize !== chunkSize) {
            // The chunk in the POST request isn't the correct size
            return "invalid_resumable_request2";
        }
        if (numberOfChunks > 1 && chunkNumber === numberOfChunks && fileSize !== (totalSize % chunkSize) + chunkSize) {
            // The chunks in the POST is the last one, and the fil is not the correct size
            return "invalid_resumable_request3";
        }
        if (numberOfChunks === 1 && fileSize !== totalSize) {
            // The file is only a single chunk, and the data size does not fit
            return "invalid_resumable_request4";
        }
    }

    return "valid";
};

function getPartNumber(flowChunkNumber, flowCurrentChunkSize) {
    const numberOfChunks = getNumberOfMinimumS3Chunks(flowCurrentChunkSize);

    return Math.trunc((flowChunkNumber - 1) / numberOfChunks) + 1;
}

async function checkIfChunkExists(s3, params, flowChunkNumber, flowCurrentChunkSize, nextPartNumberMarker) {
    logger.info(
        "checkIfChunkExists params, chunkNumber, nextPartNumberMarker",
        params,
        flowChunkNumber,
        nextPartNumberMarker
    );
    try {
        // const queryBuilder = {
        //   where: {
        //     EventId,
        //     flowFilename,
        //     flowChunkNumber: Number(flowChunkNumber),
        //     status: UPLOAD_MULTIPART_STATUS.UPLOADED.key
        //   }
        // }
        //
        // const partExist = await UploadMultiPart.findOne(queryBuilder);
        // if (partExist) {
        //   logger.info('checkIfChunkExists found part', queryBuilder);
        //   return true;
        // }
        // return false;

        if (nextPartNumberMarker) {
            logger.info("nextPartNumberMarker", nextPartNumberMarker);
            params.PartNumberMarker = nextPartNumberMarker;
        }

        let { Parts, IsTruncated, NextPartNumberMarker } = await s3.send(new ListPartsCommand(params));
        logger.info(
            "checkIfChunkExists Parts, IsTruncated, NextPartNumberMarker",
            Parts,
            IsTruncated,
            NextPartNumberMarker
        );
        const partNum = getPartNumber(flowChunkNumber, flowCurrentChunkSize);
        const foundIndex = (Parts || []).findIndex(({ PartNumber }) => PartNumber === partNum);
        // const foundIndex = (Parts || []).findIndex(({PartNumber}) => PartNumber === chunkNumber);

        if (foundIndex > -1) {
            logger.info("checkIfChunkExists found part", Parts[foundIndex]);
            return true;
        }

        if (IsTruncated && NextPartNumberMarker) {
            return await checkIfChunkExists(s3, params, flowChunkNumber, flowCurrentChunkSize, NextPartNumberMarker);
        } else {
            return false;
        }
    } catch (e) {
        logger.error("Error: ", e);
        return false;
    }
}

async function getAllParts(s3, params, nextPartNumberMarker, parts = []) {
    logger.info("getAllParts params, NextPartNumberMarker", params, nextPartNumberMarker);
    try {
        if (nextPartNumberMarker) {
            logger.info("nextPartNumberMarker", nextPartNumberMarker);
            params.PartNumberMarker = nextPartNumberMarker;
        }

        let { Parts, IsTruncated, NextPartNumberMarker } = await s3.send(new ListPartsCommand(params));
        if (!Parts) {
            return [];
        }
        parts = [...parts, ...Parts.map((part) => _.pick(part, ["ETag", "PartNumber"]))];
        logger.info("getAllParts Parts, IsTruncated, NextPartNumberMarker", Parts, IsTruncated, NextPartNumberMarker);

        if (IsTruncated && NextPartNumberMarker) {
            return await getAllParts(s3, params, nextPartNumberMarker, parts);
        } else {
            return parts.sort(sortByProp("PartNumber"));
        }
    } catch (e) {
        logger.error("Error: ", e);
        return null;
    }
}

async function completeMultipartUpload({ s3, params, event, EventId, flowTotalSize, flowFilename }) {
    const Parts = await getAllParts(s3, params);
    logger.info("calling CompleteMultipartUploadCommand: ");

    await s3.send(new CompleteMultipartUploadCommand({ ...params, MultipartUpload: { Parts } }));
    logger.info("Creating a new upload");

    const newUpload = {
        EventId,
        size: Number(flowTotalSize),
        name: flowFilename,
        status: UPLOAD_STATUS.SUCCESS.key,
    };
    let upload = await event.getUpload();
    logger.info("upload", upload);
    if (upload?.status === UPLOAD_STATUS.SUCCESS.key) {
        logger.info("Destroying upload");
        await upload?.destroy();

        logger.info("Creating a new upload");
        upload = await event.createUpload(newUpload);
    } else {
        upload = await upload.filterUpdateFieldsFor({ key: "updateInner", data: newUpload });
    }

    event.isLive = false;
    await event.save();

    logger.info("New upload created: ", upload);
    return upload.filterFieldsFor({ key: "get" });
}

// the minimum amount of chunks  need to accumulate for uploading
// e.g - chunk 0.5mg and the minimum s3 for uploading is 5mg = 10 chunks
function getNumberOfMinimumS3Chunks(flowCurrentChunkSize) {
    const numberOfChunks = Math.ceil(AMAZON_MIN_S3_CHUNK_SIZE / Number(flowCurrentChunkSize));
    return numberOfChunks;
}

exports.checkIfChunkExists = checkIfChunkExists;
exports.getNumberOfMinimumS3Chunks = getNumberOfMinimumS3Chunks;
exports.getPartNumber = getPartNumber;
exports.completeMultipartUpload = completeMultipartUpload;
exports.getAllParts = getAllParts;
