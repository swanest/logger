"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("../index");
let stdOutStream = {
    stream: logger.streams.stdout,
    formatter: logger.formatters.json({
        //date: true,
        namespace: 'M',
        environment: 'T',
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
    }),
    levels: {
        DEBUG: true,
        INFO: true,
        WARNING: true,
        ERROR: true,
        FATAL: true,
        PROGRESS: true,
    },
};
let tracer = new logger.Logger({
    namespace: 'myApp',
    environment: 'TEST',
    streams: {
        stdOut: stdOutStream,
    },
});
let error = new logger.CustomError('errorTest', 'this is an error message', { info: 'abc' });
let errObject = error.toObject();
tracer.log(errObject);
// tracer.log("hello year %y", moment().format("YYYY"));
// tracer.warn("hello year %y", moment().format("YYYY"));
tracer.fatal(error);
