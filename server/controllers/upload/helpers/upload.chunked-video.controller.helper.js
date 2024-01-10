const {UploadPartCommand} = require("@aws-sdk/client-s3");
const {Op} = require('sequelize');
const logger = require('../../../config/log4js')('upload.chunked-video.controller.helper');
const {AMAZON_MIN_S3_CHUNK_SIZE, UPLOAD_MULTIPART_STATUS} = require("../../../shared/config/constants");
const {UploadMultiPart} = require("../../../shared/database/models");
const {getNumberOfMinimumS3Chunks} = require("../../../shared/utils");


exports.canUploadToS3 = function (flowChunkNumber, flowCurrentChunkSize, flowTotalChunks) {
  const numberOfChunks = getNumberOfMinimumS3Chunks(flowCurrentChunkSize);
  if (Number(flowChunkNumber) === Number(flowTotalChunks)) {
    return true;
  }
  let canUpload = !(Number(flowChunkNumber) % Number(numberOfChunks));

  return canUpload
}

async function creatChunkFromDB({
                                  EventId,
                                  flowFilename,
                                  flowChunkNumber,
                                }
) {
  const query = {
    where: {
      EventId,
      flowFilename,
      status: UPLOAD_MULTIPART_STATUS.SUCCESS.key,
      flowChunkNumber: {
        [Op.lte]: flowChunkNumber
      }
    },
    order: [
      ['flowChunkNumber', 'ASC']]
  }
  const parts = await UploadMultiPart.findAll(query);
  let dbChunk = []
  let dbChunkSize = 0
  for (const uploadPart of parts) {
    dbChunk.push(uploadPart.data);
    dbChunkSize += uploadPart.size;
  }
  return [dbChunk, dbChunkSize, parts];
}

async function uploadToAws({
                             s3,
                             params,
                             EventId,
                             flowFilename,
                             flowChunkNumber,
                             PartNumber,
                             lastPart = false
                           }) {
  const [dbChunk, dbChunkSize, parts] = await creatChunkFromDB({
    EventId,
    flowFilename,
    flowChunkNumber
  })

  //last part can be smaller
  if (!lastPart) {
    if (dbChunkSize < AMAZON_MIN_S3_CHUNK_SIZE) {
      return false;
    }
  }

  // const promisesUpdate = parts.map(async (uploadPart) => {
  //   uploadPart.status = UPLOAD_MULTIPART_STATUS.UPLOADING
  //   await uploadPart.save();
  // });
  // const uRes = await Promise.all(promisesUpdate);

  const dbChunkBuff = Buffer.concat(dbChunk);
  logger.log('uploading to s3', params);
  const upload = s3.send(new UploadPartCommand({
    ...params,
    ...{
      Body: dbChunkBuff,
      PartNumber: PartNumber,
      ContentLength: dbChunkSize
    }
  }));

  await upload;
  logger.log('uploading to s3 done', params);

  const promisesArr = parts.map(async (uploadPart) => {
    await uploadPart.destroy();

  });

  const dRes = await Promise.all(promisesArr);
  return true;
}

exports.uploadToAws = uploadToAws;
exports.creatChunkFromDB = creatChunkFromDB;
exports.getNumberOfS3Chunks = getNumberOfMinimumS3Chunks;
