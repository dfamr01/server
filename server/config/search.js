/*
const elasticsearch = require('elasticsearch');
const _ = require('lodash');

//  const logger = require('./log4js')('search');
const config = require('./config');
const {PROFILE_TYPES} = require('./constants');

const sequelizeConnection = require('./postgre/sequelizeConnection');
const {User} = sequelizeConnection.models;


const client = new elasticsearch.Client({
  host: config.search.host,
  index: config.search.index,
  log: 'info'
});

const SPECIAL_CHAR_REGEX = /[\W]/g;
let operationCount = 0;

async function ping() {
  return await client.ping({requestTimeout: 1000}).catch(console.log);
}

function getPinId(id) {
  return 'pin_' + id;
}

function getBoardId(id) {
  return 'board_' + id;
}

function getUserId(id) {
  return 'profile_' + id;
}

function deleteIndexById(id) {
  return client.delete({
    index: 'index',
    type: 'record',
    id
  }).then(() => {
    console.log(`deindexed (id) ${id})`);
  }).catch((error) => {
    logger.debug('Delete index id error: , ' + error);
  });
}

async function deleteIndexedBoard(board) {
  if ( !board ) {
    return false;
  }
  await deleteIndexById(getBoardId(board._id));
  let i = 0;
  const l = board.media && board.media.length;

  if ( !l ) {
    return false;
  }

  for ( i; i < l; i++ ) {
    const pin = board.media[i];
    await deleteIndexById(getPinId(pin._id));
  }
}

function deleteIndexedBoardsByUserId(userId) {
  return Board.find({'user._id': userId})
    .cursor()
    .eachAsync(deleteIndexedBoard)
    .catch((error) => {
      logger.debug('couldn\'t find user id, ' + error);
    });
}

async function deleteOnlyIndexedUserById(userId) {
  await deleteIndexById(getUserId(userId));
}

async function deleteIndexedUserById(userId) {
  await deleteIndexById(getUserId(userId));
  return deleteIndexedBoardsByUserId(userId);
}

async function indexBoard(board) {
  let op = operationCount++;

  if ( !board || !board._id || !board.user || board.user.profileType !== PROFILE_TYPES.MANUFACTURER ) {
    console.log("strange - empty board", board._id);
    return board;
  }

  let docs = [];
  let pinDescriptions = [];

  board.media && board.media.forEach(pin => {
    if (!pin._id || !board.user || !board.user._id)
      return;
    let doc = {
      index: 'index',
      type: 'record',
      id: getPinId(pin._id),
      body: {
        //pin
        id: pin._id.toString(),
        type: 'pin',
        created: pin.created,
        name: pin.title,
        description: pin.description,
        thumbnail: pin.thumbnail,
        isPublic: pin.isPublic,
        //board
        boardId: board._id.toString(),
        boardName: board.title,
        boardCategory: board.category,
        boardThumbnail: board.thumbnail,
        boardIsPublic: board.isPublic,
        //profile
        profileId: board.user._id.toString(),
        profileName: board.user.name,
        profileType: board.user.profileType,
        profileThumbnail: board.user.profilePicture,
        // tags: ['y', 'z'],
      }
    };
    docs.push(doc);
  });

  let aggregatePinNames = _.map(docs, "body.name").join("\n");
  let aggregatePinDescriptions = _.map(docs, "body.description").join("\n\n");
  let doc = {
    index: 'index',
    type: 'record',
    id: getBoardId(board._id),
    body: {
      id: board._id.toString(),
      type: 'board',
      title: board.title,
      name: board.title,
      category: board.category,
      thumbnail: board.thumbnail,
      isPublic: board.isPublic,
      aggregatePinNames: aggregatePinNames,
      aggregatePinDescriptions: aggregatePinDescriptions,
      //profile
      profileId: board.user._id.toString(),
      profileName: board.user.name,
      profileType: board.user.profileType,
      profileThumbnail: board.user.profilePicture
      // tags: ['y', 'z'],
    }
  };
  docs.push(doc);

  await indexDocs(docs)
    .then((resp) => {
      updatePoolUsersAdd(board.user._id);
      console.log(`indexed board (op${op}) ${board.title} (${docs.length})`);
    })
    .catch((err) => console.log(`error ${board.title} ${err}`));

  return board;
}

function indexBoardFast(board) { //don't wait for completion
  indexBoard(board).catch(err => console.log(`indexBoardFast error(${board})`, err));
  return board;
}

async function indexUser(user) {

  if ( user.disabled ) {
    console.log('user.name: ', user.name, ' is disabled.' );
    return user;
  }

  let boards = await query("type:board AND profileId:" + user._id, 100, 0, []);
  let aggregateBoardNames = _.map(boards.hits, "name").join("\n");
  let aggregatePinNames = _.map(boards.hits, "aggregatePinNames").join("\n");
  let aggregatePinDescriptions = _.map(boards.hits, "aggregatePinDescriptions").join("\n");

  let iter = operationCount++;
  let index = {
    index: 'index',
    type: 'record',
    id: getUserId(user._id),
    body: {
      id: user._id.toString(),
      type: 'profile',
      name: user.name,
      organization: user.companySchool,
      title: user.jobTitle,
      description: user.summary,
      category: user.profileType,
      thumbnail: user.profilePicture,
      isPublic: user.isPublic,
      isDisabled: user.disabled,
      profileType: user.profileType,
      cityState: user.cityState,
      aggregateBoardNames: aggregateBoardNames,
      aggregatePinNames: aggregatePinNames,
      aggregatePinDescriptions: aggregatePinDescriptions,
    }
  };
  const response = await client.index(index);
  console.log(`indexed user  (op${iter}) ${response._id}(v${response._version}) ${index.body.name} (${boards.total})`);
  return user;
}

function indexUserFast(user) { //don't wait for completion
  indexUser(user).catch(err => console.log(`indexUser error(${user})`, err));
  return user;
}

async function indexUserAndAssetsFast(user) { //don't wait for completion
  await indexUser(user).catch(err => console.log(`indexUser error(${user})`, err));
  await Board.find({'user._id': user._id})
    .cursor()
    .eachAsync((board) => {
      return indexBoard(board);
    })
    .catch((error) => {
      logger.debug('couldn\'t find user id, ' + error);
    });
}

async function query(text, limit, offset, excludes) {
  if (!text.match(SPECIAL_CHAR_REGEX)) {
    text = text + "*";
  }
  let l = +limit || 20;
  let o = +offset || 0;
  excludes = excludes || ["aggregate*"];
  const response = await client.search({
      "index": "index",
      "body": {
        "query": {
          "query_string": {
            "query": text,
            "fuzziness": "AUTO",
            "fields": [
              "name^3",
              "description^2",
              "category^1.5",
              "profileName",
              "boardName",
              "aggregateBoardNames",
              "aggregatePinNames",
              "aggregatePinDescriptions^0.8"]
          }
        },
        "_source": {
          "excludes": excludes
        },
        "size": l,
        "from": o,
        "highlight": {
          "fields": {
            "name": {}
          }
        }
      }
    }
  );

  let hits = _.chain(response.hits.hits)
    .map(hit => hit._source)
    .filter(hit => !hit.isDiabled)
    .value();
  return {
    limit: l,
    offset: o,
    total: response.hits.total,
    hits: hits,
  };
}

async function indexDocs(docs) {
  var bulkBody = [];
  docs.forEach(doc => {
    bulkBody.push({index: {_index: doc.index, _type: doc.type, _id: doc.id}});
    bulkBody.push(doc.body);
  });

  await asyncClientBulk({body: bulkBody})
}

async function asyncClientBulk(req) {
  return new Promise((resolve, reject) => {
    client.bulk(req, (err, resp) => {
      if (resp)
        resolve(resp);
      else
        reject(err);
    })
  });
}

async function backoff(fn, retries = 10, delay = 500) {
  try {
    return fn()
  } catch (err) {
    return retries >= 1 ?
      pause(delay).then(() => b(fn, retries - 1, delay * 2)) :
      Promise.reject(err);
  }
}

const pause = (duration) => new Promise(res => setTimeout(res, duration));

//////////// updatePool

let updatePoolUsers = [];

function updatePoolUsersAdd(userId) {
  updatePoolUsers.push(userId + "");
}

async function updatePoolDrain() {
  if (!updatePoolUsers.length)
    return;

  let upuRef = updatePoolUsers;
  updatePoolUsers = [];

  let userIds = _.uniq(upuRef);

  for (let i in userIds) {
    let userId = userIds[i];
    await User.findById(userId)
      .then(result => result._doc)
      .then(user => indexUser(user))
      .catch(err => console.log(`indexUser error(${userId})`, err));
  }
}

setInterval(updatePoolDrain, 1000 * 15);

const search = {};
search.ping = ping;
search.getPinId = getPinId;
search.getBoardId = getBoardId;
search.getUserId = getUserId;
search.deleteIndexById = deleteIndexById;
search.indexUserAndAssetsFast = indexUserAndAssetsFast;
search.deleteIndexedUserById = deleteIndexedUserById;
search.deleteOnlyIndexedUserById = deleteOnlyIndexedUserById;
search.deleteIndexedBoardsByUserId = deleteIndexedBoardsByUserId;
search.deleteIndexedBoard = deleteIndexedBoard;
search.indexBoardFast = indexBoardFast;
search.indexBoard = indexBoard;
search.indexUserFast = indexUserFast;
search.indexUser = indexUser;
search.query = query;
module.exports = search;
*/
const search = {};
module.export = search;
