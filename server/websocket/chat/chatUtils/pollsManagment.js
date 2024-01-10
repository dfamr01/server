const logger = require('../../../config/log4js')('pollsManagement');
const pollsDB = require("./pollsDB");
const {CHAT_ROOMS_LABELS} = require("./chat.const");

async function createRoom({id, userId, EventId, OccurrenceId}) {
  logger.info(`createRoom:[polls] create room ${id} started ${userId}`);
  if (!id || !userId) {
    logger.error(`createRoom:[polls]  ${(!id ? 'room id' : '') + (!userId ? 'userId' : '')} is not valid `);
    throw new Error('error data is missing ');
  }

  logger.info(`createRoom: preform action on room ${id} userId ${userId}`);
  try {
    await pollsDB.createPollRoom({
      roomId: id,
      UserId: userId,
      roomKey: CHAT_ROOMS_LABELS.POLLS.key,
      EventId,
      OccurrenceId,
    });
    logger.info(`createRoom: room created ${id}`);

  } catch ({message}) {
    logger.error(`createRoom: exception ${id} ${message}`);
  }

  return true;
}

async function deleteRoom({id, userId}) {
  if (!id || !userId) {
    logger.error(`deleteRoom:[polls]  ${(!id ? 'room id' : '') + (!userId ? 'adminId' : '')} is not valid `);
    throw new Error('cant delete room data is missing ');
  }
  const roomAdminId = await pollsDB.getAdminId(id);
  if (roomAdminId && roomAdminId === userId) {
    logger.info(`deleteRoom: preform action on room ${id} adminId ${userId} `);
    await pollsDB.deletePollRoom(id);
  } else {
    logger.error(`deleteRoom: user id not authorize to preform action on room ${id} adminId ${room?.adminId} userId ${adminId}`);
    throw new Error('cant delete room data is missing ');
  }

}

module.exports.createRoom = createRoom;
module.exports.deleteRoom = deleteRoom;
