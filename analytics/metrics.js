let metrics = {
  messages: 0,
  conflicts: 0
};

function incrementMessage() {
  metrics.messages++;
}

module.exports = { metrics, incrementMessage };