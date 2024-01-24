const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const logger = require("../../config/log4js")("upload-get-signed-url-ctrl");

const config = require("../../config/config");
const { createFileKey } = require("shared/utils");
const { getS3Client } = require("../../shared/config/aws");

exports.uploadGetSignedUrl = async function (req, res, next) {
    try {
        const { user, upload } = req;

        const s3 = getS3Client();

        const params = {
            Bucket: config.s3_bucket_name,
            Key: createFileKey(upload.EventId, upload.name),
        };
        const command = new GetObjectCommand(params);

        const url = await getSignedUrl(s3, command, { expiresIn: config.s3_signed_upload_url_expires });

        return res.status(200).jsend.success({ url });
    } catch (e) {
        logger.info("Error: ", e);
        return res.status(500).jsend.error(new Error("Something went wrong."));
    }
};
