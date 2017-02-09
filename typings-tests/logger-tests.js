"use strict";
const logger = require("../index");
let stdOutStream = {
    stream: logger.streams.stdout,
    formatter: logger.formatters.json({
        //internalPrefix: '__#',
        //date: true,
        namespace: 'M',
        environment: "T",
        contentsContext: false,
        idContext: true,
        level: true,
        pid: true,
        inBetweenDuration: true,
        extraFormatter: (obj) => {
            obj.severity = obj.level == 'FATAL' ? 'CRITICAL' : obj.level;
            delete obj.level;
            return obj;
        },
        displayLineNumber:false
    }),
    levels: {
        DEBUG: true,
        INFO: true,
        WARNING: true,
        ERROR: true,
        FATAL: true,
        PROGRESS: true
    }
};
let tracer = new logger.Logger({
    namespace: "myApp",
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
        FATAL: true,
        PROGRESS: true
    }
});
let error = new logger.CustomError("errorTest", "this is an error message", { info: "abc" });
let errObject = error.toObject();
tracer.log(errObject);
// tracer.log("hello year %y", moment().format("YYYY"));
// tracer.warn("hello year %y", moment().format("YYYY"));
tracer.fatal(error);
