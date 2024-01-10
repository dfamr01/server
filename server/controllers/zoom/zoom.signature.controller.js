const logger = require('log4js').getLogger('zooom-signature');
const KJUR = require('jsrsasign')
const {zoom_sdk_key, zoom_sdk_secret} = require('../../config/config');

exports.signature = async function (req, res, next) {
  try {
    const {body} = req;
    let {meetingNumber, role = 0} = body;

    if (!meetingNumber) {
      return res.status(400).jsend.fail(new Error('Missing meetingNumber'));
    }

    const iat = Math.round((new Date().getTime() - 30000) / 1000);
    const exp = iat + 60 * 60 * 2;

    const oHeader = { alg: 'HS256', typ: 'JWT' };

    const oPayload = {
      sdkKey: zoom_sdk_key,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: zoom_sdk_key,
      tokenExp: iat + 60 * 60 * 2
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, zoom_sdk_secret);

    return res.status(200).jsend.success({signature});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

