const {pick} = require('lodash');
const logger = require('../../config/log4js')('upload-post-ctrl');

const {isAdminOrOwner} = require('../../shared/permissions/middleware/upload');
const Upload = require('../../shared/database/models/upload.model');
const Event = require('../../shared/database/models/event.model');

exports.uploadPost = async function (req, res, next) {
  try {
    const {EventId} = req.body;

    const event = await Event.findByPk(EventId);

    if (!event) {
      return res.status(404).jsend.fail(new Error('Event was not found'));
    }

    if (!await isAdminOrOwner(req.user, event)) {
      return res.status(401).jsend.fail(new Error('You are unauthorised to perform this action'));
    }

    let upload = await event.getUpload();
    if (upload) {
      logger.info('Upload found updating');
      const updatedUpload = await upload.filterUpdateFieldsFor({key: 'update', data: req.body});

      return res.status(200).jsend.success({
        upload: updatedUpload.filterFieldsFor({key: 'get'}),
      });
    }

    logger.info('Creating a new upload');
    const newUpload = {
      EventId,
      ...pick(req.body, Upload.getAllowedFieldsByKey('create')),
    };
    upload = await Upload.create(newUpload);
    logger.info('New upload: ', upload);

    return res.status(200).jsend.success({
      upload: upload.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

