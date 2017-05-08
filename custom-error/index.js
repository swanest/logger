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
    let _arguments = squeezeArgs(arguments);
    for (let i = 0; i < _arguments.length; i++) {
        //Deal with string _arguments
        if (_.isString(_arguments[i]) && _arguments[i].length > 0) {
            if (_arguments[i] == "fatal" || _arguments[i] == "warning" || _arguments[i] == "notice")
                this.level = _arguments[i];
            else if (_arguments[i].length < 35 && _.camelCase(_arguments[i]) == _arguments[i])
                this.codeString = _arguments[i];
            else // a message
            {
                if (!this.message)
                    this.message = _arguments[i];
                else
                    this.message += " " + _arguments[i];
            }
        }
        else if (_.isFinite(_arguments[i]))
            this.code = _arguments[i];
        else if (_.isObject(_arguments[i]))
            this.use(_arguments[i]);
    }
    this.code = _.isFinite(this.code) ? this.code : 500;
    this.level = this.level || 'fatal';
    this.name = 'Error';
    this.isCustomError = true;
    this.stack = Error.call(this, this.message || this.codeString).stack;
    this.message = this.message || this.codeString; //a human-readable message
}

CustomError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: CustomError,
        writable: true,
        configurable: true
    }
});

function useThat(feedArray, method) {
    for (let i = 0; i < feedArray.length; i++) {
        let e = feedArray[i],
            err = _.get(e, 'error') || e;
        if (_.isObject(err) && (err instanceof Error || e.error != void 0 /* level 1 */ || e.isCustomError === true /* level 2 */)) {
            let keys;
            if (err instanceof Error && !err.isCustomError) // native JS error, so hidden properties
                keys = _.union(['message', 'stack', 'code', 'codeString', 'level', 'info', 'extra'], Object.getOwnPropertyNames(err));
            else
                keys = _.keys(err);
            for (let k of keys) {
                if (k === 'isCustomError')
                    continue;
                if (err[k] != void 0) {
                    if (_.isPlainObject(err[k])) { // e.g err.info
                        if (this.info == void 0)
                            this.info = {};
                        _[method](this.info, err[k]);
                    }
                    else {
                        if (err.message != void 0 && err.message != '' && this.message === this.codeString) {
                            this.message = err.message;
                        }
                        _[method](this, { [k]: err[k] });
                    }
                }
            }
        }
        else if (_.isPlainObject(err)) {
            if (this.info != void 0)
                _[method](this.info, err);
            else
                this.info = err;
        }
        else {
            if (this.info == void 0)
                this.info = {};
            if (!_.isArray(this.info.unclassified))
                this.info.unclassified = [];
            this.info.unclassified.push(e);
        }
    }
    return this;
};

CustomError.prototype.unstack = function unstack() {
    delete this.stack;
    return this;
};

CustomError.prototype.override = function override(...items) {
    return useThat.call(this, items, 'defaults'); // _.default(this, previousError)
};

CustomError.prototype.use = function use(...items) {
    return useThat.call(this, items, 'extend'); // _.extend(this, previousError)
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
