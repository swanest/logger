import * as logger from '../index';
import CustomError = logger.CustomError;
import CustomErrorPlainObject = logger.D.CustomErrorPlainObject;


let stdOutStream: logger.D.Config.stdOutStreamConfig = {
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
        extraFormatter: (obj: any) => {
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

let error: CustomError = new logger.CustomError('errorTest', 'this is an error message', {info: 'abc'});
let errObject: CustomErrorPlainObject = error.toObject();

tracer.log(errObject);
// tracer.log("hello year %y", moment().format("YYYY"));
// tracer.warn("hello year %y", moment().format("YYYY"));
tracer.fatal(error);
