"use strict";
var logger = require("../index");
var moment = require("moment");
var stdOutStream = {
    stream: logger.streams.stdout,
    formatter: logger.formatters.beautiful({
        namespace: "l",
        namespaceColor: "red",
        linesBetweenLogs: 3,
        environment: "T",
        contentsContext: false,
        idContext: true,
        level: function (level) {
            return level.substr(0, 1);
        },
        pid: true,
        date: function () {
            return moment().format("DD/MM/YY HH:mm:ss:ms").toString();
        },
        inBetweenDuration: true
    }),
    levels: {
        DEBUG: true,
        INFO: true,
        WARNING: true,
        ERROR: true,
        FATAL: true
    }
};
var tracer = new logger.Logger({
    namespace: "logger",
    environment: "TEST",
    streams: {
        stdOut: stdOutStream
    }
});
//Add a new stream
tracer.addStream("rollbar", {
    formatter: logger.formatters.rollbar(),
    stream: logger.streams.rollbar("71e6837f9c3445e9937ea16e80b1822e", "TEST"),
    levels: {
        DEBUG: false,
        INFO: false,
        WARNING: true,
        ERROR: true,
        FATAL: true
    }
});
var error = new logger.CustomError("errorTest", "this is an error message", { info: "abc" });
var errObject = error.toObject();
tracer.log(errObject);
// tracer.log("hello year %y", moment().format("YYYY"));
// tracer.warn("hello year %y", moment().format("YYYY"));
tracer.error(error);
