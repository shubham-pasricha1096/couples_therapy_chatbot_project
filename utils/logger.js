const { createLogger, transports, format } = require("winston");

const logger = createLogger({
  format: format.simple(),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "bot.log" })
  ]
});

module.exports = logger;