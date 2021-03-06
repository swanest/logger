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
                inBetweenDuration: true,
                displayLineNumber: {rootDirName: 'rockfox-lib'},
                arraySampling: 10
            }),
            levels: {
                DEBUG: true,
                INFO: true,
                WARNING: true,
                ERROR: true,
                FATAL: true
            }
        }
    }
});
// tracerA.log('Disabling logger');
// tracerA = tracerA.disable();

tracerA.kpi("abc");

if (global.CustomError == void 0)
    global.CustomError = logLib.CustomError;

if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'staging')
    tracerA.addStream('stdOut', {formatter: require("../index").formatters.json()});


let map = new Map();

let cE2 = new CustomError('error2').use(2),
    cE3 = new CustomError(JSON.parse(JSON.stringify(cE2))),
    cE4 = new CustomError(new Error('blalala'), {over:'ok'});

//console.log(JSON.stringify(cE3, null, 2));

tracerA.log('reused', cE3);
tracerA.log('reused', cE4);

tracerA.log("unclassified", new CustomError('error1')
    .override(1,
    cE2
    ), 6, true, ['arrayString']);

map.set("lala", new CustomError("test", {inner: {inner: 2}}).use({more: {more: 'lala'}}, 'test', 1));
map.set("ok", {ok: 1});
tracerA.log("Test map", map);


tracerA.log('sampled', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 56, 696, 4, 5, 6, 73, 45, 6, 7, 33, 6, 7, 494]);

let message = {
    body: [{test: 'ok'}]
};

message.circula = {
    test: {
        blabla: {}
    }
};

message.circula.test.blabla = message.circula.test;

message.body[0].message = message;
tracerA.log(message);

tracerA.log("Test Progression...");

var i = 0;
tracerA.progress(i);
setInterval(function () {
        i += 0.1;
        tracerA.progress(i);
    },
    300)

var newError = new CustomError("codeString", "my message", "next hello", 404, {info: "hello"}, {otherInfo: 3}, "warning");

tracerA.error(newError);
tracerA.log({arr: [{bebe: 1}, {hdhd: 3}]}, "cool");
tracerA
    .debug('A %s without any %s. Finally:%o', "string", "context", {toBe: "orNotToBe"})
    .info({print: "lala"})
    .fatal("next error", new Error("a fatal error occured"));

//Add now a context. Imagine an in-request coming
var request = {
    client: "Albert",
    task: "opens-the-door",
    extraInfo: {
        where: "At Albertine's"
    }
};
var tracerB = tracerA.context(request, function (req) {
    return req.client + " " + req.task;
});

var tracerC = tracerA.context(request, function (req) {
    return req.client + " " + req.task;
});

tracerC.kpi('stepOne');
tracerC.kpi('stepTwo');
tracerC.info('Blabla'); // should not include times of stepOne and stepTwo


//or tracerB = tracerA.context(request, "a string"); or tracerA.context("idContext")

//For now, stdOut stream  displays only idContext, we want to show the object extraInfo from request
//Furthermore, we want this modification to be effective only on tracerB, leaving the stdout's formatter of tracerA unchanged to be able to change the structure of the context object
tracerB.addStream("stdOut", {
    formatter: logLib.formatters.beautiful({
        //namespaceColor:"black"
        linesBetweenLogs: 1,
        environment: false,
        namespace: false,
        context: function (request) {
            return request.extraInfo;
        },
        idContext: true, //Show the idContext if any
        level: true,
        pid: false,
        date: false,
        inBetweenDuration: true
    })
});


var circular = {
    key: {
        val: 1
    }
};

circular.key.circ = circular;
tracerA.debug(circular);
tracerA.log("hello %o", circular);

//Compare two objects
tracerB.debug([1, 2, 3], [1, 2, 3, {complex: true}]);

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

tracerA.log("will be shown");


setTimeout(function () {
    tracerA.log("TracerB wont log anything anymore...");
    tracerB.removeStream("stdOut");
    tracerB.log("won't be shown");
}, 5000);

tracerA.fatal(new CustomError('myError', {abc: 123}).override(new Error('correct message')));
