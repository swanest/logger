var rollbar = require("rollbar");
module.exports = function createStream(apiKey, environment) {

    rollbar.init(apiKey, {
        environment: environment
    });

    return { //stream object
        write: function (loggable) {
            if (loggable.error == void 0)
                rollbar.reportMessageWithPayloadData(loggable.message, {
                    level: loggable.level,
                    extra: loggable.custom
                });
            else
                rollbar.handleErrorWithPayloadData(loggable.error, {
                    level: loggable.level,
                    extra: loggable.custom
                });
        }
    };

};