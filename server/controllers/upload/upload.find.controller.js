const logger = require('../../config/log4js')('upload-find-ctrl');
const Upload = require('../../shared/database/models/upload.model');

exports.uploadFind = async function (req, res, next, id) {
  try {
    const upload = await Upload.findOne({where: {id}});

    if (!upload) {
      return res.status(404).jsend.fail(new Error('Upload does not exist'));

    }
    req.upload = upload;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

