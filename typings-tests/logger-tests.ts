import {formatters as formattersGenerators, streams, Logger, Types, CustomError} from "../index";
import * as moment from "moment";

let stdOutStream: Types.Logger.Config.stdOutStreamConfig = {
    stream: streams.stdout,
    formatter: formattersGenerators.beautiful({
        namespace: "l",
        namespaceColor: "red",
        linesBetweenLogs: 2,
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

let tracer = new Logger({
    namespace: "logger",
    environment: "TEST",
    streams: {
        stdOut: stdOutStream
    }
})

//Add a new stream
tracer.addStream("rollbar", {
    formatter: formattersGenerators.rollbar(),
    stream: streams.rollbar("71e6837f9c3445e9937ea16e80b1822e", "TEST"),
    levels: {
        DEBUG: false,
        INFO: false,
        WARNING: true,
        ERROR: true,
        FATAL: true
    }
});

tracer.warn("hello year %y", moment().format("YYYY"));
tracer.err(new CustomError("errorTest", "this is an error message", {info:"abc"}));