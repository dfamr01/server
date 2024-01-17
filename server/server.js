const logger = require("log4js").getLogger("server");
const config = require("./config/config");
// postgre should always go first
const postgre = require("./config/postgre");
const redis = require("./config/redis");
const websockets = require("./config/websockets");
const express = require("./config/express");
const passport = require("./config/passport");
const cloudinary = require("./config/cloudinary");
const { makeTempFolder, Currencies } = require("./shared/utils");
//const nLoger = require('./config/log4js')('SERVER');

const port = config.port;
const app = express();

//nLoger.error(`this is a server`);

postgre.then(async () => {
    makeTempFolder();
    Currencies.initializeCurrencies();
    passport();
    cloudinary();

    const server = app.listen(port, () => logger.info(`listening on port: ${port}`));
    await websockets(server);
});

module.exports = { app, postgre };

/*
const stripe = require('stripe')('sk_test_51Iln20KuNxywaQi9hJE0waKCF2WsivchNnAlrdELv1StUF57pFWJg93rXPwbHQutmG6omgdVysSDlcwICZouxmIY00VBolBWBk');
stripe.accounts.del(
  'acct_1KXqIrQMEUUa20IL'
);
*/

//const crypto = require('crypto');

//function something() {

//console.log(crypto.randomFillSync(Buffer.alloc(25)).toString('hex'));

/*
const buf = Buffer.alloc(25);
console.log(crypto.randomFillSync(buf).toString('hex'));

crypto.randomFillSync(buf);
console.log(buf.toString('hex'));

// The above is equivalent to the following:
crypto.randomFillSync(buf);
console.log(buf.toString('hex'));

/*
const a = crypto.randomBytes(48, (err, buffer) => {
  if (err) {
    return next(err);
  }

  let resetToken = buffer.toString('hex');
});

console.log('a', a);

*/
//}

//something();

/*
const transporter = require('./config/nodemailer');

async function test() {
  const mailOptions = {
    user: {
      email: 'yanivkalfa@gmail.com',
      firstName: 'yaniv'
    },
    token: 'dsi876ga9ds8fdosy8u'
  };

  //  transporter.sendEmailVerification(mailOptions).catch(console.log);
}

setTimeout(test, 10000);

*/

//  const AccessControl = require('./shared/database/models/accessControl.model');

//const UserProfile = require('./shared/database/models/userProfile.model');
//const UserSetting = require('./shared/database/models/userSetting.model');
//
//  const User = require('./shared/database/models/user.model');
//  const Event = require('./shared/database/models/event.model');
//const AccessToken = require('./shared/database/models/accessToken.model');

async function test() {
    /*
  const firstName = 'Neta';
  const lastName = 'Meta';
  const email = 'jackmaroney906@gmail.com';
  const password = 'SjwS71~!S3ha3a';

  const user = await User.create(
    {
      email,
      password,
      UserProfile: { firstName, lastName },
      UserSetting: {}
    },
    {
      include: [
        'UserProfile',
        'UserSetting'
      ]
    }
  );

  console.log('useruseruser', user);// eslint-disable-line no-console

  */
    //AccessControl
    //
    /*
  const res = await AccessControl.create({
    permission: 'EDIT_CONTENT',
    action: 'ALLOW',
    UserId: 3,
    toUserId: 1
  });
  */
    /*
  const res = await AccessControl.create({
    permission: 'VIEW_CONTENT',
    action: 'ALLOW',
    UserId: 1,
    toWorkshopId: 5
  });

  */
    ///
    //console.log('res', res);
    /*
  const allFields = [
    'permission',
    'action',
    'beginAt',
    'expireAt',
  ];

  const idFields = [
    'id',
    'UserId',
    'toUserId',
    'toEventId',
    'toWorkshopId',
    'toOccurrenceId'
  ];
  */
    //const newAccessControl = {
    //  permission: 'MEMBERSHIP_ENTERPRISE',
    //  toUserId: 1,
    //};
    //const user = await User.findByPk(1);
    //const accessControl = await user.createAccessControl(newAccessControl);
    //console.log('accessControl', accessControl);
    //accessControl.toUserId = user.id;
    //await accessControl.save();
    //console.log(user, accessControl);
    /*
  const createNew = false;

  if (createNew) {
    try {
      const newAccessControl = {
        permission: 'MEMBERSHIP_FREE',
        //  toEventId: 1
      };

      const newUser = {
        email: 'yanivkalfa3@gmail.com',
        password: 'pa',
        AccessControls: [ newAccessControl ],
      };

      const user = await User.create(newUser, { include: [ 'AccessControls' ]});
      const event = await user.createEvent();
      const accessControl = user.AccessControls[0];
      accessControl.toUserId = user.id;
      accessControl.toEventId = event.id;
      await accessControl.save();


      //  const acessControl = await AccessControl.findAll();
      console.log('accessControl', accessControl);

    } catch(e) {
      console.log('e:', e);
    }
  } else {
    try {
      //  const accessControl = await AccessControl.findAll();
      const newAccessControl = {
        permission: 'MEMBERSHIP_FREE',
        toUserId: 1,
        toEventId: 1
      };
      const user = await User.findByPk(1);
      const accessControl = await user.createAccessControl(newAccessControl);
      console.log('accessControl', accessControl);
      //accessControl.toUserId = user.id;
      //await accessControl.save();
      //console.log(user, accessControl);
    } catch(e) {
      console.log('e:', e);
    }
  }
  */
    /*
  //aaaaaaa
  console.log('Started: test');
  const firstName = 'Neta';
  const lastName = 'Meta';
  const email = 'jackmaroney906@gmail.com';
  const password = 'SjwS71~!S3ha3a';
  const timezone = 'America/Los_Angeles';

  try {

    const tokenOptions = {
      type: 'EMAIL_VERIFICATION',
      token: crypto.randomFillSync(Buffer.alloc(25)).toString('hex'),
      expireIn: 1235212321
    };

    const newUser = {
      email,
      password,
      firstName,
      lastName,
      AccessTokens: [ tokenOptions ]
    };
    const createdUser = await User.create(newUser, { include: 'AccessTokens' });
    console.log('createdUser', createdUser.AccessTokens[0].dataValues);

    /*
    const tokenOptions = {
      type: 'EMAIL_VERIFICATION',
      token: 'oad87tyb87to87gd8vtc78a6sdrti8astd67',
      expireIn: 1235212321,
      UserId: 6//createdUser.id
    };
    */
    ///const accessToken = await AccessToken.create(tokenOptions);
    //const search = { where: { email }, include: 'UserSetting'};
    //const search = { where: { email }, include: 'UserSetting'};
    //const user = await User.findByPk(1, { include: 'UserSetting'});
    //const user = await User.findOne(search);
    //console.log('user', user);
    //const user = await User.findOne({ where: { email }, include: User.includesForAuth} );
    //const usr = { email, password, UserProfile: { firstName, lastName } };
    //  const user = await User.create(usr, { include: ['UserProfile']});
    //const aser = await User.create(usr, { include: ['UserProfile']});
    //console.log('user', user);
    /*
  const user = await User.create(
    {
      email,
      password,
      UserProfile: { firstName, lastName },
      UserSetting: {}
    },
    {
      include: [
        'UserProfile',
        'UserSetting'
      ]
    }
  );

  //const something = await user.getUserProfile();

  //console.log('user', something);

  //  const bUser = await User.create({ email, password });
  //const userProfile = await UserProfile.create({ firstName, lastName, UserId: user.id });
  //const userSetting = await UserSetting.create({ UserId: user.id });
  //await userProfile.setUser(user);
  //await userSetting.setUser(user);

  //  console.log('user', user.filterFieldsFor('token', true));

  //const userProfile = await UserProfile.create({ firstName, lastName });
  //await userProfile.setUser(user);
  //const user = await User.findByPk(1);

  //
  //const userProfile = await UserProfile.findByPk(1, { include: 'User'});
  //  await userProfile.setUser(user);
  //console.log('userProfile', aUserProfile);
  //
  //const userSetting = await UserSetting.create({timezone});
  //
  //await userProfile.setUser(user);
  //await userSetting.setUser(user);

  //const aUser = await User.findByPk(1, { include: ['UserProfile', 'UserSetting' ]});
  //  console.log('aUser', aUser.filterFieldsFor('token', true));


  //e.parent.code
} catch(e) {
  console.log(e);s
}
*/
}

setTimeout(test, 10000);
