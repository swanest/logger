var _ = require("lodash"),
    moment = require("moment");

var defaultConfig = {
    environment: process.env.NODE_ENV || "development",
    context: null, //{id:xxxx, contents:req}
    streams: {
        stdOut: {
            stream: require("./streams").stdout,
            formatter: require("./formatters").beautiful(),
            levels: {
                DEBUG: true,
                INFO: true,
                WARNING: true,
                ERROR: true,
                FATAL: true
            }
        }
    }
};

function Logger(config, replace) {
    if (config == void 0)
        config = {};
    if (!replace)
        _.defaultsDeep(config, defaultConfig);
    config.isEnabled = config.namespace != void 0 && process.env.DEBUG != "*" && (process.env.DEBUG || "").match(config.namespace) == void 0 ? false : true;
    config.lastLogged = moment.utc();
    this.config = config;
};

Logger.prototype.enable = function () {
    this.config.isEnabled = true;
    return this;
};

Logger.prototype.disable = function () {
    this.config.isEnabled = false;
    return this;
};

Logger.prototype.config = function () {
    if (!arguments.length)
        return this.config;
    else
        this.config = arguments[0];
    return this;
};

function sendToStreams(args, level) {
    if (!this.config.isEnabled)
        return this;
    for (var s in this.config.streams) {
        if (this.config.streams[s].levels[level])
            this.config.streams[s].stream.write(this.config.streams[s].formatter.call(this, args, level));
    }
    this.config.lastLogged = moment.utc();
    return this;
};


Logger.prototype.debug = function () {
    return sendToStreams.call(this, arguments, "DEBUG");
};

Logger.prototype.log = function () {
    return sendToStreams.call(this, arguments, "DEBUG");
};

Logger.prototype.info = function () {
    return sendToStreams.call(this, arguments, "INFO");
};

Logger.prototype.warning = function () {
    return sendToStreams.call(this, arguments, "WARNING");
};

Logger.prototype.warn = function () {
    return sendToStreams.call(this, arguments, "WARNING");
};

Logger.prototype.error = function () {
    return sendToStreams.call(this, arguments, "ERROR");
};

Logger.prototype.err = function () {
    return sendToStreams.call(this, arguments, "ERROR");
};

Logger.prototype.fatal = function () {
    return sendToStreams.call(this, arguments, "FATAL");
};

Logger.prototype.copy = function (overload) {
    var config = _.clone(this.config), streams = _.clone(this.config.streams);
    config.streams = streams;
    _.extend(config, overload);
    return new Logger(config);
};


Logger.prototype.context = function (contents, id) {
    if (arguments.length == 1 && _.isString(arguments[0]))
        id = arguments[0], contents = null;
    return this.copy({
        context: {
            id: _.isFunction(id) ? id(contents) : id,
            contents: contents
        }
    });
};

Logger.prototype.addStream = function (label, overload) {
    this.config.streams[label] = this.config.streams[label] != void 0 ? _.extend(this.config.streams[label], overload) : overload;
    return this;
};

Logger.prototype.removeStream = function () {
    for (var s in arguments)
        delete this.config.streams[arguments[s]];
    return this;
};

module.exports = {
    Logger: Logger,
    streams: require("./streams"),
    formatters: require("./formatters"),
    CustomError: require("./custom-error")
};