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
                FATAL: true,
                PROGRESS: true
            }
        }
    }
};

function Logger(config) {
    if (config == void 0)
        config = {};
    _.defaultsDeep(config, defaultConfig);
    config.isEnabled = config.namespace != void 0 && process.env.DEBUG != "*" && (process.env.DEBUG || "").match(config.namespace) == void 0 ? false : true;
    config.lastLogged = moment.utc();
    this.config = config;
    this.buffer = [];
    this.bufferMode = false;
    this.children = [];
    this.parent = null;
};

Logger.prototype.enable = function (recursive) {
    if (recursive)
        this.children.forEach(function (child) {
            child.enable(recursive);
        });
    this.config.isEnabled = true;
    return this;
};

Logger.prototype.disable = function (recursive) {
    if (recursive)
        this.children.forEach(function (child) {
            child.disable(recursive);
        });
    this.config.isEnabled = false;
    return this;
};

function sendToStreams(args, level) {
    if (!this.config.isEnabled)
        return this;
    if (this.bufferMode && level != "PROGRESS") {
        this.buffer.push({method: level.toLowerCase(), args: args});
        return this;
    }
    for (var s in this.config.streams) {
        if (this.config.streams[s] && this.config.streams[s].levels[level])
            this.config.streams[s].stream.write(this.config.streams[s].formatter.call(this, args, level));
    }
    this.config.lastLogged = moment.utc();
    return this;
};


Logger.prototype.startBuffer = function (recursive) {
    this.bufferMode = true;
    if (recursive)
        this.children.forEach(function (child) {
            child.startBuffer(recursive);
        });
    return this;
};

Logger.prototype.releaseBuffer = function (recursive) {
    this.bufferMode = false;
    if (recursive)
        this.children.forEach(function (child) {
            child.releaseBuffer(recursive);
        });
    var _this = this;
    _.each(_this.buffer, function (op) {
        return _this[op.method].apply(_this, op.args);
    });
    _this.buffer = [];
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

Logger.prototype.progress = function (decimal) {
    if (_.isFinite(decimal) && decimal >= 0 && decimal <= 1 && !this.inProgress)
        this.startBuffer(true), this.inProgress = true;
    if (_.isFinite(decimal) && decimal >= 0 && decimal <= 1)
        return sendToStreams.call(this, arguments, "PROGRESS");
    if (this.inProgress)
        sendToStreams.call(this, [""], "PROGRESS"), this.releaseBuffer(true), this.inProgress = false;
    return this;
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
    let child = this.copy({
        context: {
            id: _.isFunction(id) ? id(contents) : id,
            contents: contents
        }
    });
    this.children.push(child);
    child.parent = this;
    child.bufferMode = this.bufferMode;
    return child;
};

Logger.prototype.unlink = function () {
    if (_.get(this.parent != void 0))
        _.pull(this.parent.children, this);
    this.bufferMode = false;
    return this;
};

Logger.prototype.addStream = function (label, overload) {
    this.config.streams[label] = this.config.streams[label] != void 0 ? _.extend(_.clone(this.config.streams[label]), overload) : overload;
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