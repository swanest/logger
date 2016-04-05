var logLib = require("../index"),
    env = process.env.NODE_ENV || "development";

var tracerA = new logLib.Logger({
    namespace: "myApp", //define a namespace if you want to be able to activate, deactivate the logging module by passing DEBUG=name as environment variable
    environment: env,
    context: null,//{id:"a name that represents the context, like a sessionId", contents:{bigObject:{foo:bar}}}
    streams: {
        stdOut: {
            formatter: logLib.formatters.beautiful({
                //namespaceColor:"black"
                linesBetweenLogs: 2,
                environment: true,
                namespace: true,
                context: false, //can also be a mapping function that takes as argument context.contents and retransforms it, or true to show the complete context.contents object
                idContext: true, //Show the idContext if any
                level: true,
                pid: true,
                date: "DD/MM/YY HH:mm UTC",
                inBetweenDuration: true
            }),
            levels: {
                DEBUG: env == "development",
                INFO: true,
                WARNING: true,
                ERROR: true,
                FATAL: true
            }
        }
    }
});

tracerA
    .debug('A %s without any %s. Finally:%o', "string", "context", {toBe: "orNotToBe"})
    .info({color:"green"})
    .fatal("next error", new Error("a fatal error occured"));


//Add now a context. Imagine an in-request coming
var request = {
    client: "Albert",
    task: "opens-the-door",
    extraInfo: {
        where:"At Albertine's"
    }
};


var tracerB = tracerA.context(request, function(req){ return req.client+" "+req.task; });
//or tracerB = tracerA.context(request, "a string");

//For now, stdOut stream  displays only idContext, we want to show the object extraInfo from request
//Furthermore, we want this modification to be effective only on tracerB, leaving the stdout's formatter of tracerA unchanged to be able to change the structure of the context object
tracerB.addStream("stdOut", {
   formatter: logLib.formatters.beautiful({
       //namespaceColor:"black"
       linesBetweenLogs: 1,
       environment: false,
       namespace: false,
       context: function(request){
           return request.extraInfo;
       },
       idContext: true, //Show the idContext if any
       level: true,
       pid: false,
       date: false,
       inBetweenDuration: true
   })
});


//Add a new stream
tracerB.addStream("rollbar", {
    formatter: logLib.formatters.rollbar({
        context: function (request) {
            return request.extraInfo;
        }
    }),
    stream: logLib.streams.rollbar("a16c17a00cdf46918e2e9d1a1d0847cb", env),
    levels: {
        DEBUG: false, //not necessary to send everything to rollbar
        INFO: false,
        WARNING: true || env == "staging" || env == "production",
        ERROR: true || env == "staging" || env == "production",
        FATAL: true || env == "staging" || env == "production"
    }
});





var circular = {
    circular: circular
};
tracerA.debug(circular, "circular");

//Compare two objects
tracerB.debug([1, 2, 3], [4, 5, 6, {complex: true}]);

var e = new Error("test");
e.codeString = "missingArgument";
e.info = {fromError: true};
tracerB.fatal(
    "test %a alpha %b beta",
    {a: 1},
    2,
    {a: 1, b: {c: 2, d: {e: 5}}}, "small message", "again",
    [{a: 1, b: {c: 2, d: {e: 5}}, ks: {lsls: {hfhfj: {lsldk: 1}}}}],
    e //finally the error that includes info
);

tracerB.removeStream("stdOut", "rollbar");
tracerB.log("won't be shown");

tracerA.log("will be shown");


setTimeout(function(){}, 5000);

