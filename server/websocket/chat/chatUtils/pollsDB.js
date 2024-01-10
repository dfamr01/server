const {Op, literal, fn, col} = require("sequelize");
const {pick, isEmpty} = require("lodash");
const {Poll, PollOption, PollOptionVote, ChatRoom} = require("../../../shared/database/models");
const {POLL_STATUS, uploadOptionImage} = require("../../../shared/utils/polls.const");
const PollRoom = require("../../../shared/database/models/pollRoom.model");
const logger = require('../../../config/log4js')('PollsRoom');

async function updatePoll({
                            UserId,
                            poll = {},
                            returnElement = false
                          }
) {
  logger.info(`updatePoll: [pollsDB] UserId: ${UserId}, PollId: ${poll.id}`);

  const updatePoll = {
    ...pick(poll || {}, Poll.getAllowedFieldsByKey('update'))
  }

  const res = await Poll.update({
    ...updatePoll,
  }, {
    where: {
      id: poll.id,
      UserId,
    },
    returning: returnElement
  });

  if (returnElement) {
    const [updated, data] = res;
    return {
      updated,
      data
    }
  }

  updatePoll.id = poll.id;
  updatePoll.UserId = UserId;
  const [updated] = res;
  return {
    updated,
    data: updatePoll
  }
}


/*
create or update vote
we allow only one vote per a poll
 */
async function addPollOptionVote({
                                   UserId,
                                   PollId,
                                   PollOptionId
                                 }) {

  logger.info(`addPollOptionVote:[pollsDB] UserId: ${UserId}, PollId: ${PollId}, PollOptionId: ${PollOptionId}`);

  const [vote, created] = await PollOptionVote.upsert({
    UserId,
    PollId,
    PollOptionId

  });

  logger.info(`addPollOptionVote: [pollsDB] vote ${created ? 'create' : 'found'} `, vote);

  return {data: vote, created};
}

async function getPollOptionVotes({
                                    PollId = null,
                                    PollOptionId = null,
                                  }
) {
  logger.info(`getPollOptionVotes: [pollsDB] PollId: ${PollId} PollOptionId: ${PollOptionId}`);

  const votes = await PollOptionVote.findAll({
    where: {
      PollId,
      PollOptionId
    }
  });

  logger.info(`getPollOptionVotes: [pollsDB] PollId: ${PollId} PollOptionId: ${PollOptionId} done`, votes);
  return votes;
}

async function getPollUserVotes({
                                  UserId,
                                  PollId = null,
                                }
) {
  logger.info(`getPollUserVotes: [pollsDB] PollId: ${PollId} UserId: ${UserId}`);

  const votes = await PollOptionVote.findAll({
    where: {
      UserId,
      PollId
    }
  });

  logger.info(`getPollUserVotes: [pollsDB] PollId: ${PollId} UserId: ${UserId} done`, votes);

  return votes;
}


/*
get the poll votes and the total votes
 */
async function countPollOptionVotes({
                                      PollId
                                    }) {
  logger.info(`countPollOptionVotes: [pollsDB] PollId: ${PollId}`);

  const rows = await PollOptionVote.findAll({
    attributes: ['PollOptionId', [fn('COUNT', col('id')), 'votes'],
    ],

    group: ['PollOptionId'],
    where: {
      PollId
    },
  });
  const votes = {
    PollId,
    PollOptions: [],
    totalVotes: 0
  }
  for (const el of rows) {
    votes.PollOptions.push({
      PollOptionId: el.PollOptionId,
      votes: (+el.getDataValue('votes'))
    });

    votes.totalVotes += (+el.getDataValue('votes'));
  }

  logger.info(`countPollOptionVotes: [pollsDB] PollId: ${PollId} done`, rows);

  return votes


}

async function getPollVotes({
                              PollId = null,
                            }
) {
  logger.info(`getPollVotes: [pollsDB] PollId: ${PollId}`);

  const pollVotes = await PollOptionVote.findAll(
    {
      where: {
        PollId,
      }
    });
  logger.info(`getPollVotes: [pollsDB] PollId: ${PollId} done`, pollVotes);

  return pollVotes;
}

async function deletePoll({
                            UserId,
                            PollId,
                          }) {
  logger.info(`deletePoll: [pollsDB] UserId: ${UserId}, PollId: ${PollId}`);

  await Poll.destroy({
    where: {
      UserId,
      id: PollId,
    }
  });
  logger.info(`deletePoll: [pollsDB] UserId: ${UserId}, PollId: ${PollId} done`);

  return {
    UserId,
    PollId,
  };
}

async function getPollWithPollOptionsAndVotes({
                                                PollId,
                                              }) {
  logger.info(`getPollWithPollOptionsAndVotes: [pollsDB] PollId: ${PollId}`);

  const poll = await Poll.findOne({
    where: {
      id: PollId
    },
    include: [
      {
        model: PollOption,
        include: [PollOptionVote]

      },
    ],
  })


  logger.info(`getPollWithPollOptionsAndVotes: [pollsDB] PollId: ${PollId} done`, poll);

  return poll;
}

async function getPollWithPollOptions({
                                        PollId,
                                      }) {
  logger.info(`getPollWithPollOptions: [pollsDB] PollId: ${PollId}`);

  const poll = await Poll.findOne({
    where: {
      id: PollId
    },
    include: [
      {
        model: PollOption,
      },
    ],
  });


  logger.info(`getPollWithPollOptions: [pollsDB] PollId: ${PollId} done`, poll);

  return poll;
}

async function getPoll({
                         PollId,
                       }) {
  logger.info(`getPoll: [pollsDB] PollId: ${PollId}`);

  const poll = await Poll.findByPk(PollId)

  logger.info(`deletePoll: [pollsDB] PollId: ${PollId} done`, poll);

  return poll;
}

async function createPoll({
                            UserId,
                            poll
                          }) {
  const {
    PollOptions
  } = poll;

  logger.info(`createPoll: [pollsDB] UserId: ${UserId}, poll: ${poll}`);

  const pollOptions = [];
  let createdPoll;

  for (const option of PollOptions) {
    let [img = null, cloudResults = null] = [];
    if (option.imageData) {
      const imgBase64 = 'data:image/png;base64,' + option.imageData.toString('base64');
      [img, cloudResults] = await uploadOptionImage({
        image: imgBase64, ...poll,
      });

    }

    pollOptions.push(
      {
        ...pick(option, PollOption.getAllowedFieldsByKey('create')),
        imageDetails: cloudResults,

      },
    );
  }

  const newPoll = {
    ...pick(poll, Poll.getAllowedFieldsByKey('create')),
    UserId,
    PollOptions: pollOptions
  };

  createdPoll = await Poll.create(newPoll, {
    include: ['PollOptions']
  });


  logger.info(`createPoll: [pollsDB] UserId: ${UserId}, done`, createdPoll);

  return createdPoll;
}

async function getPolls({
                          UserId,
                          EventId = null,
                          OccurrenceId = null,
                          WorkshopId = null,
                          isOwner
                        }) {
  logger.info(`getPolls: [pollsDB] UserId: ${UserId}, EventId: ${EventId} OccurrenceId: ${OccurrenceId} WorkshopId: ${WorkshopId} isOwner: ${isOwner} `);

  let where = {};
  let order = [
    ['createdAt', 'ASC']
  ];
  if (!isOwner) {
    order = [
      ['publishedAt', 'DESC']
    ];
    where = {
      status: POLL_STATUS.PUBLISHED.key,
      [Op.or]: [
        {alwaysShow: true},
        {publishedAt: {[Op.gte]: literal(`now() - "timerInSec" * interval '1 second'`)}}
      ],
    }
  }

  const queryBuilder = {
    where: {
      UserId: UserId,
      EventId: EventId,
      OccurrenceId: OccurrenceId,
      WorkshopId: WorkshopId,
      ...where
    },
    order: order,
    include: [
      {
        model: PollOption,
        // attributes: {
        //   group: 'PollId',
        //   include: [
        //     [fn('COUNT', 'id'), 'votes']
        //   ]
        // },
        include: [PollOptionVote]

      },
    ],
  };

  let polls

  polls = await Poll.findAll(queryBuilder);
  // for (const poll of polls) {
  //   let totalVotes = 0;
  //   for (const option of poll.PollOptions) {
  //     const votes = option.PollOptionVotes.length;
  //     option.votes = votes;
  //     totalVotes += votes;
  //   }
  //   poll.totalVotes = totalVotes;
  // }

  logger.info(`getPolls: [pollsDB] UserId: ${UserId}, EventId: ${EventId} OccurrenceId: ${OccurrenceId} WorkshopId: ${WorkshopId} isOwner: ${isOwner} done`, polls);

  return polls;
}

async function createPollRoom({
                                roomId,
                                UserId,
                                roomKey,
                                EventId,
                                OccurrenceId,
                              }) {
  logger.info(`createPollRoom: roomId:${roomId} UserId: ${UserId}, EventId: ${EventId} OccurrenceId: ${OccurrenceId}`);

  const room = await PollRoom.create({
    roomId,
    roomKey,
    UserId,
    EventId,
    OccurrenceId,
  });

  return room;
}

async function deletePollRoom(roomId) {
  logger.info(`deletePollRoom: roomId:${roomId} `);

  await ChatRoom.destroy({
    where: {
      roomId
    }
  });
}

async function getAdminId(roomId) {
  const room = await PollRoom.findByPk(roomId) || {};
  if (isEmpty(room)) {
    throw new Error('room does not exit');
  }

  return room.UserId;
}

module.exports.createPollRoom = createPollRoom;
module.exports.deletePollRoom = deletePollRoom;
module.exports.getAdminId = getAdminId;
module.exports.getPolls = getPolls;
module.exports.getPoll = getPoll;
module.exports.getPollWithPollOptions = getPollWithPollOptions;
module.exports.getPollWithPollOptionsAndVotes = getPollWithPollOptionsAndVotes;
module.exports.createPoll = createPoll;
module.exports.deletePoll = deletePoll;
module.exports.addPollOptionVote = addPollOptionVote;
module.exports.countPollOptionVotes = countPollOptionVotes;
module.exports.getPollUserVotes = getPollUserVotes;
module.exports.getPollOptionVotes = getPollOptionVotes;
module.exports.updatePoll = updatePoll;
module.exports.getPollVotes = getPollVotes;