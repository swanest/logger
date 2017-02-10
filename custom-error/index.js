var _ = require("lodash"),
    util = require("util");


function squeezeArgs(_arguments) {
    //Format args
    let index = -1, argsIndexesToRemove = [];
    for (let i in _arguments) {
        index++;
        if (_.isString(_arguments[i])) {
            _arguments[i] = _arguments[i].replace(/%([a-z%])/g, function (match, format) {
                // if we encounter an escaped % then don't increase the array index
                if (format === '%') return match;
                index++;
                argsIndexesToRemove.push(index);
                let replacingValue = _arguments[index];
                if (_.isPlainObject(replacingValue))
                    replacingValue = util.inspect(replacingValue, {showHidden: true, depth: null});
                if (_.isFunction(replacingValue))
                    replacingValue = '[Function: ' + (replacingValue.name === '' ? 'anonymous' : replacingValue.name) + ']';
                return replacingValue;
            });
            argsIndexesToRemove.forEach(function (ind) {
                delete _arguments[ind];
            });
            argsIndexesToRemove = [];
        }
    }
    return _.map(_arguments);
}

//CustomError("codeString", "my message", "next hello", 404, {info:"hello"}, {otherInfo:3}, "warning");
function CustomError() {
    let _arguments = squeezeArgs(arguments), codeString, message, code = 500, info, level = "fatal";
    for (var i = 0; i < _arguments.length; i++) {
        //Deal with string _arguments
        if (_.isString(_arguments[i]) && _arguments[i].length > 0) {
            if (_arguments[i] == "fatal" || _arguments[i] == "warning" || _arguments[i] == "notice")
                level = _arguments[i];
            else if (_arguments[i].length < 35 && _.camelCase(_arguments[i]) == _arguments[i] && !codeString)
                codeString = _arguments[i];
            else // a message
            {
                if (!message)
                    message = _arguments[i];
                else
                    message += " " + _arguments[i];
            }
        }
        else if (_.isFinite(_arguments[i]))
            code = _arguments[i];
        else if (_.isPlainObject(_arguments[i])) {
            if (!info)
                info = {};
            _.extend(info, _arguments[i]);
        }
    }
    var temp = Error.call(this, message || codeString);
    temp.name = this.name = 'Error';
    this.isCustomError = true;
    this.stack = temp.stack;
    this.level = level; //notice,warning,fatal
    this.codeString = codeString;
    this.code = code;
    this.message = message || codeString; //a human-readable message
    this.info = info;
}

CustomError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: CustomError,
        writable: true,
        configurable: true
    }
});


CustomError.prototype.use = function use(e) {
    var err = _.get(e, 'error') || e; //Either a native errorJS or an JSONError
    if (err && (err instanceof Error || e.error != void 0 || e.isCustomError)) {

        err.message && (this.message = err.message);
        err.stack && (this.stack = err.stack);
        err.codeString && (this.codeString = err.codeString);
        err.code && (this.code = err.code);
        err.level = (this.level = err.level);

        if (err.info) {
            if (this.info)
                _.extend(this.info, err.info)
            else
                this.info = err.info;
        }
        if (err.extra) {
            if (this.info)
                _.extend(this.info, err.extra)
            else
                this.info = err.extra;
        }

    }
    else if (_.isPlainObject(err)) {
        if (this.info)
            _.extend(this.info, err)
        else
            this.info = err;
    }
    else
        throw new CustomError("unusableError");
    return this;
};

CustomError.prototype.toObject = function toObject(opts) {
    if (opts == void 0)
        opts = {};

    if (_.isFunction(opts))
        return opts.call(this);

    var obj = {
        error: {
            message: this.message,
            level: this.level,
            stack: this.stack,
            codeString: this.codeString,
            code: this.code,
            info: this.info,
            isCustomError: true
        }
    };

    if (_.isArray(opts.omit) || _.isString(opts.omit))
        obj.error = _.omit(obj.error, opts.omit);
    else if (_.isArray(opts.pick) || _.isString(opts.pick))
        obj.error = _.pick(obj.error, opts.pick);

    return obj;
};

CustomError.prototype.toJSON = CustomError.prototype.toObject;


module.exports = CustomError;
