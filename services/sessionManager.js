const Session = require("../models/Session");

async function getSession(userId) {

  return await Session.findOne({
    active: true,
    $or: [
      { partner1: userId },
      { partner2: userId }
    ]
  });

}

module.exports = getSession;
