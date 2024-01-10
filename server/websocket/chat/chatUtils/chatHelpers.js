const logger = require('../../../config/log4js')('chat-helpers');

const {
  createRoom,
  deleteRoom,
} = require('./chatManagment');


const {
  createRoom: createPollRoom,
  deleteRoom: deletePollRoom,
} = require('./pollsManagment');
const {getAdmin} = require("./chatRoomDB");
const {CHAT_ROOMS_LABELS} = require("./chat.const");


function getLobbyChatRoomId(userId, eventId, workshopId) {
  return `channel_${userId}${workshopId ? '_workshop_' + workshopId : ''}${eventId ? '_event_' + eventId : ''}_${CHAT_ROOMS_LABELS.LOBBY.value}`
}

function getEventChatRoomId(userId, eventId, occurrenceId) {
  return `channel_${userId}${eventId ? '_event_' + eventId : ''}${occurrenceId ? '_occurrence_' + occurrenceId : ''}_${CHAT_ROOMS_LABELS.EVENT.value}`
}

function getPollChatRoomId({userId, eventId, occurrenceId, workshopId}) {
  return `channel_${userId}${workshopId ? '_workshop_' + workshopId : ''}${eventId ? '_event_' + eventId : ''}${occurrenceId ? '_occurrence_' + occurrenceId : ''}_${CHAT_ROOMS_LABELS.POLLS.value}`
}

function getChannelChatRoomId(userId) {
  return `channel_${userId}_${CHAT_ROOMS_LABELS.CHANNEL.value}`;
}

exports.createChannelRoom = async (userId) => {
  const roomId = getChannelChatRoomId(userId);
  await createRoom({
    id: roomId,
    roomKey: CHAT_ROOMS_LABELS.CHANNEL.key,
    userId
  });
}

exports.createLobbyRoom = async (
  userId,
  eventId,
) => {
  const lobby = getLobbyChatRoomId(userId, eventId);
  await createRoom({
    id: lobby,
    roomKey: CHAT_ROOMS_LABELS.LOBBY.key,
    userId,
    EventId: eventId,
  });
}

exports.createEventRoom = async (
  userId,
  eventId,
  occurrenceId
) => {
  const eventRoom = getEventChatRoomId(userId, eventId, occurrenceId);

  await createRoom({
    id: eventRoom,
    roomKey: CHAT_ROOMS_LABELS.EVENT.key,
    userId,
    EventId: eventId,
    OccurrenceId: occurrenceId
  });
}


exports.createPollRoom = async (
  userId,
  eventId,
  occurrenceId,
) => {
  const pollRoomId = getPollChatRoomId({userId, eventId, occurrenceId});

  await createPollRoom({
    id: pollRoomId,
    userId,
    EventId: eventId,
    OccurrenceId: occurrenceId
  });
}

//
// exports.createEventRooms = async (
//   eventId,
//   userId,
//   occurrences,
// ) => {
//   const lobby = getLobbyChatRoomId(userId, eventId);
//   const usersRoomId = getUsersRoomId(lobby);
//
//   await createRoom({
//     id: lobby,
//     usersRoomId,
//     roomKey: CHAT_ROOMS_LABELS.LOBBY.key,
//     userId,
//     EventId: eventId,
//   });
//
//   occurrences.forEach(occurrenceId => {
//     const eventRoom = getEventChatRoomId(userId, eventId, occurrenceId);
//
//     createRoom({
//       id: eventRoom,
//       roomKey: CHAT_ROOMS_LABELS.EVENT.key,
//       userId,
//       EventId: eventId,
//       OccurrenceId: occurrenceId
//     });
//
//     const pollRoomId = getPollChatRoomId({userId, eventId, occurrenceId});
//     createPollRoom({
//       id: pollRoomId,
//       userId,
//       EventId: eventId,
//       OccurrenceId: occurrenceId
//     });
//   });
// }

exports.deleteEventRooms = (eventId, userId, occurrences) => {
  const lobby = getLobbyChatRoomId(userId, eventId);
  const UserId = getAdmin(lobby);
  if (userId !== UserId) {
    // throw new Error('delete chat room permission denied');
  }

  deleteRoom({
    id: lobby,
    userId
  });

  occurrences.forEach(occurrenceId => {
    const eventRoom = getEventChatRoomId(userId, eventId, occurrenceId)
    deleteRoom({
      id: eventRoom,
      userId
    });

    const pollRoomId = getPollChatRoomId({channelId: userId, eventId, occurrenceId});
    deletePollRoom({
      id: pollRoomId,
      userId
    });

  });
}

const getUsersRoomId = (roomId) => {
  if (roomId) {
    return roomId + '_users_room';
  }

  return null
}
module.exports.getUsersRoomId = getUsersRoomId;
