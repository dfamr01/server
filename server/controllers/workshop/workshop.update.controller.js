const logger = require('../../config/log4js')('workshop-update-ctrl');

exports.update = async function (req, res, next) {
  try {
    const {workshop, body} = req;
    const {coverPhotoDetails, ...workshopDetails} = body;

    const updatedWorkshop = await workshop.filterUpdateFieldsFor({key: 'update', data: workshopDetails});

    if (body.paymentType && (body.paymentType !== workshop.paymentType)) {
      return res.status(400).jsend.fail(new Error('You cannot change payment type'), {error: 'paymentTypeNoUpdate'});
    }

    return res.status(200).jsend.success({
      workshop: updatedWorkshop.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

